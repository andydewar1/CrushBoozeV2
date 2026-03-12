import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabase configuration from environment variables with fallbacks
const supabaseUrl = Constants.expoConfig?.extra?.SUPABASE_URL || process.env.SUPABASE_URL || 'lkfimuzzujgwcfcxbuhl.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZmltdXp6dWpnd2NmY3hidWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzI0NjIsImV4cCI6MjA4ODkwODQ2Mn0.mjdvpoCkkU_joSWWLTb3tDz_ULRDFgQsJ6Eni9JoJaY';

export const supabase = createClient(`https://${supabaseUrl}`, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'crushbooze-auth-token',
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});

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