-- Check your current profile status
-- Run this in Supabase SQL Editor to see what's in the profiles table

SELECT * FROM profiles WHERE email = 'clive.hays@cloverea.com';

-- If the above returns no results, check all profiles
SELECT id, email, role, created_at FROM profiles ORDER BY created_at DESC;

-- Check if there are any users in auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'clive.hays@cloverea.com';
