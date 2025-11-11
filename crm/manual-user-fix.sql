-- Manual User Fix - Verify email and allow login
-- Use this when password reset emails are not working
-- Run this in Supabase SQL Editor

-- STEP 1: Verify a user's email manually
-- Replace 'user@example.com' with the actual email address

UPDATE profiles
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com'
AND email_confirmed_at IS NULL;

-- Verify it worked
SELECT email, email_confirmed_at, role, full_name
FROM profiles
WHERE email = 'user@example.com';

-- STEP 2: If you need to reset their password manually
-- Note: This requires direct access to auth.users table
-- The password hash below is for temporary password: 'CloverERA2025!'
-- User should change this immediately after login

-- First, check if the user exists in auth.users
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'user@example.com';

-- Update password hash (for temporary password 'CloverERA2025!')
-- Note: This may not work with anon key - requires service role access
-- Alternative: Use the "Reset Password" button in Admin page

-- STEP 3: Alternative - Confirm email in auth.users
-- This ensures the email is verified in both tables

UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'user@example.com'
AND email_confirmed_at IS NULL;

-- STEP 4: Verify both tables are in sync
SELECT
    au.email,
    au.email_confirmed_at as auth_confirmed,
    p.email_confirmed_at as profile_confirmed,
    p.role,
    p.full_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'user@example.com';

-- STEP 5: If user still can't login, check if account is locked
SELECT
    email,
    banned_until,
    confirmation_sent_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'user@example.com';

-- EXPECTED RESULT:
-- - email_confirmed_at should be a timestamp (not NULL)
-- - banned_until should be NULL
-- - User should now be able to login with their existing password or temp password
