-- Fix RLS policy for roundtable_cohorts to allow public reads
-- The application form needs to read cohort info to display the date/time

-- Drop existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'roundtable_cohorts'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON roundtable_cohorts';
    END LOOP;
END $$;

-- Allow public to SELECT upcoming cohorts (for landing page and application form)
CREATE POLICY "enable_select_upcoming_cohorts_for_public"
ON roundtable_cohorts
FOR SELECT
TO public
USING (status = 'upcoming');

-- Allow authenticated users to SELECT all cohorts (for admin dashboard)
CREATE POLICY "enable_select_all_cohorts_for_authenticated"
ON roundtable_cohorts
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to INSERT cohorts (for admin dashboard)
CREATE POLICY "enable_insert_for_authenticated"
ON roundtable_cohorts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to UPDATE cohorts (for admin dashboard)
CREATE POLICY "enable_update_for_authenticated"
ON roundtable_cohorts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to DELETE cohorts (for admin dashboard)
CREATE POLICY "enable_delete_for_authenticated"
ON roundtable_cohorts
FOR DELETE
TO authenticated
USING (true);

-- Verify policies
SELECT
  policyname,
  roles,
  cmd as operation
FROM pg_policies
WHERE tablename = 'roundtable_cohorts'
ORDER BY cmd, policyname;
