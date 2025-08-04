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

export interface SignUpResult {
  success: boolean;
  error?: string;
}

export interface SignInResult {
  success: boolean;
  error?: string;
}

export interface SignOutResult {
  success: boolean;
  error?: string;
}

/**
 * Sign up a new user with email and password
 * Automatically creates a user profile via database trigger
 */
export async function signUp(email: string, password: string): Promise<SignUpResult> {
  try {
    // Clean up email
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail) {
      return {
        success: false,
        error: 'Email is required'
      };
    }

    if (!password) {
      return {
        success: false,
        error: 'Password is required'
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters'
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        emailRedirectTo: undefined // Don't use email confirmation for now
      }
    });

    if (error) {
      // Provide more specific error messages
      if (error.message.includes('User already registered')) {
        return {
          success: false,
          error: 'An account with this email already exists. Please sign in instead.'
        };
      }
      
      if (error.message.includes('Password should be at least')) {
        return {
          success: false,
          error: 'Password must be at least 6 characters long'
        };
      }

      if (error.message.includes('Invalid email')) {
        return {
          success: false,
          error: 'Please enter a valid email address'
        };
      }

      // Handle network-specific errors
      if (error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to create account'
      };
    }

    if (data.user) {
      return {
        success: true
      };
    }

    return {
      success: false,
      error: 'Failed to create user account'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during sign up'
    };
  }
}

/**
 * Sign in an existing user
 * Checks if onboarding is completed
 */
export async function signIn(email: string, password: string): Promise<SignInResult> {
  try {
    // Clean up email
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Invalid email or password. Please check your credentials and try again.'
        };
      }

      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Please check your email and confirm your account before signing in.'
        };
      }

      return {
        success: false,
        error: error.message || 'Failed to sign in'
      };
    }

    if (data.user) {
      return {
        success: true
      };
    }

    return {
      success: false,
      error: 'Authentication failed'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during sign in'
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<SignOutResult> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to sign out'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during sign out'
    };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        session: null,
        error: error.message || 'Failed to get current session'
      };
    }
    
    return {
      session: data.session,
      error: null
    };
  } catch (error) {
    return {
      session: null,
      error: error instanceof Error ? error.message : 'Failed to get current session'
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
export async function createBackupProfile(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return { success: true };
    }

    const defaultProfile = {
      id: userId,
      quit_date: new Date().toISOString(),
      has_quit: false,
      currency: 'USD',
      daily_cost: 0,
      personal_goals: [],
      quit_reason: '',
      quit_reasons: [],
      vape_types: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .insert([defaultProfile]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
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
  updates: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update profile'
    };
  }
} 