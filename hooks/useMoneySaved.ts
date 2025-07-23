import { useState, useEffect } from 'react';
import { differenceInMinutes } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface MoneySaved {
  totalSaved: number;
  dailyRate: number;
  hourlyRate: number;
  currency: string;
  loading: boolean;
  error: string | null;
}

const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'AUD': return 'A$';
    case 'CAD': return 'C$';
    default: return '$';
  }
};

export function useMoneySaved(): MoneySaved {
  const { session } = useAuth();
  const [moneySaved, setMoneySaved] = useState<MoneySaved>({
    totalSaved: 0,
    dailyRate: 0,
    hourlyRate: 0,
    currency: '$',
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!session?.user?.id) {
      setMoneySaved(prev => ({ ...prev, loading: false, error: 'No user session' }));
      return;
    }

    let isMounted = true;
    let interval: ReturnType<typeof setInterval>;

    const fetchSavingsData = async () => {
      try {
        console.log('Fetching savings data for user:', session.user.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('quit_date, has_quit, daily_cost, currency')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching savings data:', error);
          if (isMounted) {
            setMoneySaved(prev => ({ 
              ...prev, 
              loading: false, 
              error: `Failed to fetch savings data: ${error.message}` 
            }));
          }
          return;
        }

        if (!data || !data.quit_date || !data.has_quit) {
          console.log('No savings data found or user hasn\'t quit yet');
          if (isMounted) {
            setMoneySaved(prev => ({ 
              ...prev, 
              loading: false,
              currency: getCurrencySymbol(data?.currency || 'USD'),
              error: 'No quit data available'
            }));
          }
          return;
        }

        const quitDate = new Date(data.quit_date);
        const dailyCost = data.daily_cost || 0;
        const currency = data.currency || 'USD';
        const currencySymbol = getCurrencySymbol(currency);

        console.log('Savings data found:', { quitDate, dailyCost, currency, hasQuit: data.has_quit });

        if (isMounted) {
          // Update savings calculation
          const updateSavings = () => {
            if (!isMounted) return;
            
            const now = new Date();
            let totalSaved = 0;

            if (data.has_quit && dailyCost > 0) {
              // Calculate total minutes since quit
              const totalMinutes = Math.max(0, differenceInMinutes(now, quitDate));
              // Calculate savings: (minutes since quit / minutes per day) * daily cost
              totalSaved = (totalMinutes / (24 * 60)) * dailyCost;
            }

            const hourlyRate = dailyCost / 24;

            setMoneySaved({
              totalSaved: Math.max(0, totalSaved),
              dailyRate: dailyCost,
              hourlyRate,
              currency: currencySymbol,
              loading: false,
              error: null
            });
          };

          // Initial update
          updateSavings();

          // Update every minute for real-time precision
          interval = setInterval(updateSavings, 60000);
        }

      } catch (error) {
        console.error('Unexpected error fetching savings data:', error);
        if (isMounted) {
          setMoneySaved(prev => ({ 
            ...prev, 
            loading: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }));
        }
      }
    };

    fetchSavingsData();

    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [session?.user?.id]);

  return moneySaved;
} 