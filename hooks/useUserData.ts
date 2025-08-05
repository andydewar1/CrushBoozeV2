import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface VapeType {
  type: 'disposable' | 'pod' | 'liquid' | 'other';
  otherText?: string;
  quantity: number;
  frequency: 'day' | 'week';
  unitCost: number;
}

export interface UserData {
  quitDate: Date;
  vapeTypes: VapeType[];
  dailyCost: number;
  totalSaved: number;
  daysSinceQuit: number;
  hoursMinutesSinceQuit: {
    hours: number;
    minutes: number;
  };
}

export function useUserData() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    async function fetchUserData() {
      try {
        setLoading(true);

        // Get user data from Supabase
        if (!session?.user?.id) {
          throw new Error('No valid session');
        }
        
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;
        if (!user) throw new Error('User not found');

        // Calculate time since quit
        const quitDate = new Date(user.quit_date);
        const now = new Date();
        const diffMs = now.getTime() - quitDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const remainingMs = diffMs % (1000 * 60 * 60 * 24);
        const diffHours = Math.floor(remainingMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

        // Calculate money saved
        const dailyCost = user.daily_cost || 0;
        const totalSaved = (diffMs / (1000 * 60 * 60 * 24)) * dailyCost;

        setUserData({
          quitDate,
          vapeTypes: user.vape_types || [],
          dailyCost,
          totalSaved,
          daysSinceQuit: diffDays,
          hoursMinutesSinceQuit: {
            hours: diffHours,
            minutes: diffMinutes
          }
        });

        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
    // Update every minute to keep time accurate
    const interval = setInterval(fetchUserData, 60000);

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  return {
    userData,
    loading,
    error
  };
} 