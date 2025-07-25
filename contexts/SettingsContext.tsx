import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface UserProfile {
  id: string;
  quit_date: string;
  has_quit: boolean;
  personal_goals: string[];
  quit_reason: string;
  quit_reasons: string[];
  vape_types: any[];
  currency: string;
  daily_cost: number;
  financial_goal_description: string;
  financial_goal_amount: number;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at: string;
}

interface SettingsContextType {
  profile: UserProfile | null;
  settings: UserProfile | null; // Alias for compatibility
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refetchProfile: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  profile: null,
  settings: null,
  loading: true,
  error: null,
  updateProfile: async () => ({ success: false }),
  refetchProfile: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchProfile = useCallback(async () => {
    // Don't fetch if there's no session
    if (!session?.user?.id) {
      setLoading(false);
      setProfile(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      // If no profile exists, that's fine - user hasn't completed onboarding
      if (fetchError?.code === 'PGRST116' || !data) {
        setProfile(null);
        setError(null);
        return;
      }

      // Handle other errors
      if (fetchError) {
        console.error('Profile fetch error:', fetchError);
        setError(fetchError.message);
        return;
      }

      setProfile(data as UserProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const calculateDailyCost = (vapeTypes: UserProfile['vape_types']) => {
    return vapeTypes.reduce((total, type) => {
      const quantity = type.quantity || 0;
      const unitCost = type.unitCost || 0;
      const cost = quantity * unitCost;
      return total + (type.frequency === 'week' ? cost / 7 : cost);
    }, 0);
  };

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // If updating vape types, recalculate daily cost
      if (updates.vape_types) {
        updates.daily_cost = calculateDailyCost(updates.vape_types);
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return { success: false, error: updateError.message };
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);

      // Show success message
      toast.showSuccess('Settings Updated', 'Your changes have been saved');

      // Refetch to ensure we have the latest data
      await fetchProfile();

      return { success: true };
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }, [session?.user?.id, fetchProfile, toast]);

  return (
    <SettingsContext.Provider 
      value={{
        profile,
        settings: profile, // Alias for compatibility
        loading,
        error,
        updateProfile,
        refetchProfile: fetchProfile,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
} 