import { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';

interface QuitTimer {
  days: number;
  hours: number;
  minutes: number;
  quitDate: Date | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuitTimer(): QuitTimer {
  const { settings, loading: settingsLoading } = useSettings();
  const [timer, setTimer] = useState<QuitTimer>({
    days: 0,
    hours: 0,
    minutes: 0,
    quitDate: null,
    loading: true,
    error: null,
    refetch: async () => {}
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const updateTimer = () => {
      if (!settings?.quit_date) {
        setTimer(prev => ({
          ...prev,
          loading: false,
          error: 'No quit date set'
        }));
        return;
      }

      const quitDate = new Date(settings.quit_date);
      const now = new Date();
      let days = 0;
      let hours = 0;
      let minutes = 0;

      if (settings.has_quit) {
        // User has already quit, calculate time since quit date
        days = Math.max(0, differenceInDays(now, quitDate));
        const totalHours = Math.max(0, differenceInHours(now, quitDate));
        hours = totalHours % 24;
        const totalMinutes = Math.max(0, differenceInMinutes(now, quitDate));
        minutes = totalMinutes % 60;
      }

      setTimer(prev => ({
        ...prev,
        days,
        hours,
        minutes,
        quitDate,
        loading: false,
        error: null
      }));
    };

    // Initial update
    updateTimer();

    // Update every minute
    interval = setInterval(updateTimer, 60000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [settings]);

  return timer;
} 