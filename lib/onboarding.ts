import { supabase } from './supabase';

interface VapeType {
  type: 'disposable' | 'pod' | 'liquid' | 'other';
  otherText?: string;
  quantity: number;
  frequency: 'day' | 'week';
  unitCost: number;
}

interface OnboardingData {
  quitDate: Date | null;
  hasQuit: boolean;
  personalGoals: string[];
  quitReasons: string[];
  vapeTypes: VapeType[];
  currency: string;
  quitReason: string;
  financialGoal: {
    description: string;
    amount: number;
  };
}

export async function saveOnboardingData(userId: string, data: OnboardingData) {
  try {
    // Calculate daily cost
    const calculateDailyCost = (type: VapeType) => {
      const quantity = type.quantity || 0;
      const unitCost = type.unitCost || 0;
      const cost = quantity * unitCost;
      return type.frequency === 'week' ? cost / 7 : cost;
    };

    const totalDailyCost = data.vapeTypes.reduce((total, type) => total + calculateDailyCost(type), 0);

    // Update user profile with onboarding data
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        quit_date: data.quitDate?.toISOString() || new Date().toISOString(),
        has_quit: data.hasQuit,
        personal_goals: data.personalGoals,
        quit_reasons: data.quitReasons,
        quit_reason: data.quitReason,
        currency: data.currency,
        financial_goal_description: data.financialGoal.description,
        financial_goal_amount: data.financialGoal.amount,
        daily_cost: totalDailyCost,
        vape_types: data.vapeTypes,
      });

    if (error) {
      console.error('Failed to save onboarding data:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    throw error;
  }
} 