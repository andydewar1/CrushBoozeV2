import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface Settings {
  quit_date: string | null;
  has_quit: boolean;
  daily_cost: number;
  currency: string;
  financial_goal_amount: number;
  financial_goal_description: string;
  vape_types: any[];
  quit_reason: string | null;
  personal_goals: string[];
  quit_reasons: string[];
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<Settings>) => Promise<boolean>;
  refetchSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  error: null,
  updateSettings: async () => false,
  refetchSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          quit_date,
          has_quit,
          daily_cost,
          currency,
          financial_goal_amount,
          financial_goal_description,
          vape_types,
          quit_reason,
          personal_goals,
          quit_reasons
        `)
        .eq('id', session.user.id)
        .single();

      if (fetchError) {
        console.error('Settings fetch error:', fetchError);
        setError(fetchError.message);
        return;
      }

      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates: Partial<Settings>): Promise<boolean> => {
    if (!session?.user?.id || !settings) return false;

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Update local state
      setSettings(prev => prev ? { ...prev, ...updates } : null);

      // Trigger a refetch to ensure we have the latest data
      await fetchSettings();

      return true;
    } catch (err) {
      console.error('Error updating settings:', err);
      return false;
    }
  }, [session?.user?.id, settings, fetchSettings]);

  return (
    <SettingsContext.Provider 
      value={{
        settings,
        loading,
        error,
        updateSettings,
        refetchSettings: fetchSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
} 