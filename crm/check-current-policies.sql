-- Check current RLS policies for both tables

-- Check roundtable_applications policies
SELECT
  'roundtable_applications' as table_name,
  policyname,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'roundtable_applications'
ORDER BY cmd, policyname;

-- Check roundtable_cohorts policies
SELECT
  'roundtable_cohorts' as table_name,
  policyname,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'roundtable_cohorts'
ORDER BY cmd, policyname;

-- Check if RLS is enabled on both tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('roundtable_applications', 'roundtable_cohorts');
