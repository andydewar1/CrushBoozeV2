import { supabase } from './supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
  requiresOnboarding?: boolean;
}

export interface UserProfile {
  id: string;
  quit_date: string;
  has_quit: boolean;
  personal_goals: string[];
  quit_reasons: string[];
  quit_reason: string;
  vape_types: any[];
  currency: string;
  daily_cost: number;
  financial_goal_description: string;
  financial_goal_amount: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Sign up a new user with email and password
 * Automatically creates a user profile via database trigger
 */
export async function signUp(email: string, password: string): Promise<AuthResult> {
  try {
    console.log('🔐 Starting signup for:', email);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    if (error) {
      console.error('❌ Signup error:', error);
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user account' };
    }

    console.log('✅ User signed up:', data.user.id);

    return {
      success: true,
      user: data.user,
      session: data.session || undefined,
      requiresOnboarding: true
    };

  } catch (error) {
    console.error('❌ Signup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signup failed'
    };
  }
}

/**
 * Sign in an existing user
 * Checks if onboarding is completed
 */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    console.log('🔐 Starting signin process for:', email);

    // Validate inputs
    if (!email?.trim()) {
      return { success: false, error: 'Email is required' };
    }
    if (!password?.trim()) {
      return { success: false, error: 'Password is required' };
    }

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    if (error) {
      console.error('❌ Signin error:', error);
      return { success: false, error: error.message };
    }

    if (!data.user || !data.session) {
      console.error('❌ No user/session returned from signin');
      return { success: false, error: 'Failed to sign in' };
    }

    console.log('✅ User signed in successfully:', data.user.id);

    // Get user profile and check onboarding status
    const profileResult = await getUserProfile(data.user.id);
    if (!profileResult.success) {
      console.error('❌ Failed to get user profile after signin');
      return { success: false, error: 'Failed to load user profile' };
    }

    const requiresOnboarding = !profileResult.profile?.onboarding_completed;

    return {
      success: true,
      user: data.user,
      session: data.session,
      requiresOnboarding
    };

  } catch (error) {
    console.error('❌ Unexpected signin error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔐 Signing out user');

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ Signout error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ User signed out successfully');
    return { success: true };

  } catch (error) {
    console.error('❌ Unexpected signout error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<{ session: Session | null; error?: string }> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Get session error:', error);
      return { session: null, error: error.message };
    }

    return { session };

  } catch (error) {
    console.error('❌ Unexpected get session error:', error);
    return {
      session: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // If profile doesn't exist, that's ok - will be created during onboarding
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Profile not found' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, profile: data as UserProfile };

  } catch (error) {
    return { success: false, error: 'Failed to get profile' };
  }
}

/**
 * Create a backup profile if the database trigger failed
 */
export async function createBackupProfile(userId: string): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    console.log('🔧 Creating backup profile for:', userId);
    
    const profileData = {
      id: userId,
      quit_date: new Date().toISOString(),
      has_quit: false,
      personal_goals: [],
      quit_reasons: [],
      quit_reason: '',
      vape_types: [],
      currency: 'USD',
      daily_cost: 0.00,
      financial_goal_description: '',
      financial_goal_amount: 0.00,
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add timeout to prevent hanging
    const insertPromise = supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error('❌ Profile creation timed out');
        reject(new Error('Profile creation timeout'));
      }, 10000);
    });

    let data, error;
    try {
      const result = await Promise.race([insertPromise, timeoutPromise]);
      data = result.data;
      error = result.error;
    } catch (timeoutError) {
      console.error('❌ Profile creation timeout or error:', timeoutError);
      return { success: false, error: 'Profile creation failed' };
    }

    if (error) {
      console.error('❌ Failed to create backup profile:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Backup profile created successfully');
    return { success: true, profile: data as UserProfile };
    
  } catch (error) {
    console.error('❌ Unexpected backup profile creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create backup profile'
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string, 
  updates: Partial<UserProfile>
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    console.log('📝 Updating user profile for:', userId, updates);

    if (!userId?.trim()) {
      return { success: false, error: 'User ID is required' };
    }

    if (!updates || Object.keys(updates).length === 0) {
      return { success: false, error: 'No updates provided' };
    }

    // Add updated_at timestamp
    const updatesWithTimestamp = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updatesWithTimestamp)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update profile error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.error('❌ No data returned from profile update');
      return { success: false, error: 'Failed to update profile' };
    }

    console.log('✅ Profile updated successfully');
    return { success: true, profile: data as UserProfile };

  } catch (error) {
    console.error('❌ Unexpected update profile error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
} 