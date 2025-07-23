import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface UserProfile {
  quit_date: string | null
  has_quit: boolean
  daily_cost: number
  financial_goal_amount: number
  financial_goal_description: string
}

interface UseUserProfileResult {
  data: UserProfile | null
  loading: boolean
  error: Error | null
}

export function useUserProfile(): UseUserProfileResult {
  const [data, setData] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

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
            financial_goal_description
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
  }, []) // Empty dependency array since we only want to fetch once on mount

  return { data, loading, error }
} 