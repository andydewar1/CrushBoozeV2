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
          days: 0,
          hours: 0,
          minutes: 0,
          quitDate: null,
          loading: settingsLoading,
          error: settingsLoading ? null : 'No quit date set'
        }));
        return;
      }

      const quitDate = new Date(settings.quit_date);
      const now = new Date();
      let days = 0;
      let hours = 0;
      let minutes = 0;
      let error = null;

      if (settings.has_quit) {
        // User has already quit, calculate time since quit date
        const totalMinutesSinceQuit = Math.max(0, differenceInMinutes(now, quitDate));
        
        days = Math.floor(totalMinutesSinceQuit / (24 * 60));
        hours = Math.floor((totalMinutesSinceQuit % (24 * 60)) / 60);
        minutes = totalMinutesSinceQuit % 60;
        
        console.log('🕐 QUIT TIMER DEBUG:', {
          quitDate: quitDate.toISOString(),
          now: now.toISOString(),
          days,
          hours,
          minutes,
          has_quit: settings.has_quit
        });
      } else {
        // Check if quit date is in the future
        if (quitDate > now) {
          // Future quit date - show countdown to quit date
          const totalMinutesSinceQuit = Math.max(0, differenceInMinutes(quitDate, now));
          
          days = Math.floor(totalMinutesSinceQuit / (24 * 60));
          hours = Math.floor((totalMinutesSinceQuit % (24 * 60)) / 60);
          minutes = totalMinutesSinceQuit % 60;
          error = 'future_quit_date';
        } else {
          // Past quit date but has_quit is false - should probably be corrected
          const totalMinutesSinceQuit = Math.max(0, differenceInMinutes(now, quitDate));
          
          days = Math.floor(totalMinutesSinceQuit / (24 * 60));
          hours = Math.floor((totalMinutesSinceQuit % (24 * 60)) / 60);
          minutes = totalMinutesSinceQuit % 60;
        }
      }



      setTimer(prev => ({
        ...prev,
        days,
        hours,
        minutes,
        quitDate,
        loading: false,
        error
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
  }, [settings, settingsLoading]);

  return timer;
} 