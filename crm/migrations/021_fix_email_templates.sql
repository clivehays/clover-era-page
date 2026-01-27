-- Fix Email Templates - Remove Banned Phrases
-- Migration: 021_fix_email_templates.sql
-- Date: 2026-01-26
-- Description: Updates email templates to remove banned phrases per Clover ERA voice guidelines

-- Update Email 1: Remove "curious"
UPDATE sequence_templates
SET body_template = '{{first_name}} -

{{personalization_hook}}

At {{employee_count}} employees, if even {{turnover_rate}}% of your team turns over this year, you''re looking at a ${{turnover_cost}}+ hole that won''t show up on any dashboard.

Not pitching. Does that number land, or feel off?

Clive'
WHERE position = 1
AND sequence_id IN (SELECT id FROM outreach_sequences WHERE name = 'CEO Cold Outreach - Turnover Cost');

-- Update Email 2: Remove "either way"
UPDATE sequence_templates
SET body_template = '{{first_name}} -

One more thought on this.

Talked to a {{similar_role}} at a {{similar_company_type}} last month. They were tracking turnover rate at {{example_rate}}%. Looked manageable.

When we calculated actual cost - ramp time, lost deals, institutional knowledge walking out - it was ${{example_cost}}. {{example_reaction}}

Might be worth 15 minutes to see what {{company_name}}''s number actually looks like.

No chase from me if not.

Clive'
WHERE position = 2
AND sequence_id IN (SELECT id FROM outreach_sequences WHERE name = 'CEO Cold Outreach - Turnover Cost');

-- Update Email 3: Tighten up closing
UPDATE sequence_templates
SET body_template = '{{first_name}} -

Last note on this.

If turnover cost isn''t on your radar right now, I''ll drop it.

But if there''s any chance the number is bigger than your team thinks{{context_specific}}, I can show you the math in 15 minutes. No deck. Just a calculator.

Worth a look, or should I close the loop?

Clive'
WHERE position = 3
AND sequence_id IN (SELECT id FROM outreach_sequences WHERE name = 'CEO Cold Outreach - Turnover Cost');
