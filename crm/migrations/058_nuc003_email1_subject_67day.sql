-- Migration 058: Fix Email 1 subject line to use 67-day window number
-- {{67_day_employees}} matches the body copy ("have already decided to leave")
-- {{annual_departures}} was the full-year total — too large and inconsistent with body

UPDATE sequence_templates
SET subject_template = '{{first_name}}—{{67_day_employees}} of your {{employee_count}} people have decided to leave'
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
  AND position = 1;

-- Verify
SELECT position, subject_template
FROM sequence_templates
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
  AND position = 1;
