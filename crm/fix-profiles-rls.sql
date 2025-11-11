-- Fix Row Level Security policies on profiles table
-- Run this in Supabase SQL Editor if role updates are not working

-- First, let's see what policies currently exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- Drop any restrictive policies that might be blocking updates
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create new comprehensive policy for authenticated users
-- This allows any authenticated user to view all profiles
CREATE POLICY "Allow authenticated users to view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to update all profiles
-- (In a single-tenant system, this is appropriate)
CREATE POLICY "Allow authenticated users to update all profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to insert profiles
-- (Needed when creating new users)
CREATE POLICY "Allow authenticated users to insert profiles"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to delete profiles
-- (Needed for user deletion)
CREATE POLICY "Allow authenticated users to delete profiles"
    ON profiles FOR DELETE
    TO authenticated
    USING (true);

-- Verify the policies were created
SELECT
    policyname,
    cmd as operation,
    roles,
    CASE
        WHEN cmd = 'SELECT' THEN 'Can read profiles'
        WHEN cmd = 'UPDATE' THEN 'Can update profiles'
        WHEN cmd = 'INSERT' THEN 'Can create profiles'
        WHEN cmd = 'DELETE' THEN 'Can delete profiles'
    END as description
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd;

-- Test update query (OPTIONAL - uncomment to test)
-- Replace 'USER_ID_HERE' with an actual user ID
/*
UPDATE profiles
SET role = 'manager', updated_at = NOW()
WHERE id = 'USER_ID_HERE'
RETURNING id, email, full_name, role, updated_at;
*/
