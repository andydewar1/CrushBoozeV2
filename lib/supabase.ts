import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Try without https:// prefix
const supabaseUrl = 'hpyufwwaqgrpwgeojhmu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhweXVmd3dhcWdycHdnZW9qaG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODA4NDEsImV4cCI6MjA2OTA1Njg0MX0.wJdbABtWMKdVkYm3N01loGpP6o-qYCUqkIxb405w7hg';

export const supabase = createClient(`https://${supabaseUrl}`, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storageKey: 'crushnic-auth-token',
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
    console.log('Error checking inactivity:', error);
    return false; // Don't log out on error
  }
}; 