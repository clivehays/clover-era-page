-- Fix: anon needs SELECT to use insert().select() and to update own rows
CREATE POLICY "Allow anonymous select own visits" ON page_visits
  FOR SELECT TO anon USING (true);
