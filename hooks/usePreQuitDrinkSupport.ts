import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, format, startOfWeek } from 'date-fns';
import { supabase } from '@/lib/supabase';

/** Set when Supabase reports the table is missing; avoids log spam until app reload. */
let preQuitBoozeRemoteDisabled = false;
let preQuitBoozeRemoteWarned = false;

function isMissingPreQuitTableMessage(message: string): boolean {
  return /pre_quit_booze_daily|schema cache|Could not find the table/i.test(message);
}

function markPreQuitRemoteUnavailable(err: { message?: string } | null): void {
  const msg = err?.message ?? '';
  if (!isMissingPreQuitTableMessage(msg)) return;
  preQuitBoozeRemoteDisabled = true;
  if (!preQuitBoozeRemoteWarned) {
    preQuitBoozeRemoteWarned = true;
    console.warn(
      '[pre-quit drink] Remote sync disabled: table public.pre_quit_booze_daily is missing. Apply CRUSHBOOZE_PRE_QUIT_DRINK_DAILY_LIVE_MIGRATION.sql in Supabase; until then, pre-quit data stays on this device only.'
    );
  }
}

export type PrepDrinkChecklist = {
  delayFirstDrink: boolean;
  resistOneUrge: boolean;
  reviewWhy: boolean;
};

type PreQuitDayData = {
  checklist: PrepDrinkChecklist;
  drinks: number;
};

type PreQuitStore = Record<string, PreQuitDayData>;

type DbPreQuitBoozeRow = {
  day_key: string;
  drink_count: number;
  delay_first_drink: boolean;
  resist_one_urge: boolean;
  read_personal_why: boolean;
};

const defaultChecklist: PrepDrinkChecklist = {
  delayFirstDrink: false,
  resistOneUrge: false,
  reviewWhy: false,
};

const createDefaultDayData = (): PreQuitDayData => ({
  checklist: { ...defaultChecklist },
  drinks: 0,
});

const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');

function rowToDayData(row: DbPreQuitBoozeRow): PreQuitDayData {
  return {
    checklist: {
      delayFirstDrink: !!row.delay_first_drink,
      resistOneUrge: !!row.resist_one_urge,
      reviewWhy: !!row.read_personal_why,
    },
    drinks: Number.isFinite(row.drink_count) ? Math.max(0, row.drink_count) : 0,
  };
}

export function usePreQuitDrinkSupport(userId?: string, enabled = false) {
  const storageKey = useMemo(
    () => `pre_quit_drink_support_v1_${userId || 'guest'}`,
    [userId]
  );

  const [store, setStore] = useState<PreQuitStore>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setStore({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const raw = await AsyncStorage.getItem(storageKey);
        let localStore: PreQuitStore = {};
        if (raw) {
          const parsed = JSON.parse(raw) as PreQuitStore;
          localStore = parsed && typeof parsed === 'object' ? parsed : {};
        }

        if (!userId) {
          if (!cancelled) setStore(localStore);
          return;
        }

        if (preQuitBoozeRemoteDisabled) {
          if (!cancelled) setStore(localStore);
          return;
        }

        const { data, error } = await supabase
          .from('pre_quit_booze_daily')
          .select(
            'day_key,drink_count,delay_first_drink,resist_one_urge,read_personal_why'
          )
          .eq('user_id', userId)
          .order('day_key', { ascending: true });

        if (error) {
          markPreQuitRemoteUnavailable(error);
        }

        if (!error && data) {
          const remoteStore: PreQuitStore = {};
          for (const row of data as DbPreQuitBoozeRow[]) {
            remoteStore[row.day_key] = rowToDayData(row);
          }

          if (Object.keys(remoteStore).length === 0 && Object.keys(localStore).length > 0) {
            const payload = Object.entries(localStore).map(([day, dayData]) => ({
              user_id: userId,
              day_key: day,
              delay_first_drink: dayData.checklist.delayFirstDrink,
              resist_one_urge: dayData.checklist.resistOneUrge,
              read_personal_why: dayData.checklist.reviewWhy,
              drink_count: dayData.drinks,
              completed_at: Object.values(dayData.checklist).every(Boolean)
                ? new Date().toISOString()
                : null,
              updated_at: new Date().toISOString(),
            }));
            const { error: migrationError } = await supabase
              .from('pre_quit_booze_daily')
              .upsert(payload, { onConflict: 'user_id,day_key' });

            if (migrationError) {
              markPreQuitRemoteUnavailable(migrationError);
            }

            if (!migrationError) {
              if (!cancelled) {
                setStore(localStore);
                await AsyncStorage.setItem(storageKey, JSON.stringify(localStore));
              }
              return;
            }
          }

          if (!cancelled) {
            setStore(remoteStore);
            await AsyncStorage.setItem(storageKey, JSON.stringify(remoteStore));
          }
          return;
        }

        if (!cancelled) setStore(localStore);
      } catch {
        if (!cancelled) setStore({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, storageKey, userId]);

  const persist = useCallback(
    async (next: PreQuitStore) => {
      setStore(next);
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // non-blocking
      }
    },
    [storageKey]
  );

  const persistDayRemote = useCallback(
    async (day: string, dayData: PreQuitDayData) => {
      if (!userId || !enabled || preQuitBoozeRemoteDisabled) return;
      const completed = Object.values(dayData.checklist).every(Boolean);
      const { error } = await supabase.from('pre_quit_booze_daily').upsert(
        {
          user_id: userId,
          day_key: day,
          delay_first_drink: dayData.checklist.delayFirstDrink,
          resist_one_urge: dayData.checklist.resistOneUrge,
          read_personal_why: dayData.checklist.reviewWhy,
          drink_count: dayData.drinks,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,day_key' }
      );

      if (error) {
        if (isMissingPreQuitTableMessage(error.message)) {
          markPreQuitRemoteUnavailable(error);
        } else {
          console.error('[pre-quit drink] upsert failed:', error.message);
        }
      }
    },
    [userId, enabled]
  );

  const updateToday = useCallback(
    async (updater: (current: PreQuitDayData) => PreQuitDayData) => {
      if (!enabled) return;
      const today = dateKey(new Date());
      const current = store[today] ?? createDefaultDayData();
      const nextDay = updater(current);
      const nextStore = { ...store, [today]: nextDay };
      await persist(nextStore);
      await persistDayRemote(today, nextDay);
    },
    [enabled, store, persist, persistDayRemote]
  );

  const toggleChecklistItem = useCallback(
    async (item: keyof PrepDrinkChecklist) => {
      await updateToday(current => ({
        ...current,
        checklist: {
          ...current.checklist,
          [item]: !current.checklist[item],
        },
      }));
    },
    [updateToday]
  );

  const addDrink = useCallback(async () => {
    await updateToday(current => ({
      ...current,
      drinks: current.drinks + 1,
    }));
  }, [updateToday]);

  const removeDrink = useCallback(async () => {
    await updateToday(current => ({
      ...current,
      drinks: Math.max(0, current.drinks - 1),
    }));
  }, [updateToday]);

  const todayKeyLocal = dateKey(new Date());
  const todayData = store[todayKeyLocal] ?? createDefaultDayData();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDrinks = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const key = dateKey(day);
    return {
      key,
      label: format(day, 'EEE'),
      count: store[key]?.drinks ?? 0,
      isToday: key === todayKeyLocal,
    };
  });
  const weekMaxDrinks = Math.max(1, ...weekDrinks.map(d => d.count));
  const checklistCompletedCount = Object.values(todayData.checklist).filter(Boolean).length;
  const checklistTotalCount = Object.keys(todayData.checklist).length;
  const prepWeekDaysCompleted = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const key = dateKey(day);
    const dayData = store[key];
    if (!dayData) return false;
    return Object.values(dayData.checklist).every(Boolean);
  }).filter(Boolean).length;
  const prepWeekSlots = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const key = dateKey(day);
    const dayData = store[key];
    const completed = !!dayData && Object.values(dayData.checklist).every(Boolean);
    return {
      key,
      completed,
      isToday: key === todayKeyLocal,
    };
  });

  return {
    loading,
    checklist: todayData.checklist,
    checklistCompletedCount,
    checklistTotalCount,
    prepWeekDaysCompleted,
    prepWeekSlots,
    todayDrinks: todayData.drinks,
    weekDrinks,
    weekMaxDrinks,
    toggleChecklistItem,
    addDrink,
    removeDrink,
  };
}
