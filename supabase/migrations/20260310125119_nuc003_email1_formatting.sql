-- =============================================
-- Migration 052: Nuc 003 Cold Email 1 - Formatting
-- =============================================
-- Improves readability with HTML formatting:
-- - Bold on key dollar figures and statistics
-- - Bold on opening hook and CTA
-- - Image wrapped in centered div for proper display
-- - Bold P.S.
-- =============================================

UPDATE sequence_templates
SET body_template = '{{first_name}},

<strong>Someone on your team has an offer.</strong>

Not "thinking about leaving."
Not "looking around."

They have an offer. In writing. And they''re about to accept it.

You''re going to lose <strong>{{currency_symbol}}{{cost_per_departure_short}}</strong> replacing them. If they''re senior technical or leadership, <strong>{{currency_symbol}}{{cost_per_departure_senior_short}}</strong>. If two more people start looking when they see the first one resign and they will, you''re at <strong>{{currency_symbol}}{{cost_three_departures_short}} in 90 days</strong>.

You didn''t see it coming because you''re not looking.

<strong>{{67_day_employees}} of your {{employee_count}} people have already decided to leave.</strong> They made the decision weeks ago. They''re interviewing at night. Updating LinkedIn on weekends. Taking "dentist appointments" for final rounds.

And you think everything''s fine because they''re still showing up.

They''re showing up because they''re professional. Not because they''re staying.

Last year this cost you <strong>{{currency_symbol}}{{total_annual_cost_short}}</strong>. Recruiting. Onboarding. Lost deals. Blown timelines. Projects that died because the person who knew how to do it walked out the door and took the knowledge with them.

This year you''re going to lose more. Unless you do something this week.

The CEO I talked to on Monday lost his VP of Engineering on Thursday. Didn''t see it coming. "She seemed fine," he said. She''d been interviewing for six weeks. <strong>$520K replacement cost.</strong> Two of her directs resigned the following week.

He called me back on Friday and said: "I should''ve taken the call when you first reached out."

Yeah. He should have.

I can''t tell you which specific person. Clover ERA is anonymous, that''s the only reason they tell the truth.

But I can show you this:

<div style="text-align:center;margin:24px 0;"><img src="https://drugebiitlcjkknjfxeh.supabase.co/storage/v1/object/public/outreach-attachments/email-images/team-member-withdrawing.jpg" alt="Clover ERA behavioral insight showing team member withdrawal pattern" style="max-width:100%;width:600px;border-radius:8px;" /></div>

This is what Clover ERA found in a 12-person team last week. The manager had no idea.

<strong>"I just stay in my lane and do my work."</strong>

That''s not neutrality. That''s someone who''s already given up trying. The resignation letter came 11 days later.

Do you have someone on your team saying this right now?

I can show you which teams have someone in the 67-day window, which roles cost the most when they walk, and what the next 90 days look like if you keep operating blind.

<strong>Book the call: {{calendar_link}}</strong>

Or don''t.

And when someone resigns next week, and someone will, you can tell yourself you didn''t have time for a 15-minute conversation that would''ve cost you nothing and saved you a quarter million dollars.

Your call.

Clive Hays
Co-Founder, Clover ERA
cloverera.com

<strong>P.S.</strong> You''re wondering if this is real or if I''m just trying to scare you into a meeting. It''s real. And you''re about to find out the expensive way.'
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
  AND position = 1;

-- Verify
SELECT s.name, t.position,
       LEFT(t.body_template, 200) as body_preview,
       t.body_template LIKE '%<strong>%' as has_bold,
       t.body_template LIKE '%<div%<img%' as has_wrapped_image
FROM sequence_templates t
JOIN outreach_sequences s ON s.id = t.sequence_id
WHERE s.name = 'Nuc 003 Cold'
  AND t.position = 1;
