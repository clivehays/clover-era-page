-- =============================================
-- Migration 032: Update Operational Buyer Email Templates
-- =============================================
-- Updates the 3 email templates in the Operational Buyer - Turnover Cost sequence
-- with refined copy, updated CTA (Calendly link), and expanded signatures.
-- Key changes:
-- - Email 1: Added {{custom_company_reference}} paragraph with scaling/investor angle
-- - Email 1: Added Clover ERA product line + direct Calendly CTA
-- - Email 2: Restructured cost breakdown as flowing text (not arrows/bullets)
-- - Email 2: Removed #4/#1-3 references, replaced with clearer framing
-- - Email 3: Added "We built Clover ERA" product line
-- - All: Standardized Calendly link as CTA
-- - All: Updated signatures with consistent format
-- =============================================

-- Email 1 (position 1)
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

-- Email 2 (position 2)
UPDATE sequence_templates
SET body_template = '{{first_name}},

Following up on the Turnover Intelligence Report I sent last week.

The number that matters: ${{daily_cost_formatted}} per day.

That''s what {{company_name}} is losing to turnover you can''t see yet. Not the people who quit yesterday. The {{67_day_number}} who''ve already decided but are still showing up.

Most companies treat this as an HR problem. It''s not. It''s a P&L problem hiding in productivity loss (6 to 8 months to replacement productivity), knowledge drain (undocumented processes walk out the door), team disruption (remaining team compensates, burns out, follows), and recruiting/training (the only cost you''re actually tracking).

You''re tracking the last one. You''re missing the first three.

We built Clover ERA to give operational leaders real-time visibility into the six dimensions that predict turnover before resignation letters arrive.

Worth a 15-minute call to see how this works for {{company_name}}? {{calendar_link}}

Clive Hays
Co-Founder, Clover ERA
cloverera.com
LinkedIn: https://www.linkedin.com/in/clivehays/
Subscribe to my newsletter: https://substack.com/@clivehays'
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Operational Buyer - Turnover Cost')
  AND position = 2;

-- Email 3 (position 3)
UPDATE sequence_templates
SET body_template = '{{first_name}},

Last email on this.

I''ve been running these Turnover Intelligence Reports for leaders at mid-market {{industry}} companies for the past 18 months. The pattern I see:

Companies tracking turnover rate (12%) think they have a manageable problem.
Companies tracking turnover cost (${{annual_turnover_cost_formatted}}) realize they have an invisible budget leak.

The {{67_day_number}} people who''ve already mentally checked out at {{company_name}}. They''re not waiting for you to fix culture or raise salaries. They''re interviewing. The day they resign, the clock starts on a ${{cost_per_departure_formatted}} replacement cost.

We built Clover ERA so operational leaders can see which departments, which managers, which teams are highest risk before resignation letters arrive.

Worth a 15-minute call to see how this works for {{company_name}}? {{calendar_link}}

If the timing''s not right, no worries. Just let me know and I''ll stop following up.

Clive Hays
Co-Founder, Clover ERA
Already Gone: 78 Ways to Miss Someone Leaving
cloverera.com
LinkedIn: https://www.linkedin.com/in/clivehays/
Subscribe to my newsletter: https://substack.com/@clivehays'
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Operational Buyer - Turnover Cost')
  AND position = 3;


-- =============================================
-- Verify updates
-- =============================================
SELECT s.name, t.position,
       LEFT(t.body_template, 80) as body_preview,
       RIGHT(t.body_template, 80) as signature_preview
FROM sequence_templates t
JOIN outreach_sequences s ON s.id = t.sequence_id
WHERE s.name = 'Operational Buyer - Turnover Cost'
ORDER BY t.position;
