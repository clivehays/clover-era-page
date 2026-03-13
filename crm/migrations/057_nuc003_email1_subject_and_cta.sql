-- Migration 057: Nuc 003 Email 1 — personalised subject line and CTA button text
-- Subject: {{first_name}}—{{annual_departures}} of your {{employee_count}} people have decided to leave
-- Button:  See Your {{currency_symbol}}{{total_annual_cost_short}} Breakdown

-- 1. Update subject line
UPDATE sequence_templates
SET subject_template = '{{first_name}}—{{annual_departures}} of your {{employee_count}} people have decided to leave'
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
  AND position = 1;

-- 2. Update CTA button text (Email 1 body only)
UPDATE sequence_templates
SET body_template = REPLACE(
  body_template,
  '>Book the call</a>',
  '>See Your {{currency_symbol}}{{total_annual_cost_short}} Breakdown</a>'
)
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
  AND position = 1;

-- Verify
SELECT position, subject_template,
       body_template LIKE '%See Your%' AS has_new_cta
FROM sequence_templates
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
  AND position = 1;
