import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface QuitMotivation {
  quitReason: string;
  personalGoals: string[];
  quitReasons: string[];
}

export function useQuitMotivation() {
  const { settings, loading: settingsLoading, error: settingsError, updateSettings } = useSettings();
  const [motivation, setMotivation] = useState<QuitMotivation | null>(null);

  // Update local state when settings change
  useEffect(() => {
    if (settings) {
      setMotivation({
        quitReason: settings.quit_reason || '',
        personalGoals: settings.personal_goals || [],
        quitReasons: settings.quit_reasons || [],
      });
    }
  }, [settings]);

  const updateQuitReason = useCallback(async (quitReason: string): Promise<boolean> => {
    // Optimistic update
    setMotivation(prev => prev ? { ...prev, quitReason } : null);

    try {
      const success = await updateSettings({ quit_reason: quitReason });
      return success;
    } catch (err) {
      console.error('Error updating quit reason:', err);
      return false;
    }
  }, [updateSettings]);

  const updatePersonalGoals = useCallback(async (personalGoals: string[]): Promise<boolean> => {
    // Optimistic update
    setMotivation(prev => prev ? { ...prev, personalGoals } : null);

    try {
      const success = await updateSettings({ personal_goals: personalGoals });
      return success;
    } catch (err) {
      console.error('Error updating personal goals:', err);
      return false;
    }
  }, [updateSettings]);

  return {
    motivation,
    loading: settingsLoading,
    error: settingsError,
    refetch: useCallback(() => {}, []), // No need for refetch since SettingsContext handles it
    updateQuitReason,
    updatePersonalGoals,
  };
} 