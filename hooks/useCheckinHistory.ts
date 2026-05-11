import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, format, startOfWeek } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Local-only check-in history until `daily_checkins` Supabase is wired.
 * Same surface API as CrushNic for an easy swap to remote sync later.
 */
function storageKey(userId: string | undefined): string {
  return userId
    ? `crushbooze_checkin_by_day_v1_${userId}`
    : 'crushbooze_checkin_by_day_v1_guest';
}

export type DayCheckin = { status: 'clean' | 'vaped'; mood?: string };

export type CheckinByDay = Record<string, DayCheckin>;

export const MOOD_SCORE: Record<string, number> = {
  Rough: 1,
  Okay: 2,
  Great: 3,
  Struggling: 2,
  Calm: 3,
  Strong: 3,
};

export function moodLabelFromAverage(avg: number): 'Rough' | 'Okay' | 'Great' {
  const r = Math.round(avg);
  if (r >= 3) return 'Great';
  if (r >= 2) return 'Okay';
  return 'Rough';
}

function dateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function mondayOfWeek(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 });
}

export function useCheckinHistory() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [byDay, setByDay] = useState<CheckinByDay>({});
  const [hydrated, setHydrated] = useState(false);

  const persist = useCallback(
    (next: CheckinByDay) => {
      AsyncStorage.setItem(storageKey(userId), JSON.stringify(next)).catch(() => {});
    },
    [userId]
  );

  const loadFromStorage = useCallback(async () => {
    const key = storageKey(userId);
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) {
        setByDay({});
        setHydrated(true);
        return;
      }
      const parsed = JSON.parse(raw) as CheckinByDay;
      setByDay(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setByDay({});
    }
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    setHydrated(false);
    loadFromStorage();
  }, [loadFromStorage]);

  const todayKey = dateKey(new Date());
  const todayCheckin = byDay[todayKey];

  const recordCheckin = useCallback(
    async (status: 'clean' | 'vaped', mood?: string) => {
      const keyDay = dateKey(new Date());
      const entry: DayCheckin = { status, ...(mood ? { mood } : {}) };
      setByDay(prev => {
        const next = { ...prev, [keyDay]: entry };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearTodayCheckin = useCallback(async () => {
    const keyDay = dateKey(new Date());
    setByDay(prev => {
      if (!(keyDay in prev)) return prev;
      const next = { ...prev };
      delete next[keyDay];
      persist(next);
      return next;
    });
  }, [persist]);

  const refresh = useCallback(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const currentWeekSlots = (() => {
    const mon = mondayOfWeek(new Date());
    const slots: Array<{ key: string; status: DayCheckin | null; isToday: boolean }> = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(mon, i);
      const k = dateKey(d);
      slots.push({
        key: k,
        status: byDay[k] ?? null,
        isToday: k === todayKey,
      });
    }
    return slots;
  })();

  const currentWeekCheckedCount = currentWeekSlots.filter(s => s.status !== null).length;

  const aggregateThisWeek = () => {
    const now = new Date();
    const thisMonday = mondayOfWeek(now);
    let checkins = 0;
    const moodScores: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(thisMonday, i);
      if (d > now) continue;
      const k = dateKey(d);
      const entry = byDay[k];
      if (entry) {
        checkins += 1;
        if (entry.mood && MOOD_SCORE[entry.mood] != null) {
          moodScores.push(MOOD_SCORE[entry.mood]);
        }
      }
    }
    const avgMood =
      moodScores.length > 0
        ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
        : null;
    return { checkins, avgMood };
  };

  const thisWeekStats = aggregateThisWeek();

  return {
    hydrated,
    byDay,
    todayKey,
    todayCheckin,
    recordCheckin,
    clearTodayCheckin,
    refresh,
    currentWeekSlots,
    currentWeekCheckedCount,
    thisWeekStats,
  };
}
