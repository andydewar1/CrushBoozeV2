import { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface QuitTimer {
  days: number;
  hours: number;
  minutes: number;
  quitDate: Date | null;
  loading: boolean;
  error: string | null;
}

export function useQuitTimer(): QuitTimer {
  const { session } = useAuth();
  const [timer, setTimer] = useState<QuitTimer>({
    days: 0,
    hours: 0,
    minutes: 0,
    quitDate: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!session?.user?.id) {
      setTimer(prev => ({ ...prev, loading: false, error: 'No user session' }));
      return;
    }

    let isMounted = true;
    let interval: ReturnType<typeof setInterval>;

    const fetchQuitData = async () => {
      try {
        console.log('Fetching quit data for user:', session.user.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('quit_date, has_quit')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching quit data:', error);
          if (isMounted) {
            setTimer(prev => ({ 
              ...prev, 
              loading: false, 
              error: `Failed to fetch quit data: ${error.message}` 
            }));
          }
          return;
        }

        if (!data || !data.quit_date) {
          console.log('No quit data found, using fallback');
          if (isMounted) {
            setTimer(prev => ({ 
              ...prev, 
              loading: false, 
              error: 'No quit date set' 
            }));
          }
          return;
        }

        const quitDate = new Date(data.quit_date);
        console.log('Quit date found:', quitDate, 'Has quit:', data.has_quit);

        if (isMounted) {
          // Update timer immediately
          const updateTimer = () => {
            if (!isMounted) return;
            
            const now = new Date();
            let days = 0;
            let hours = 0;
            let minutes = 0;

            if (data.has_quit) {
              // User has already quit, calculate time since quit date
              days = Math.max(0, differenceInDays(now, quitDate));
              const totalHours = Math.max(0, differenceInHours(now, quitDate));
              hours = totalHours % 24;
              const totalMinutes = Math.max(0, differenceInMinutes(now, quitDate));
              minutes = totalMinutes % 60;
            } else {
              // User hasn't quit yet, show 0
              days = 0;
              hours = 0;
              minutes = 0;
            }

            setTimer({
              days,
              hours,
              minutes,
              quitDate,
              loading: false,
              error: null
            });
          };

          // Initial update
          updateTimer();

          // Update every minute
          interval = setInterval(updateTimer, 60000);
        }

      } catch (error) {
        console.error('Unexpected error fetching quit data:', error);
        if (isMounted) {
          setTimer(prev => ({ 
            ...prev, 
            loading: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }));
        }
      }
    };

    fetchQuitData();

    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [session?.user?.id]);

  return timer;
} 