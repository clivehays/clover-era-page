-- =============================================
-- Migration 031: Add LinkedIn + Substack to Email Signatures
-- =============================================
-- Updates all sequence template signatures to include:
-- - LinkedIn: https://www.linkedin.com/in/clivehays/
-- - Substack newsletter: https://substack.com/@clivehays
-- =============================================

-- Sequence 1: Operational Buyer - Turnover Cost
-- Email 1 (position 1)
UPDATE sequence_templates
SET body_template = '{{first_name}},

Most CFOs track turnover rate. Almost none track turnover cost.

I ran the numbers for {{company_name}}. They''re in the attached report.

{{custom_company_reference}}

If you want to walk through what I found, I''m here: {{calendar_link}}

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

Most companies treat this as an HR problem. It''s not. It''s a P&L problem hiding in:
-> Productivity loss (6-8 months to replacement productivity)
-> Knowledge drain (undocumented processes walk out the door)
-> Team disruption (remaining team compensates, burns out, follows)
-> Recruiting/training (the only cost you''re actually tracking)

You''re tracking #4. You''re missing #1-3.

15 minutes: I''ll show you where the cost is actually sitting and which departments are highest risk.

{{calendar_link}}

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

You can know which departments, which managers, which teams are highest risk. Or you can find out the day someone hands you a resignation letter.

{{calendar_link}}

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
-- Sequence 2: LinkedIn Commenter - Assessment Path
-- =============================================

-- Email 1 (position 1)
UPDATE sequence_templates
SET body_template = 'Hi {{first_name}},

{{opening_hook}}

{{mirror_statement}}

{{trap_question}}

We built a 2-minute assessment that flags where these patterns might be happening: cloverera.com/assessment. It''s designed to surface the person you''re not thinking about.

If it flags someone, you can run daily check-ins for your team free for 14 days. No card, no pitch: cloverera.com/get/

{{closing_question}}

Clive
Clover ERA | contact@cloverera.com
LinkedIn: https://www.linkedin.com/in/clivehays/
Subscribe to my newsletter: https://substack.com/@clivehays'
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'LinkedIn Commenter - Assessment Path')
  AND position = 1;

-- Email 2 (position 2)
UPDATE sequence_templates
SET body_template = 'Hi {{first_name}},

Quick follow-up. Neil and I wrote a short book called Already Gone. 78 real patterns of how managers miss the signs before someone leaves. Preview attached if it''s useful.

{{trap_question}}

If that question made you think of someone specific, the assessment might tell you something you need to hear: cloverera.com/assessment

Appreciated your comment on the post.

Clive
Clover ERA | contact@cloverera.com
LinkedIn: https://www.linkedin.com/in/clivehays/
Subscribe to my newsletter: https://substack.com/@clivehays'
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'LinkedIn Commenter - Assessment Path')
  AND position = 2;


-- =============================================
-- Verify updates
-- =============================================
SELECT s.name, t.position,
       RIGHT(t.body_template, 120) as signature_preview
FROM sequence_templates t
JOIN outreach_sequences s ON s.id = t.sequence_id
WHERE s.name IN ('Operational Buyer - Turnover Cost', 'LinkedIn Commenter - Assessment Path')
ORDER BY s.name, t.position;
