-- Re-enable RLS and configure it properly for public application submissions

-- First, re-enable RLS
ALTER TABLE roundtable_applications ENABLE ROW LEVEL SECURITY;

-- Drop all existing INSERT policies
DROP POLICY IF EXISTS "anon_insert_applications" ON roundtable_applications;
DROP POLICY IF EXISTS "authenticated_insert_applications" ON roundtable_applications;
DROP POLICY IF EXISTS "enable_insert_for_anon" ON roundtable_applications;

-- Grant INSERT permission to anon role at the table level
GRANT INSERT ON roundtable_applications TO anon;

-- Create a permissive policy for INSERT that allows anon role
CREATE POLICY "allow_anon_insert"
ON roundtable_applications
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- Also ensure authenticated users can insert
CREATE POLICY "allow_authenticated_insert"
ON roundtable_applications
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify the policies
SELECT
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies
WHERE tablename = 'roundtable_applications'
AND cmd = 'INSERT'
ORDER BY policyname;

-- Verify table grants
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'roundtable_applications'
AND privilege_type = 'INSERT';
