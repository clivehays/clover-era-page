-- =============================================
-- Migration 048: Update Email 1 - Remove PDF, New Copy
-- =============================================
-- Targets: C-Suite Cold - Report Turnover Cost sequence
-- Also rolls back accidental change to Operational Buyer sequence
-- Changes to C-Suite Email 1:
-- - Removed "The attached report shows where it's hiding"
-- - New CTA: "Worth 15 minutes..." with promise to send breakdown after call
-- - Subject line unchanged
-- =============================================

-- ROLLBACK: Restore Operational Buyer Email 1 to original (migration 032)
UPDATE sequence_templates
SET body_template = '{{first_name}},

Most CFOs track turnover rate. Almost none track turnover cost.

I ran the numbers for {{company_name}}. They''re in the attached report.

{{custom_company_reference}}

We built Clover ERA to give operational leaders real-time visibility into the six dimensions that predict turnover before resignation letters arrive.

Worth a 15-minute call to see how this works for {{company_name}}? {{calendar_link}}

Clive Hays
Co-Founder, Clover ERA
cloverera.com | clive.hays@cloverera.com
LinkedIn: https://www.linkedin.com/in/clivehays/
Subscribe to my newsletter: https://substack.com/@clivehays'
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Operational Buyer - Turnover Cost')
  AND position = 1;


-- UPDATE: C-Suite Cold Email 1 - remove PDF, new CTA
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
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'C-Suite Cold - Report Turnover Cost')
  AND position = 1;


-- =============================================
-- Verify both sequences
-- =============================================
SELECT s.name, t.position,
       LEFT(t.body_template, 120) as body_preview
FROM sequence_templates t
JOIN outreach_sequences s ON s.id = t.sequence_id
WHERE (s.name = 'Operational Buyer - Turnover Cost' OR s.name = 'C-Suite Cold - Report Turnover Cost')
  AND t.position = 1
ORDER BY s.name;
