import { supabase } from './supabase';
import { UserProfile } from './auth';

export interface OnboardingData {
  name: string;
  quitDate: Date;
  weeklySpend: number;
  currency: string;
  quitReasons: string[];
  personalWhy: string;
  financialGoal: {
    description: string;
    amount: number;
  };
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
    console.log('💾 Onboarding data:', {
      name: data.name,
      quitDate: data.quitDate,
      weeklySpend: data.weeklySpend,
      currency: data.currency,
      quitReasonsCount: data.quitReasons.length,
      financialGoal: data.financialGoal
    });

    // Determine if user has quit (quit date is today or in the past)
    const now = new Date();
    const quitDate = new Date(data.quitDate);
    const hasQuit = quitDate <= now;

    // Prepare profile data - store weekly spend directly (daily_cost column stores weekly for CrushBooze)
    const profileData = {
      id: userId,
      name: data.name,
      quit_date: data.quitDate.toISOString(),
      has_quit: hasQuit,
      personal_goals: data.quitReasons, // Display as goal tags on home
      quit_reasons: data.quitReasons,   // Backup of selected reasons
      quit_reason: data.personalWhy,    // Their typed personal why
      daily_cost: data.weeklySpend,     // Stores WEEKLY spend (we calculate daily from this)
      currency: data.currency,
      financial_goal_description: data.financialGoal.description,
      financial_goal_amount: data.financialGoal.amount,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    };

    console.log('💾 Profile data prepared for upsert:', { 
      userId, 
      name: profileData.name,
      dailyCost: profileData.daily_cost,
      hasQuit: profileData.has_quit,
      personalGoalsCount: profileData.personal_goals.length 
    });

    // Use upsert to handle create or update
    const { data: savedProfile, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('❌ Profile save failed:', error);
      return { success: false, error: `Profile save failed: ${error.message}` };
    }

    // Create financial goal if provided
    if (data.financialGoal.description && data.financialGoal.amount > 0) {
      console.log('💰 Creating financial goal:', data.financialGoal);
      
      try {
        const { error: goalError } = await supabase
          .from('financial_goals')
          .insert({
            user_id: userId,
            name: data.financialGoal.description,
            target_amount: data.financialGoal.amount,
            description: data.financialGoal.description,
          });

        if (goalError) {
          console.error('⚠️ Warning: Failed to create financial goal:', goalError);
        } else {
          console.log('✅ Financial goal created successfully');
        }
      } catch (goalError) {
        console.error('⚠️ Error handling financial goal:', goalError);
      }
    }

    console.log('✅ Profile saved successfully');
    return { success: true, profile: savedProfile as UserProfile };

  } catch (error) {
    console.error('❌ Save error:', error);
    return { success: false, error: 'Save failed' };
  }
}
