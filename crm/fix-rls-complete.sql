-- Complete RLS fix for roundtable_applications
-- This ensures public users can submit applications

-- First, let's check if RLS is enabled (it should be)
-- If this returns true, RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'roundtable_applications';

-- Drop ALL existing policies on the table
DROP POLICY IF EXISTS "Allow public to submit applications" ON roundtable_applications;
DROP POLICY IF EXISTS "Anyone can insert applications" ON roundtable_applications;
DROP POLICY IF EXISTS "Public can insert applications" ON roundtable_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON roundtable_applications;
DROP POLICY IF EXISTS "Admins can update all applications" ON roundtable_applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON roundtable_applications;

-- Create INSERT policy for anonymous users (public application form)
CREATE POLICY "enable_insert_for_anon"
ON roundtable_applications
FOR INSERT
TO public
WITH CHECK (true);

-- Create SELECT policy for authenticated users (admin dashboard)
CREATE POLICY "enable_select_for_authenticated"
ON roundtable_applications
FOR SELECT
TO authenticated
USING (true);

-- Create UPDATE policy for authenticated users (admin dashboard)
CREATE POLICY "enable_update_for_authenticated"
ON roundtable_applications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create DELETE policy for authenticated users (admin dashboard)
CREATE POLICY "enable_delete_for_authenticated"
ON roundtable_applications
FOR DELETE
TO authenticated
USING (true);

-- Verify all policies
SELECT
  policyname,
  roles,
  cmd as operation,
  permissive
FROM pg_policies
WHERE tablename = 'roundtable_applications'
ORDER BY cmd, policyname;
