-- =============================================
-- Migration 050: Fix Operational Buyer delay_days to 0/4/8
-- =============================================

-- Update sequence-level delay_days
UPDATE outreach_sequences
SET delay_days = '{0,4,8}'
WHERE name = 'Operational Buyer - Turnover Cost';

-- Update template-level days_delay
UPDATE sequence_templates
SET days_delay = 4
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Operational Buyer - Turnover Cost')
  AND position = 2;

UPDATE sequence_templates
SET days_delay = 8
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Operational Buyer - Turnover Cost')
  AND position = 3;

-- Verify
SELECT s.name, s.delay_days, t.position, t.days_delay
FROM outreach_sequences s
JOIN sequence_templates t ON t.sequence_id = s.id
WHERE s.name = 'Operational Buyer - Turnover Cost'
ORDER BY t.position;
