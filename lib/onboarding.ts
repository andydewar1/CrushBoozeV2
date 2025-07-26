import { supabase } from './supabase';
import { UserProfile } from './auth';

export interface OnboardingData {
  quitDate: Date;
  hasQuit: boolean;
  personalGoals: string[];
  quitReasons: string[];
  quitReason: string;
  vapeTypes: VapeType[];
  currency: string;
  financialGoal: {
    description: string;
    amount: number;
  };
}

export interface VapeType {
  type: 'disposable' | 'pod' | 'liquid' | 'other';
  otherText?: string;
  quantity: number;
  frequency: 'day' | 'week';
  unitCost: number;
}

export interface OnboardingResult {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}

/**
 * Save onboarding data to user profile
 */
export async function saveOnboardingData(userId: string, data: OnboardingData): Promise<OnboardingResult> {
  try {
    console.log('💾 Saving onboarding data for user:', userId);

    // Calculate daily cost
    const dailyCost = data.vapeTypes.reduce((sum, type) => {
      const cost = (type.quantity || 0) * (type.unitCost || 0);
      return sum + (type.frequency === 'week' ? cost / 7 : cost);
    }, 0);

    // Simple profile data
    const profileData = {
      id: userId,
      quit_date: data.quitDate.toISOString(),
      has_quit: data.hasQuit,
      personal_goals: data.personalGoals,
      quit_reasons: data.quitReasons,
      quit_reason: data.quitReason,
      vape_types: data.vapeTypes,
      currency: data.currency,
      daily_cost: dailyCost,
      financial_goal_description: data.financialGoal.description,
      financial_goal_amount: data.financialGoal.amount,
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Just save it - use upsert to handle create or update
    const { data: savedProfile, error } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();

    if (error) {
      console.error('❌ Save failed:', error);
      return { success: false, error: error.message };
    }

    // Also create the financial goal in the financial_goals table so it shows up on the goals page
    if (data.financialGoal.description && data.financialGoal.amount > 0) {
      // Check if this goal already exists to avoid duplicates
      const { data: existingGoal } = await supabase
        .from('financial_goals')
        .select('id')
        .eq('user_id', userId)
        .eq('description', data.financialGoal.description)
        .eq('target_amount', data.financialGoal.amount)
        .maybeSingle();

      if (!existingGoal) {
        const { error: goalError } = await supabase
          .from('financial_goals')
          .insert({
            user_id: userId,
            name: data.financialGoal.description,
            target_amount: data.financialGoal.amount,
            description: data.financialGoal.description,
            is_primary: true, // Mark onboarding goal as primary
            baseline_amount: 0,
          });

        if (goalError) {
          console.error('⚠️ Warning: Failed to create financial goal:', goalError);
          // Don't fail the entire onboarding if goal creation fails
        }
      }
    }

    console.log('✅ Profile saved successfully');
    return { success: true, profile: savedProfile as UserProfile };

  } catch (error) {
    console.error('❌ Save error:', error);
    return { success: false, error: 'Save failed' };
  }
}