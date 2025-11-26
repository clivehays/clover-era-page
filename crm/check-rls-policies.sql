-- Check Row Level Security policies on profiles table
-- This will show us if RLS is blocking the query

-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- Check the policies on profiles table
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
