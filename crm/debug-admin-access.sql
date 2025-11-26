-- Debug script to check admin access
-- Run this to see what's happening with the profile lookup

-- 1. Check if the profile exists and has admin role
SELECT
    id,
    email,
    role,
    created_at,
    'Profile found with this role' as status
FROM public.profiles
WHERE id = '3bd08db0-4889-4400-b07b-ede7a6ee9102';

-- 2. Check if the email matches
SELECT
    id,
    email,
    role,
    'Profile found by email' as status
FROM public.profiles
WHERE email = 'clive.hays@cloverera.com';

-- 3. Check all profiles to see what's in the table
SELECT
    id,
    email,
    role,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- 4. Verify the auth user still exists
SELECT
    id,
    email,
    'Auth user exists' as status
FROM auth.users
WHERE email = 'clive.hays@cloverera.com';
