-- Populate data for existing users in profiles table
-- This script syncs data from auth.users to profiles table

-- Step 1: Update email_confirmed_at for all users who have confirmed emails in auth
UPDATE profiles p
SET email_confirmed_at = au.email_confirmed_at
FROM auth.users au
WHERE p.id = au.id
  AND au.email_confirmed_at IS NOT NULL
  AND p.email_confirmed_at IS NULL;

-- Step 2: For users who don't have confirmation data, mark them as confirmed if they're old accounts
-- (Assumes users who created accounts more than 1 hour ago have verified)
UPDATE profiles
SET email_confirmed_at = created_at
WHERE email_confirmed_at IS NULL
  AND created_at < NOW() - INTERVAL '1 hour';

-- Step 3: Update last_sign_in_at from auth.users
UPDATE profiles p
SET last_sign_in_at = au.last_sign_in_at
FROM auth.users au
WHERE p.id = au.id
  AND au.last_sign_in_at IS NOT NULL;

-- Step 4: For users who have never signed in, set it to NULL (will show as "Never")
-- This is already the default, but just to be explicit
UPDATE profiles
SET last_sign_in_at = NULL
WHERE last_sign_in_at IS NULL;

-- Verify the updates
SELECT
    email,
    full_name,
    role,
    email_confirmed_at IS NOT NULL as is_verified,
    last_sign_in_at,
    created_at
FROM profiles
ORDER BY created_at DESC;
