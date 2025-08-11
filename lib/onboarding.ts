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

    // PERFORMANCE: Prepare profile data without checking existing first
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
      updated_at: new Date().toISOString()
    };

    console.log('💾 Profile data prepared for upsert:', { userId });

    // Use upsert to handle create or update without pre-checking
    const { data: savedProfile, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('❌ Profile save failed:', error);
      return { success: false, error: `Profile save failed: ${error.message}` };
    }

    // PERFORMANCE: Create financial goal without pre-checking, use upsert instead
    if (data.financialGoal.description && data.financialGoal.amount > 0) {
      console.log('💰 Creating financial goal:', data.financialGoal);
      
      try {
        // Use upsert with a composite unique constraint to avoid duplicates
        const { error: goalError } = await supabase
          .from('financial_goals')
          .upsert({
            user_id: userId,
            name: data.financialGoal.description,
            target_amount: data.financialGoal.amount,
            description: data.financialGoal.description,
            is_primary: true, // Mark onboarding goal as primary
            baseline_amount: 0,
          }, { 
            onConflict: 'user_id,description,target_amount',
            ignoreDuplicates: true 
          });

        if (goalError) {
          console.error('⚠️ Warning: Failed to create financial goal:', goalError);
          // Don't fail the entire onboarding if goal creation fails
        } else {
          console.log('✅ Financial goal created/updated successfully');
        }
      } catch (goalError) {
        console.error('⚠️ Error handling financial goal:', goalError);
        // Don't fail the entire onboarding if goal creation fails
      }
    }

    console.log('✅ Profile saved successfully');
    return { success: true, profile: savedProfile as UserProfile };

  } catch (error) {
    console.error('❌ Save error:', error);
    return { success: false, error: 'Save failed' };
  }
}