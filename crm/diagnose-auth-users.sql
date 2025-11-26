-- Diagnostic script to find the actual users in your database
-- Run this in Supabase SQL Editor to see what users actually exist

-- IMPORTANT: The auth.users table is in the 'auth' schema, not 'public' schema
-- In the Supabase dashboard, you can change the schema dropdown from 'public' to 'auth' to see it

-- 1. Check ALL users in auth.users table
-- This will show you the ACTUAL user IDs that exist in your database
SELECT
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    'This is your actual user ID - use this for the profile!' as note
FROM auth.users
ORDER BY created_at DESC;

-- 2. Check if there are any profiles that exist
SELECT
    id,
    email,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- 3. Check for orphaned profiles (profiles without matching auth.users)
SELECT
    p.id,
    p.email,
    p.role,
    'ORPHANED - No matching auth.users record' as status
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 4. Check for auth users without profiles
SELECT
    u.id,
    u.email,
    'Missing profile' as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
