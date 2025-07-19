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
  },
}); 