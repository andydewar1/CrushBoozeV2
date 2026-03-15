import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  description: string | null;
  achieved_at: string | null;
  is_primary?: boolean;
  baseline_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGoal {
  name: string;
  target_amount: number;
  description?: string;
  is_primary?: boolean;
}

export interface UpdateGoal {
  name?: string;
  target_amount?: number;
  description?: string;
  achieved_at?: string | null;
  is_primary?: boolean;
  baseline_amount?: number;
}

interface UseGoalsReturn {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  activeGoals: Goal[];
  achievedGoals: Goal[];
  primaryGoal: Goal | null;
  createGoal: (goal: CreateGoal) => Promise<void>;
  updateGoal: (id: string, updates: UpdateGoal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  markGoalAchieved: (id: string) => Promise<void>;
  markGoalUnachieved: (id: string) => Promise<void>;
  makePrimary: (id: string, currentSaved: number) => Promise<void>;
  checkAutoAchievements: (totalSaved: number) => Promise<void>;
  calculateGoalProgress: (goal: Goal, totalSaved: number) => number;
  refetch: () => Promise<void>;
}

export function useGoals(): UseGoalsReturn {
  const { session } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let { data, error: fetchError } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      // Retry once on 401 (token expired during refresh)
      if (fetchError && fetchError.code === 'PGRST301') {
        console.log('⚠️ Got 401 error, waiting for token refresh and retrying...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = await supabase
          .from('financial_goals')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        data = result.data;
        fetchError = result.error;
      }

      if (fetchError) {
        console.error('Error fetching goals:', fetchError);
        setError('Failed to fetch goals');
        setLoading(false);
        return;
      }

      // Ensure new columns have default values if they don't exist
      const goalsWithDefaults = (data || []).map(goal => ({
        ...goal,
        is_primary: goal.is_primary ?? false,
        baseline_amount: goal.baseline_amount ?? 0,
      }));

      setGoals(goalsWithDefaults);
    } catch (err) {
      console.error('Unexpected error fetching goals:', err);
      setError('Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goal: CreateGoal) => {
    if (!session?.user?.id) {
      throw new Error('No user session');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('financial_goals')
        .insert({
          user_id: session.user.id,
          name: goal.name,
          target_amount: goal.target_amount,
          description: goal.description || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating goal:', insertError);
        throw new Error('Failed to create goal');
      }

      setGoals(prev => [data, ...prev]);
    } catch (err) {
      console.error('Error in createGoal:', err);
      throw err;
    }
  };

  const updateGoal = async (id: string, updates: UpdateGoal) => {
    try {
      const { data, error: updateError } = await supabase
        .from('financial_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating goal:', updateError);
        throw new Error('Failed to update goal');
      }

      setGoals(prev => prev.map(goal => goal.id === id ? data : goal));
    } catch (err) {
      console.error('Error in updateGoal:', err);
      throw err;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting goal:', deleteError);
        throw new Error('Failed to delete goal');
      }

      setGoals(prev => prev.filter(goal => goal.id !== id));
    } catch (err) {
      console.error('Error in deleteGoal:', err);
      throw err;
    }
  };

  const markGoalAchieved = async (id: string) => {
    await updateGoal(id, { achieved_at: new Date().toISOString() });
  };

  const markGoalUnachieved = async (id: string) => {
    await updateGoal(id, { achieved_at: null });
  };

  const makePrimary = async (id: string, currentSaved: number) => {
    if (!session?.user?.id) {
      throw new Error('No user session');
    }

    try {
      // First, unset any existing primary goal
      await supabase
        .from('financial_goals')
        .update({ is_primary: false })
        .eq('user_id', session.user.id)
        .eq('is_primary', true);

      // Then set the new primary goal with current savings as baseline
      const { data, error: updateError } = await supabase
        .from('financial_goals')
        .update({ 
          is_primary: true, 
          baseline_amount: currentSaved,
          achieved_at: null // Reset achievement status when becoming primary
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error making goal primary:', updateError);
        throw new Error('Failed to make goal primary');
      }

      setGoals(prev => prev.map(goal => 
        goal.id === id 
          ? data 
          : { ...goal, is_primary: false }
      ));
    } catch (err) {
      console.error('Error in makePrimary:', err);
      throw err;
    }
  };

  const calculateGoalProgress = (goal: Goal, totalSaved: number) => {
    if (goal.is_primary) {
      // For primary goals, progress is based on savings since becoming primary
      const baseline = goal.baseline_amount || 0;
      const progressAmount = Math.max(0, totalSaved - baseline);
      return Math.min((progressAmount / goal.target_amount) * 100, 100);
    } else {
      // For non-primary goals, use total saved
      return Math.min((totalSaved / goal.target_amount) * 100, 100);
    }
  };

  const checkAutoAchievements = async (totalSaved: number) => {
    if (!session?.user?.id || goals.length === 0) return;

    try {
      // Calculate total already committed to achieved goals
      const achievedGoalsList = goals.filter(goal => goal.achieved_at);
      const totalCommitted = achievedGoalsList.reduce(
        (sum, g) => sum + g.target_amount,
        0
      );

      // Check achievements based on goal type AND available savings
      const goalsToAchieve = goals.filter(goal => {
        if (goal.achieved_at) return false; // Already achieved
        
        const progress = calculateGoalProgress(goal, totalSaved);
        if (progress < 100) return false; // Not at 100% yet
        
        // Check if user has enough saved to cover all achieved goals + this one
        const requiredTotal = totalCommitted + goal.target_amount;
        return totalSaved >= requiredTotal;
      });

      // Find goals that are marked as achieved but shouldn't be
      const goalsToUnachieve = goals.filter(goal => {
        if (!goal.achieved_at) return false; // Not achieved
        
        const progress = calculateGoalProgress(goal, totalSaved);
        return progress < 100;
      });

      // Batch update achieved goals
      for (const goal of goalsToAchieve) {
        await markGoalAchieved(goal.id);
      }

      // Batch update unachieved goals (if needed)
      for (const goal of goalsToUnachieve) {
        await markGoalUnachieved(goal.id);
      }

    } catch (err) {
      console.error('Error in checkAutoAchievements:', err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [session?.user?.id]);

  const activeGoals = goals.filter(goal => !goal.achieved_at);
  const achievedGoals = goals.filter(goal => goal.achieved_at);
  const primaryGoal = goals.find(goal => goal.is_primary === true) || null;

  return {
    goals,
    loading,
    error,
    activeGoals,
    achievedGoals,
    primaryGoal,
    createGoal,
    updateGoal,
    deleteGoal,
    markGoalAchieved,
    markGoalUnachieved,
    makePrimary,
    checkAutoAchievements,
    calculateGoalProgress,
    refetch: fetchGoals,
  };
} 