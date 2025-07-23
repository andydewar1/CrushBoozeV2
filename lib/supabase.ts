import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase project URL and anon key
const supabaseUrl = 'https://rcolsbgkjovwawfbofmr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjb2xzYmdram92d2F3ZmJvZm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQzMzQsImV4cCI6MjA2ODUxMDMzNH0._UIpAC3CEit6VLk7a4x9hioZLLqBeSAXoBgJIaNyuSI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'crushnic-auth-token', // Custom storage key
  },
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
    console.log('Error checking inactivity:', error);
    return false; // Don't log out on error
  }
}; 