import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface UserProfile {
  quit_date: string | null
  has_quit: boolean
  daily_cost: number
  financial_goal_amount: number
  financial_goal_description: string
  currency?: string
  vape_types?: any[]
}

interface UseUserProfileResult {
  data: UserProfile | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  updateQuitDate: (quitDate: string) => Promise<boolean>
  updateDailyCost: (dailyCost: number) => Promise<boolean>
  updateCurrency: (currency: string) => Promise<boolean>
  updateVapeTypes: (vapeTypes: any[]) => Promise<boolean>
}

export function useUserProfile(): UseUserProfileResult {
  const [data, setData] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { session } = useAuth()

  useEffect(() => {
    let isMounted = true

    async function fetchProfile() {
      try {
        // Get current user
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError) {
          console.error('Auth error in useUserProfile:', authError)
          throw new Error(authError.message)
        }
        if (!authData.user) {
          console.error('No user found in auth data')
          throw new Error('No authenticated user')
        }

        console.log('Fetching profile for user:', authData.user.id)

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            quit_date,
            has_quit,
            daily_cost,
            financial_goal_amount,
            financial_goal_description,
            currency,
            vape_types
          `)
          .eq('id', authData.user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          throw new Error(profileError.message)
        }

        if (!profileData) {
          console.error('No profile data found for user')
          throw new Error('Profile not found')
        }

        console.log('Successfully fetched profile:', {
          has_quit: profileData.has_quit,
          quit_date: profileData.quit_date
        })
        
        // Only update state if component is still mounted
        if (isMounted) {
          setData(profileData)
          setError(null)
        }
      } catch (err) {
        console.error('Error in useUserProfile:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('An unknown error occurred'))
          setData(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProfile()

    // Cleanup function to prevent setting state on unmounted component
    return () => {
      isMounted = false
    }
  }, [session?.user?.id]) // Depend on user ID

  const refetch = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          quit_date,
          has_quit,
          daily_cost,
          financial_goal_amount,
          financial_goal_description,
          currency,
          vape_types
        `)
        .eq('id', session.user.id)
        .single();

      if (profileError) throw new Error(profileError.message);
      if (!profileData) throw new Error('Profile not found');

      setData(profileData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  const updateQuitDate = useCallback(async (quitDate: string): Promise<boolean> => {
    if (!session?.user?.id || !data) return false;

    const previousData = data;
    setData(prev => prev ? { ...prev, quit_date: quitDate } : null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ quit_date: quitDate })
        .eq('id', session.user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      setData(previousData);
      console.error('Error updating quit date:', err);
      return false;
    }
  }, [session?.user?.id, data]);

  const updateDailyCost = useCallback(async (dailyCost: number): Promise<boolean> => {
    if (!session?.user?.id || !data) return false;

    const previousData = data;
    setData(prev => prev ? { ...prev, daily_cost: dailyCost } : null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ daily_cost: dailyCost })
        .eq('id', session.user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      setData(previousData);
      console.error('Error updating daily cost:', err);
      return false;
    }
  }, [session?.user?.id, data]);

  const updateCurrency = useCallback(async (currency: string): Promise<boolean> => {
    if (!session?.user?.id || !data) return false;

    const previousData = data;
    setData(prev => prev ? { ...prev, currency } : null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ currency })
        .eq('id', session.user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      setData(previousData);
      console.error('Error updating currency:', err);
      return false;
    }
  }, [session?.user?.id, data]);

  const updateVapeTypes = useCallback(async (vapeTypes: any[]): Promise<boolean> => {
    if (!session?.user?.id || !data) return false;

    const previousData = data;
    setData(prev => prev ? { ...prev, vape_types: vapeTypes } : null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ vape_types: vapeTypes })
        .eq('id', session.user.id);

      if (error) throw error;
      return true;
    } catch (err) {
      setData(previousData);
      console.error('Error updating vape types:', err);
      return false;
    }
  }, [session?.user?.id, data]);

  return { 
    data, 
    loading, 
    error, 
    refetch, 
    updateQuitDate, 
    updateDailyCost, 
    updateCurrency, 
    updateVapeTypes 
  }
} 