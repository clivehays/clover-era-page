-- Check Row Level Security policies on profiles table
-- Run this in Supabase SQL Editor to see current policies

-- 1. Check if RLS is enabled on profiles table
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- 2. List all policies on profiles table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Check if there are any UPDATE policies that might be blocking
SELECT
    policyname,
    cmd,
    roles,
    CASE
        WHEN cmd = 'UPDATE' THEN 'This policy affects UPDATE operations'
        ELSE 'Not an UPDATE policy'
    END as notes
FROM pg_policies
WHERE tablename = 'profiles';

-- 4. Test if current user can update a profile (replace with actual user ID)
-- This will show if RLS is blocking updates
-- UNCOMMENT THE LINES BELOW AND REPLACE 'USER_ID_HERE' with an actual user ID to test

/*
SELECT
    id,
    email,
    full_name,
    role,
    updated_at
FROM profiles
WHERE id = 'USER_ID_HERE';

-- Try to update (this will show if it works or gets blocked)
UPDATE profiles
SET role = 'manager', updated_at = NOW()
WHERE id = 'USER_ID_HERE'
RETURNING id, email, full_name, role;
*/
