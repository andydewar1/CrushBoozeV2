-- DELETE ALL USERS FOR TESTFLIGHT TESTING
-- This removes all user accounts and their profile data
-- Run this in your Supabase SQL editor

-- First delete user profiles (linked to auth users)
DELETE FROM profiles;

-- Then delete the actual auth users
DELETE FROM auth.users;

-- Optional: Reset any sequences if needed
-- ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;

-- Verify deletion
SELECT COUNT(*) as remaining_users FROM auth.users;
SELECT COUNT(*) as remaining_profiles FROM profiles; 