import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface FinancialGoal {
  description: string;
  amount: number;
  currency: string;
}

export function useFinancialGoals() {
  const [financialGoal, setFinancialGoal] = useState<FinancialGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      setFinancialGoal(null);
      setError(null);
      return;
    }

    fetchFinancialGoal();
  }, [session?.user?.id]);

  const fetchFinancialGoal = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      setFinancialGoal(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('financial_goal_description, financial_goal_amount, currency')
        .eq('id', session.user.id)
        .maybeSingle();

      // Handle case where profile doesn't exist yet
      if (fetchError?.code === 'PGRST116' || !data) {
        setFinancialGoal(null);
        setError(null);
        setLoading(false);
        return;
      }

      // Handle other errors
      if (fetchError) {
        console.error('Financial goal fetch error:', fetchError);
        setError('Failed to fetch financial goal');
        setLoading(false);
        return;
      }

      setFinancialGoal({
        description: data.financial_goal_description,
        amount: data.financial_goal_amount,
        currency: data.currency,
      });
      setError(null);
    } catch (err) {
      console.error('Error in useFinancialGoals:', err);
      setError('Failed to fetch financial goal');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'AUD': return 'A$';
      case 'CAD': return 'C$';
      default: return '$';
    }
  };

  return {
    financialGoal,
    loading,
    error,
    getCurrencySymbol,
    refetch: fetchFinancialGoal,
  };
} 