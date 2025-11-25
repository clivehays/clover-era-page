-- First Cohort Setup for Retention Reality Roundtable
-- Run this AFTER running roundtable-schema.sql
-- This creates your first cohort scheduled for Thursday, December 4, 2025

-- Delete the sample cohort if it exists
DELETE FROM roundtable_cohorts WHERE date > CURRENT_DATE;

-- Insert first cohort with your specific details
INSERT INTO roundtable_cohorts (
  date,
  time,
  timezone,
  zoom_link,
  max_attendees,
  registration_deadline,
  status,
  theme
) VALUES (
  '2025-12-04',                                    -- Thursday, December 4, 2025
  '12:00:00',                                       -- 12:00 PM EST (17:00 GMT)
  'America/New_York',                               -- EST timezone
  'https://teams.microsoft.com/l/meetup-join/19%3ameeting_NmU1MjVjZDctY2NiYy00MzQ4LTkyYTMtZjc5MTA2ZmM2OTE2%40thread.v2/0?context=%7b%22Tid%22%3a%22ca6c3888-d29c-43c2-809b-a4f892f923c1%22%2c%22Oid%22%3a%22ea8442dc-54fd-4d73-9ebf-8b282d4d80e2%22%7d',
  10,                                               -- 10 spots available
  '2025-12-02',                                     -- Registration closes December 2 (2 days before)
  'upcoming',
  'Managing Surprise Resignations'
);

-- Verify the cohort was created
SELECT
  id,
  date,
  time,
  timezone,
  max_attendees,
  status
FROM roundtable_cohorts
ORDER BY date DESC
LIMIT 1;

-- Display the cohort details in a readable format
SELECT
  'First Cohort Created!' as message,
  to_char(date, 'Day, Month DD, YYYY') as formatted_date,
  time::text || ' ' || timezone as time_with_zone,
  'Teams Meeting' as platform,
  max_attendees as spots_available,
  status
FROM roundtable_cohorts
WHERE date = '2025-12-04';
