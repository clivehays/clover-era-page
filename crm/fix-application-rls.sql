-- Fix RLS policy to allow public application submissions
-- This allows anyone to INSERT into roundtable_applications (for the application form)
-- But only authenticated users can SELECT/UPDATE/DELETE

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert applications" ON roundtable_applications;
DROP POLICY IF EXISTS "Public can insert applications" ON roundtable_applications;

-- Create new policy that allows public inserts
CREATE POLICY "Allow public to submit applications"
ON roundtable_applications
FOR INSERT
TO anon
WITH CHECK (true);

-- Verify the policy was created
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
WHERE tablename = 'roundtable_applications'
ORDER BY policyname;
