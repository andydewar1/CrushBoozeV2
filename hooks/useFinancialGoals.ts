import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from './useUserData';

export interface FinancialGoal {
  id: string;
  name: string;
  target_amount: number;
  description: string | null;
  achieved_at: string | null;
  created_at: string;
}

export interface GoalsProgress {
  totalGoals: number;
  achievedGoals: number;
  activeGoals: FinancialGoal[];
  achievedGoalsList: FinancialGoal[];
  overallProgress: number;
}

export function useFinancialGoals() {
  const { session } = useAuth();
  const { userData, loading: userLoading } = useUserData();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [progress, setProgress] = useState<GoalsProgress>({
    totalGoals: 0,
    achievedGoals: 0,
    activeGoals: [],
    achievedGoalsList: [],
    overallProgress: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchFinancialGoals() {
      try {
        setLoading(true);

        // Get all financial goals for the user
        const { data: goalsData, error: goalsError } = await supabase
          .from('financial_goals')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });

        if (goalsError) throw goalsError;

        const goals = goalsData || [];
        setGoals(goals);

        // Calculate progress if we have user data (total savings)
        if (userData) {
          const totalSaved = userData.totalSaved;
          
          // Update achieved status for goals
          const updatedGoals = goals.map(goal => {
            if (!goal.achieved_at && totalSaved >= goal.target_amount) {
              // Mark goal as achieved in Supabase
              supabase
                .from('financial_goals')
                .update({ achieved_at: new Date().toISOString() })
                .eq('id', goal.id)
                .then();

              return { ...goal, achieved_at: new Date().toISOString() };
            }
            return goal;
          });

          // Split goals into active and achieved
          const activeGoals = updatedGoals.filter(g => !g.achieved_at);
          const achievedGoals = updatedGoals.filter(g => g.achieved_at);

          // Calculate overall progress
          const totalTargetAmount = updatedGoals.reduce((sum, goal) => sum + goal.target_amount, 0);
          const overallProgress = totalTargetAmount > 0 
            ? Math.min((totalSaved / totalTargetAmount) * 100, 100)
            : 0;

          setProgress({
            totalGoals: updatedGoals.length,
            achievedGoals: achievedGoals.length,
            activeGoals,
            achievedGoalsList: achievedGoals,
            overallProgress
          });
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching financial goals:', err);
        setError(err instanceof Error ? err.message : 'Failed to load financial goals');
      } finally {
        setLoading(false);
      }
    }

    fetchFinancialGoals();
  }, [session?.user?.id, userData]);

  const addFinancialGoal = async (goal: Omit<FinancialGoal, 'id' | 'achieved_at' | 'created_at'>) => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return null;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('financial_goals')
        .insert([{
          user_id: session.user.id,
          name: goal.name,
          target_amount: goal.target_amount,
          description: goal.description
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Update local state
      const newGoal = data as FinancialGoal;
      setGoals(prevGoals => [...prevGoals, newGoal]);
      
      // Update progress
      setProgress(prev => ({
        ...prev,
        totalGoals: prev.totalGoals + 1,
        activeGoals: [...prev.activeGoals, newGoal]
      }));

      return newGoal;
    } catch (err) {
      console.error('Error adding financial goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to add financial goal');
      return null;
    }
  };

  const deleteFinancialGoal = async (goalId: string) => {
    if (!session?.user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', session.user.id);

      if (deleteError) throw deleteError;

      // Update local state
      const deletedGoal = goals.find(g => g.id === goalId);
      setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
      
      // Update progress
      if (deletedGoal) {
        setProgress(prev => ({
          ...prev,
          totalGoals: prev.totalGoals - 1,
          achievedGoals: deletedGoal.achieved_at ? prev.achievedGoals - 1 : prev.achievedGoals,
          activeGoals: prev.activeGoals.filter(g => g.id !== goalId),
          achievedGoalsList: prev.achievedGoalsList.filter(g => g.id !== goalId)
        }));
      }

      return true;
    } catch (err) {
      console.error('Error deleting financial goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete financial goal');
      return false;
    }
  };

  return {
    goals,
    progress,
    loading: loading || userLoading,
    error,
    addFinancialGoal,
    deleteFinancialGoal
  };
} 