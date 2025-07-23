import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface QuitMotivation {
  quitReason: string;
  personalGoals: string[];
  quitReasons: string[];
}

export function useQuitMotivation() {
  const [motivation, setMotivation] = useState<QuitMotivation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    fetchQuitMotivation();
  }, [session?.user?.id]);

  const fetchQuitMotivation = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching quit motivation for user:', session.user.id);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('quit_reason, personal_goals, quit_reasons')
        .eq('id', session.user.id)
        .single();

      if (fetchError) {
        console.error('Quit motivation fetch error:', fetchError);
        setError('Failed to fetch quit motivation');
        return;
      }

      if (data) {
        console.log('Quit motivation found:', data);
        setMotivation({
          quitReason: data.quit_reason,
          personalGoals: data.personal_goals || [],
          quitReasons: data.quit_reasons || [],
        });
      }
    } catch (err) {
      console.error('Error in useQuitMotivation:', err);
      setError('Failed to fetch quit motivation');
    } finally {
      setLoading(false);
    }
  };

  return {
    motivation,
    loading,
    error,
    refetch: fetchQuitMotivation,
  };
} 