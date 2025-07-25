import { useState, useEffect } from 'react';
import { differenceInMinutes } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';

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
  const { settings, loading: settingsLoading } = useSettings();
  const [moneySaved, setMoneySaved] = useState<MoneySaved>({
    totalSaved: 0,
    dailyRate: 0,
    hourlyRate: 0,
    currency: '$',
    loading: true,
    error: null
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const updateSavings = () => {
      if (!settings?.quit_date || !settings.has_quit) {
        setMoneySaved(prev => ({
          ...prev,
          loading: settingsLoading,
          currency: getCurrencySymbol(settings?.currency || 'USD'),
          error: settingsLoading ? null : 'No quit data available'
        }));
        return;
      }

      const quitDate = new Date(settings.quit_date);
      const dailyCost = settings.daily_cost || 0;
      const currencySymbol = getCurrencySymbol(settings.currency || 'USD');

      const now = new Date();
      let totalSaved = 0;

      if (settings.has_quit && dailyCost > 0) {
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

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [settings, settingsLoading]);

  return moneySaved;
} 