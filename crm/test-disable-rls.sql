-- TEMPORARY: Disable RLS to test if that's the real issue
-- We'll re-enable it after testing

ALTER TABLE roundtable_applications DISABLE ROW LEVEL SECURITY;

-- Check that it's disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'roundtable_applications';
