import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PostgrestError } from '@supabase/supabase-js'

// Strict typing for the profile data
interface UserProfile {
  id: string
  quit_date: string
  has_quit: boolean
  personal_goals: string[]
  quit_reason: string
  quit_reasons: string[]
  vape_types: any[]
  currency: string
  daily_cost: number
  financial_goal_description: string
  financial_goal_amount: number
  onboarding_completed?: boolean
  created_at: string
  updated_at: string
}

interface UseUserProfileResult {
  profile: UserProfile | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>
  updateQuitDate: (quitDate: string) => Promise<boolean>
  updateDailyCost: (dailyCost: number) => Promise<boolean>
  updateCurrency: (currency: string) => Promise<boolean>
  updateVapeTypes: (vapeTypes: any[]) => Promise<boolean>
  updateFinancialGoal: (amount: number, description: string) => Promise<boolean>
  updateQuitReason: (reason: string, reasons: string[]) => Promise<boolean>
  updatePersonalGoals: (goals: string[]) => Promise<boolean>
  updateHasQuit: (hasQuit: boolean) => Promise<boolean>
}

export function useUserProfile(): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { session } = useAuth()

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setError(profileError.message)
        setProfile(null)
      } else {
        setProfile(data)
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  // Generic update function
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!session?.user?.id || !profile) return false

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id)

      if (error) throw error

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      return true
    } catch (err) {
      console.error('Error updating profile:', err)
      return false
    }
  }, [session?.user?.id, profile])

  // Specific update functions
  const updateQuitDate = useCallback(async (quitDate: string): Promise<boolean> => {
    return updateProfile({ quit_date: quitDate })
  }, [updateProfile])

  const updateDailyCost = useCallback(async (dailyCost: number): Promise<boolean> => {
    return updateProfile({ daily_cost: dailyCost })
  }, [updateProfile])

  const updateCurrency = useCallback(async (currency: string): Promise<boolean> => {
    return updateProfile({ currency })
  }, [updateProfile])

  const updateVapeTypes = useCallback(async (vapeTypes: any[]): Promise<boolean> => {
    return updateProfile({ vape_types: vapeTypes })
  }, [updateProfile])

  const updateFinancialGoal = useCallback(async (amount: number, description: string): Promise<boolean> => {
    return updateProfile({
      financial_goal_amount: amount,
      financial_goal_description: description
    })
  }, [updateProfile])

  const updateQuitReason = useCallback(async (reason: string, reasons: string[]): Promise<boolean> => {
    return updateProfile({
      quit_reason: reason,
      quit_reasons: reasons
    })
  }, [updateProfile])

  const updatePersonalGoals = useCallback(async (goals: string[]): Promise<boolean> => {
    return updateProfile({ personal_goals: goals })
  }, [updateProfile])

  const updateHasQuit = useCallback(async (hasQuit: boolean): Promise<boolean> => {
    return updateProfile({ has_quit: hasQuit })
  }, [updateProfile])

  // Initial fetch
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Refetch wrapper that maintains the loading state
  const refetch = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    refetch,
    updateProfile,
    updateQuitDate,
    updateDailyCost,
    updateCurrency,
    updateVapeTypes,
    updateFinancialGoal,
    updateQuitReason,
    updatePersonalGoals,
    updateHasQuit
  }
}

// Export types for use in other components
export type { UserProfile } 