import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, format, startOfWeek } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/** Per-user local cache before cloud (same idea as CrushNic legacy key). */
function storageKey(userId: string | undefined): string {
  return userId
    ? `crushbooze_checkin_by_day_v1_${userId}`
    : 'crushbooze_checkin_by_day_v1_guest';
}

const MIGRATION_FLAG_PREFIX = 'crushbooze_checkin_migrated_to_supabase_v1_';

/** DB CHECK (clean, drank) — matches CRUSHBOOZE_DAILY_CHECKINS_LIVE_MIGRATION.sql */
export type DayCheckin = { status: 'clean' | 'drank'; mood?: string };

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

type DbCheckinRow = {
  day_key: string;
  status: string;
  mood: string | null;
};

function normalizeStatus(s: string): 'clean' | 'drank' {
  if (s === 'vaped' || s === 'drank') return 'drank';
  return 'clean';
}

function rowsToByDay(rows: DbCheckinRow[]): CheckinByDay {
  const out: CheckinByDay = {};
  for (const r of rows) {
    out[r.day_key] = {
      status: normalizeStatus(r.status),
      ...(r.mood ? { mood: r.mood } : {}),
    };
  }
  return out;
}

/** Legacy local rows (device-only) → Supabase once per user after sign-in. */
async function migrateLocalToSupabase(userId: string): Promise<void> {
  const flagKey = `${MIGRATION_FLAG_PREFIX}${userId}`;
  const done = await AsyncStorage.getItem(flagKey);
  if (done) return;

  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) {
    await AsyncStorage.setItem(flagKey, '1');
    return;
  }

  let parsed: Record<string, unknown> = {};
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    parsed = j && typeof j === 'object' ? j : {};
  } catch {
    await AsyncStorage.setItem(flagKey, '1');
    return;
  }

  const entries = Object.entries(parsed).filter(([, v]) => v && typeof v === 'object');
  if (entries.length === 0) {
    await AsyncStorage.setItem(flagKey, '1');
    return;
  }

  const payload = entries.map(([day_key, v]) => {
    const row = v as { status?: string; mood?: string };
    return {
      user_id: userId,
      day_key,
      status: normalizeStatus(String(row.status ?? 'clean')),
      mood: row.mood ?? null,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('daily_checkins').upsert(payload, {
    onConflict: 'user_id,day_key',
  });

  if (!error) {
    await AsyncStorage.setItem(flagKey, '1');
  } else {
    console.error('[checkin] migrate local → Supabase failed:', error.message);
  }
}

export function useCheckinHistory() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [byDay, setByDay] = useState<CheckinByDay>({});
  const [hydrated, setHydrated] = useState(false);

  const persistLocalFallback = useCallback((next: CheckinByDay) => {
    AsyncStorage.setItem(storageKey(userId), JSON.stringify(next)).catch(() => {});
  }, [userId]);

  const fetchRemote = useCallback(async () => {
    if (!userId) {
      try {
        const raw = await AsyncStorage.getItem(storageKey(undefined));
        if (!raw) {
          setByDay({});
        } else {
          const parsed = JSON.parse(raw) as CheckinByDay;
          setByDay(parsed && typeof parsed === 'object' ? parsed : {});
        }
      } catch {
        setByDay({});
      }
      setHydrated(true);
      return;
    }

    await migrateLocalToSupabase(userId);

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('day_key,status,mood')
      .eq('user_id', userId)
      .order('day_key', { ascending: true });

    if (error) {
      console.error('[checkin] fetch failed:', error.message, error);
      setByDay({});
    } else {
      setByDay(rowsToByDay((data || []) as DbCheckinRow[]));
    }
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    setHydrated(false);
    fetchRemote();
  }, [fetchRemote]);

  const todayKey = dateKey(new Date());
  const todayCheckin = byDay[todayKey];

  const recordCheckin = useCallback(
    async (status: 'clean' | 'drank', mood?: string) => {
      const key = dateKey(new Date());
      const entry: DayCheckin = { status, ...(mood ? { mood } : {}) };

      if (!userId) {
        setByDay(prev => {
          const next = { ...prev, [key]: entry };
          persistLocalFallback(next);
          return next;
        });
        return;
      }

      setByDay(prev => ({ ...prev, [key]: entry }));

      const { error } = await supabase.from('daily_checkins').upsert(
        {
          user_id: userId,
          day_key: key,
          status,
          mood: mood ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,day_key' }
      );

      if (error) {
        console.error('[checkin] upsert failed:', error.message, error);
        fetchRemote();
      }
    },
    [userId, fetchRemote, persistLocalFallback]
  );

  const clearTodayCheckin = useCallback(async () => {
    const key = dateKey(new Date());

    if (!userId) {
      setByDay(prev => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        persistLocalFallback(next);
        return next;
      });
      return;
    }

    setByDay(prev => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

    const { error } = await supabase
      .from('daily_checkins')
      .delete()
      .eq('user_id', userId)
      .eq('day_key', key);

    if (error) {
      console.error('[checkin] delete failed:', error.message, error);
      fetchRemote();
    }
  }, [userId, fetchRemote, persistLocalFallback]);

  const refresh = useCallback(() => {
    fetchRemote();
  }, [fetchRemote]);

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
