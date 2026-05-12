import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus, Platform } from 'react-native';

// Supabase configuration - hardcoded to avoid any env var issues
// CrushBooze project: lkfimuzzujgwcfcxbuhl.supabase.co
const SUPABASE_URL = 'https://lkfimuzzujgwcfcxbuhl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZmltdXp6dWpnd2NmY3hidWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzI0NjIsImV4cCI6MjA4ODkwODQ2Mn0.mjdvpoCkkU_joSWWLTb3tDz_ULRDFgQsJ6Eni9JoJaY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'crushbooze-auth-token',
  },
  db: {
    schema: 'public'
  }
});

/** Proactive refresh window so access token is renewed before PostgREST returns PGRST303. */
const ACCESS_TOKEN_REFRESH_LEEWAY_MS = 5 * 60 * 1000;
let lastForegroundSessionSync = 0;
const FOREGROUND_SESSION_SYNC_MIN_INTERVAL_MS = 2500;

async function refreshSessionIfStale(): Promise<void> {
  const now = Date.now();
  if (now - lastForegroundSessionSync < FOREGROUND_SESSION_SYNC_MIN_INTERVAL_MS) {
    return;
  }
  lastForegroundSessionSync = now;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const expMs = session.expires_at ? session.expires_at * 1000 : 0;
    if (expMs && expMs > now + ACCESS_TOKEN_REFRESH_LEEWAY_MS) {
      return;
    }

    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.warn('[supabase] refreshSession after foreground:', error.message);
    }
  } catch (e) {
    console.warn('[supabase] refreshSessionIfStale', e);
  }
}

function registerNativeAuthAutoRefresh(): void {
  const handleAppState = (next: AppStateStatus) => {
    if (next === 'active') {
      supabase.auth.startAutoRefresh();
      void refreshSessionIfStale();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  };

  if (AppState.currentState === 'active') {
    supabase.auth.startAutoRefresh();
    void refreshSessionIfStale();
  }

  AppState.addEventListener('change', handleAppState);
}

if (Platform.OS !== 'web') {
  registerNativeAuthAutoRefresh();
}

// Function to check if user should be logged out due to inactivity
export const checkInactivityLogout = async () => {
  try {
    const lastActivity = await AsyncStorage.getItem('last_activity');
    const now = Date.now();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    if (lastActivity) {
      const timeSinceActivity = now - parseInt(lastActivity);
      if (timeSinceActivity > thirtyDaysInMs) {
        // User has been inactive for 30+ days, log them out
        await supabase.auth.signOut();
        await AsyncStorage.removeItem('last_activity');
        return true; // Should log out
      }
    }
    
    // Update last activity
    await AsyncStorage.setItem('last_activity', now.toString());
    return false; // Don't log out
  } catch (error) {
    return false; // Don't log out on error
  }
}; 