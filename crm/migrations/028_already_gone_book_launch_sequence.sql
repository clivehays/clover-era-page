-- Migration: Already Gone Book Launch Sequence
-- Date: 2026-02-05
-- Description: Creates email sequence for Already Gone book launch (Feb 6-14)

-- =============================================
-- CREATE THE SEQUENCE
-- =============================================
INSERT INTO outreach_sequences (name, description, email_count, delay_days, is_active)
VALUES (
    'Already Gone Book Launch',
    'Book launch email sequence - 8 emails from Feb 6-14, 2026. Warmup -> Teaser -> Launch -> Follow-ups.',
    8,
    '{1,1,1,1,1,1,1}', -- Daily sends
    true
);

-- =============================================
-- CREATE EMAIL TEMPLATES
-- =============================================
DO $$
DECLARE
    seq_id UUID;
BEGIN
    SELECT id INTO seq_id FROM outreach_sequences WHERE name = 'Already Gone Book Launch';

    -- Email 1: Warmup (Feb 6) - Managers - 150
    INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template)
    VALUES (seq_id, 1,
        'The $200 award. The $430,000 exit.',
        'She won Employee of the Year in January.

Resigned three weeks later.

The award cost $200. Replacing her cost $430,000.

When I asked her CEO what happened, he said she''d "gotten easier" in the months before. Stopped pushing for the promotion she''d asked for three times. Stopped raising concerns. He thought she''d finally bought in.

She hadn''t. She''d already decided to leave.

That story is one of 78 I''ve documented over the past two years. Moments where someone was already gone before anyone noticed.

More coming next week.

Clive');

    -- Email 2: Warmup (Feb 7) - Managers + Buyers - 300
    INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template)
    VALUES (seq_id, 2,
        '"They stopped fighting because they stopped caring"',
        'A CFO told me last month that his best people "don''t cause problems."

I asked what happened to the ones who used to.

"They left."

The pattern keeps showing up. The person who pushed back, questioned timelines, asked hard questions in meetings. Then one day they get quiet. Agreeable. Easy.

Managers read that as maturity. Usually it''s the opposite.

I''ve been collecting these patterns. 78 of them. The small moments that look like progress but signal something else entirely.

More on that next week.

Clive');

    -- Email 3: Warmup (Feb 8) - All - 600
    INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template)
    VALUES (seq_id, 3,
        'The question they stopped asking',
        'She asked for the promotion three times. March, April, May.

After May? Never brought it up again.

Her manager read that silence as acceptance. She''d moved on, he figured. Made peace with the answer.

Four months later she resigned. Took a role at a company that said yes in the first conversation.

The silence wasn''t acceptance. It was a decision being made without announcement.

I keep finding versions of this story. The training request that went quiet. The project idea that stopped getting mentioned. The raise conversation that never came back up.

78 versions, actually. I wrote them down.

Tuesday, I''m releasing them.

Clive');

    -- Email 4: Warmup (Feb 9) - All - 1,200
    INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template)
    VALUES (seq_id, 4,
        '78 ways to miss someone leaving',
        'Over the past two years I''ve talked to hundreds of leaders about the people who left.

Not the ones who complained on the way out. The quiet ones. The ones who gave notice and everyone said "I had no idea."

The patterns kept repeating.

The person who got "easier to work with." The one who stopped asking for things. The high performer whose standards suddenly dropped. The meeting contributor who went silent.

I wrote down 78 of them. Each one a moment where someone was already gone and nobody noticed.

Tomorrow I''ll tell you how to get the full list.

Clive');

    -- Email 5: Teaser (Feb 10) - All - 2,400
    INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template)
    VALUES (seq_id, 5,
        'Tomorrow: Already Gone',
        'Tomorrow I''m releasing a book with Neil Hays.

It''s called "Already Gone: 78 Ways to Miss Someone Leaving."

No theory. No frameworks. Just 78 patterns we''ve seen over and over. The small moments that signal someone has checked out before they''ve given notice.

The book is short. You can read it in an hour. But the patterns will stay with you longer than that.

$9.99 paperback. $4.99 ebook.

Link goes live tomorrow morning.

Clive');

    -- Email 6: Launch (Feb 11) - All - 4,800
    INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template)
    VALUES (seq_id, 6,
        'Already Gone is live',
        'The book is out.

"Already Gone: 78 Ways to Miss Someone Leaving"

78 patterns. Each one a moment where someone was already decided and nobody saw it coming.

The person who stopped pushing back.
The request that went quiet.
The high performer who got "easier."
The silence that looked like peace but wasn''t.

Every story in this book came from a real conversation. A real exit. A real cost that showed up too late.

$9.99 paperback. $4.99 ebook.

https://cloverera.com/alreadygone/

Clive');

    -- Email 7: Follow-up (Feb 12) - Non-openers
    INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template)
    VALUES (seq_id, 7,
        'Did this land?',
        'Quick note in case yesterday''s email got buried.

The book launched: "Already Gone: 78 Ways to Miss Someone Leaving."

78 patterns that show up before someone resigns. The moments that look like progress but signal the opposite.

https://cloverera.com/alreadygone/

$9.99 paperback. $4.99 ebook.

Clive');

    -- Email 8: Follow-up (Feb 13-14) - Openers who haven't clicked
    INSERT INTO sequence_templates (sequence_id, position, subject_template, body_template)
    VALUES (seq_id, 8,
        'One more for the shelf',
        'If you opened the last few emails, you''ve seen the patterns.

The question is whether you want all 78 in one place.

"Already Gone" is the kind of book you read once and then keep nearby. Not because you''ll forget it, but because you''ll start noticing the patterns everywhere.

https://cloverera.com/alreadygone/

Clive');

END $$;

-- =============================================
-- CREATE THE CAMPAIGN
-- =============================================
INSERT INTO outreach_campaigns (name, sequence_id, status, send_time, max_emails_per_day)
SELECT
    'Already Gone Book Launch - Feb 2026',
    id,
    'draft',
    '13:00:00'::TIME, -- 8AM EST
    200
FROM outreach_sequences
WHERE name = 'Already Gone Book Launch';

-- Verify
SELECT
    s.name as sequence_name,
    s.email_count,
    c.name as campaign_name,
    c.status,
    c.max_emails_per_day
FROM outreach_sequences s
JOIN outreach_campaigns c ON c.sequence_id = s.id
WHERE s.name = 'Already Gone Book Launch';
