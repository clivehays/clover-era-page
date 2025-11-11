-- Add missing columns to profiles table for user management features
-- Run this in Supabase SQL Editor

-- Add email_confirmed_at column (for tracking email verification)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add last_sign_in_at column (for tracking last login)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP WITH TIME ZONE;

-- Add comments to document the columns
COMMENT ON COLUMN profiles.email_confirmed_at IS 'Timestamp when user email was verified';
COMMENT ON COLUMN profiles.last_sign_in_at IS 'Timestamp of user last login';

-- Update existing users to mark emails as confirmed if they have logged in
-- (This assumes if they exist in profiles, they've verified their email)
UPDATE profiles
SET email_confirmed_at = created_at
WHERE email_confirmed_at IS NULL
  AND created_at < NOW() - INTERVAL '1 day';

-- Create a function to update last_sign_in_at when user logs in
CREATE OR REPLACE FUNCTION update_user_last_sign_in()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_sign_in_at = NEW.last_sign_in_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update last_sign_in_at
-- This listens to auth.users table changes
DROP TRIGGER IF EXISTS on_auth_user_sign_in ON auth.users;
CREATE TRIGGER on_auth_user_sign_in
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION update_user_last_sign_in();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
