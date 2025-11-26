-- Fix RLS by creating policies for BOTH public and anon roles
-- The issue is that Supabase anon key uses 'anon' role, not 'public'

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "enable_insert_for_anon" ON roundtable_applications;

-- Create INSERT policy specifically for anon role (this is what Supabase anon key uses)
CREATE POLICY "anon_insert_applications"
ON roundtable_applications
FOR INSERT
TO anon
WITH CHECK (true);

-- Also create one for authenticated just in case
CREATE POLICY "authenticated_insert_applications"
ON roundtable_applications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify the new policies
SELECT
  policyname,
  roles,
  cmd as operation,
  with_check
FROM pg_policies
WHERE tablename = 'roundtable_applications'
AND cmd = 'INSERT'
ORDER BY policyname;
