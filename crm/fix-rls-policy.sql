-- Fix RLS policy to ensure authenticated users can read profiles
-- This will allow the JavaScript client to query profiles

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;

-- Create new SELECT policy that explicitly allows authenticated users
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Verify the policy was created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'SELECT';
