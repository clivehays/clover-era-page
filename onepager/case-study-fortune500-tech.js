// ============================================================
// CASE STUDY: Fortune 500 Insurance Company, Technology Division, 350 People
// ============================================================

module.exports = {
  case_id: 'fortune500-tech',
  org_description: 'Fortune 500 Insurance Company, Technology Division, 350 People',
  page2_header: 'The Intervention and Results',

  assumption_heading: 'The Problem',
  assumption_text: 'A technology division inside a Fortune 500 insurance company was losing developers faster than they could replace them. Turnover was running at 25%. In a market where every technology company is competing for the same talent, this division was bleeding experience, institutional knowledge, and project continuity.<br><br>The VP of the division brought in Clover ERA because the traditional retention playbook wasn\'t working. They needed to understand why people were leaving before the next resignation landed.',

  surfaced_heading: 'What CLOVER Surfaced',
  surfaced_text: 'Within two weeks, three dimensions flagged across the division.<br><br>Communication scored 28%. Developers didn\'t understand why they were doing the work they were doing. Not how. Why. They felt like they were building in the dark. Executing tasks without context, disconnected from the mission their work was serving.<br><br>Enablement scored 31%. The tools they were using every day were a source of frustration, not support. The things that were supposed to help them do their jobs were getting in the way.<br><br>Reflection scored 34%. Teams weren\'t spending time thinking about how things were going. Problems that seem obvious in hindsight had never been surfaced because nobody had created the space to identify them.',

  leader_quote: 'He had assumed his teams understood the direction and had what they needed. CLOVER showed him that both assumptions were wrong.',
  leader_attribution: 'VP, Technology Division',

  intervention_heading: 'What Changed',
  intervention_text: 'No consultants. No restructure. Managers started using the bi-weekly CLOVER reports to drive specific actions with their teams.<br><br>Communication actions focused on connecting daily work to the larger mission. Not more meetings. More context in the meetings that already existed.<br><br>Enablement actions surfaced specific tool frustrations to leadership, who could now see the pattern across teams instead of hearing isolated complaints.<br><br>Reflection was the simplest fix. The daily CLOVER check-in itself became the 30-second reflection point that hadn\'t existed before.<br><br>Every two weeks, managers received updated reports. Every two weeks, they acted. The cycle compounded.',

  headline_result: '$45,000 invested. $1,000,000 in departures prevented. 22:1 return in six months.',

  metrics: [
    { label: 'Communication', before: '28%', after: '52%', context: 'in 3 months', row: 1, row_label: 'CLOVER Dimensions' },
    { label: 'Enablement', before: '31%', after: '56%', context: 'in 3 months', row: 1 },
    { label: 'Reflection', before: '34%', after: '62%', context: 'in 3 months', row: 1 },
    { label: 'Developer Turnover', before: '25%', after: '15%', context: 'in 6 months', row: 2, row_label: 'Business Impact' },
    { label: 'Investment', before: null, after: '$45,000', context: '6-month cost', row: 2 },
    { label: 'Return', before: null, after: '$1,000,000+', context: 'in prevented departures', row: 2 },
  ],
  metrics_footnote: null,

  user_quote: null,
  user_attribution: null,

  proves_heading: 'What This Proves',
  proves_points: [
    'CLOVER surfaces the real problems in two weeks, even when leadership believes they already understand what\'s happening.',
    'Manager-led action driven by bi-weekly reports compounds into measurable retention improvement without consultants, restructures, or additional platforms.',
    'In a competitive technology talent market, a 40% reduction in developer turnover delivered a 22:1 return on a $45,000 investment in six months.',
  ],
};
