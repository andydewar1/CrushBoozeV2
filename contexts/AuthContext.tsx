import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

// This hook will protect the route access based on user authentication
function useProtectedRoute(session: Session | null, loading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    
    if (!session && !inAuthGroup) {
      // If not authenticated and not in auth group, redirect to login
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      // If authenticated and in auth group, redirect to home
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useProtectedRoute(session, loading);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#35998d" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
} 