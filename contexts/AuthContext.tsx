import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { signUp, signIn, signOut, getCurrentSession } from '@/lib/auth';
import RevenueCatService from '@/services/RevenueCatService';

interface AuthContextType {
  // Auth state
  user: User | null;
  session: Session | null;
  loading: boolean;
  
  // Auth actions
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('❌ useAuth must be used within an AuthProvider');
    // Return a safe default instead of throwing
    return {
      user: null,
      session: null,
      loading: false,
      signUp: async () => ({ success: false, error: 'AuthContext not available' }),
      signIn: async () => ({ success: false, error: 'AuthContext not available' }),
      signOut: async () => ({ success: false, error: 'AuthContext not available' })
    };
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const segments = useSegments();

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { session: currentSession, error } = await getCurrentSession();
        
        if (error) {
          console.error('❌ Failed to get current session:', error);
          if (mounted) {
            setUser(null);
            setSession(null);
            setLoading(false);
          }
          return;
        }

        if (currentSession?.user) {
          console.log('✅ Found existing session for user:', currentSession.user.id);
          
          if (mounted) {
            setUser(currentSession.user);
            setSession(currentSession);
          }
        } else {
          console.log('ℹ️ No existing session found');
        }

        if (mounted) {
          setLoading(false);
        }

      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id);

      if (mounted) {
        setUser(session?.user || null);
        setSession(session);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Navigation logic - handle auth state and onboarding
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';
    const inTabsGroup = segments[0] === '(tabs)';
    const isLandingPage = segments[0] === undefined;

    // If not authenticated and trying to access protected routes
    if (!user && !inAuthGroup && !isLandingPage) {
      router.replace('/');
    }
  }, [user, loading, segments, router]);

  const handleSignUp = async (email: string, password: string) => {
    return await signUp(email, password);
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting signin...');

      const result = await signIn(email, password);
      
      if (result.success) {
        console.log('✅ Signin successful');
        // Auth state will be updated via onAuthStateChange
        return { success: true };
      } else {
        console.error('❌ Signin failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Unexpected signin error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      };
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      console.log('🔐 Attempting signout...');

      // Force clear local state first
      setUser(null);
      setSession(null);

      // Also clear RevenueCat user data and force cache clear
      try {
        await RevenueCatService.signOut();
        // Force invalidate all RevenueCat caches
        await RevenueCatService.invalidateAllCaches();
      } catch (error) {
        console.error('⚠️ RevenueCat signOut failed, continuing with regular signOut:', error);
      }

      const result = await signOut();
      
      if (result.success) {
        console.log('✅ Signout successful');
        return { success: true };
      } else {
        console.error('❌ Signout failed:', result.error);
        // Even if Supabase signout fails, we've cleared local state
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Unexpected signout error:', error);
      // Even if there's an error, we've cleared local state
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 