-- Drop ALL existing policies (using DROP IF EXISTS to avoid errors)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'roundtable_applications'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON roundtable_applications';
    END LOOP;
END $$;

-- Create INSERT policy for public (anonymous) users
CREATE POLICY "enable_insert_for_anon"
ON roundtable_applications
FOR INSERT
TO public
WITH CHECK (true);

-- Create SELECT policy for authenticated users
CREATE POLICY "enable_select_for_authenticated"
ON roundtable_applications
FOR SELECT
TO authenticated
USING (true);

-- Create UPDATE policy for authenticated users
CREATE POLICY "enable_update_for_authenticated"
ON roundtable_applications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create DELETE policy for authenticated users
CREATE POLICY "enable_delete_for_authenticated"
ON roundtable_applications
FOR DELETE
TO authenticated
USING (true);

-- Verify policies were created
SELECT
  policyname,
  roles,
  cmd as operation
FROM pg_policies
WHERE tablename = 'roundtable_applications'
ORDER BY cmd, policyname;
