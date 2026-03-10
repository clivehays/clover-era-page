-- =============================================
-- Migration 048: Update Email 1 - Remove PDF, New Copy
-- =============================================
-- Changes:
-- - Removed PDF attachment reference ("attached report")
-- - Removed {{custom_company_reference}} paragraph
-- - Removed product description paragraph
-- - New copy focuses on turnover cost, 67-day reality, and single CTA
-- - Simplified signature (no LinkedIn/newsletter links)
-- - Subject line unchanged
-- =============================================

-- Email 1 (position 1)
UPDATE sequence_templates
SET body_template = '{{first_name}},

{{company_name}} lost {{currency_symbol}}{{annual_turnover_cost_short}} to turnover last year.

You didn''t see it because it''s scattered across recruiting, onboarding, lost productivity, and knowledge walking out the door.

Here''s the part that''s happening right now: {{67_day_number}} of your {{employee_count}} employees have already decided to leave. They just haven''t told you yet. Average time between decision and resignation: 67 days.

The question isn''t whether they''re leaving. It''s whether you can see them before they resign.

Worth 15 minutes to see what''s driving the {{currency_symbol}}{{annual_turnover_cost_short}}? I''ll send you the full breakdown after we talk: {{calendar_link}}

Clive Hays
Co-Founder, Clover ERA
cloverera.com'
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Operational Buyer - Turnover Cost')
  AND position = 1;


-- =============================================
-- Verify update
-- =============================================
SELECT s.name, t.position,
       LEFT(t.body_template, 100) as body_preview
FROM sequence_templates t
JOIN outreach_sequences s ON s.id = t.sequence_id
WHERE s.name = 'Operational Buyer - Turnover Cost'
  AND t.position = 1;
