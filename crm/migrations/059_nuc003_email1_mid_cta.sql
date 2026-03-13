-- Migration 059: Add second CTA button mid-email in Email 1
-- Placed immediately after "This year you're going to lose more. Unless you do something this week."

UPDATE sequence_templates
SET body_template = REPLACE(
  body_template,
  '<p>This year you''re going to lose more. Unless you do something this week.</p>',
  '<p>This year you''re going to lose more. Unless you do something this week.</p>

<div class="cta-section">
  <a href="{{calendar_link}}" class="cta-button">See Your {{currency_symbol}}{{total_annual_cost_short}} Breakdown</a>
</div>'
)
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
  AND position = 1;

-- Verify
SELECT body_template LIKE '%Unless you do something this week%cta-button%' AS has_mid_cta
FROM sequence_templates
WHERE sequence_id = (SELECT id FROM outreach_sequences WHERE name = 'Nuc 003 Cold')
  AND position = 1;
