// VERSION 1: CEO / CFO
// File identifier: ceo

module.exports = {
  id: 'ceo',

  page1: {
    headerTitle: 'How Clover ERA Works',
    openingLine: 'Your teams check in daily. Your leadership team sees the financial exposure in real time.',
    belowGridVariant: 'standard',
    rhythm: [
      { label: 'Daily', text: 'Anonymous team check-ins. Takes under two minutes per person.' },
      { label: 'Bi-weekly', text: 'Manager reports showing what\'s changed, who\'s at risk, and what to do about it.' },
      { label: 'Monthly', text: 'Team and department level insights showing patterns across the organization.' },
      { label: 'Quarterly', text: 'Executive reporting showing cost impact, trend data, and prevented turnover value.' },
    ],
    actionHub: {
      subheading: 'Executive Visibility',
      text: 'Leadership doesn\'t wait for quarterly reviews to understand retention risk. Clover ERA surfaces financial exposure at the team, department, and company level in real time. Your managers receive specific recommended actions tied to what\'s shifting on their teams. When managers act earlier, the cost impact shows up in your numbers. Direct line from manager behavior to P&L.',
    },
  },

  page2: {
    headerTitle: 'What Changes When It\'s Running',
    beforeAfter: [
      { before: 'Turnover cost is a number finance reports once a year', after: 'Turnover cost is a live figure updated in real time' },
      { before: 'Replacement costs surface after someone leaves', after: 'Financial exposure is visible before a decision is made' },
      { before: 'No line item connects manager behavior to P&L impact', after: 'Direct correlation between manager action and retention cost' },
      { before: 'Board reporting relies on lagging indicators', after: 'Leadership sees leading indicators across every team' },
      { before: 'The question is "what did turnover cost us last year?"', after: 'The question becomes "what are we preventing this quarter?"' },
    ],
    reportSection: {
      subheading: 'What Your Leadership Team Sees',
      intro: 'An executive dashboard that answers three questions:',
      questions: [
        'What is our total turnover exposure right now?',
        'Which teams and departments carry the highest risk?',
        'What is the cost trend quarter over quarter?',
      ],
    },
    investmentTemplate: 'ceo', // uses company_name if available
  },
};
