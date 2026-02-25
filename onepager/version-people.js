// VERSION 2: HEAD OF PEOPLE / HR
// File identifier: people

module.exports = {
  id: 'people',

  page1: {
    headerTitle: 'How Clover ERA Works',
    openingLine: 'Your teams check in daily. Your People function gets the data that turns retention from reactive to predictive.',
    belowGridVariant: 'standard',
    rhythm: [
      { label: 'Daily', text: 'Anonymous team check-ins. Takes under two minutes per person. Responses are completely anonymous to maintain psychological safety.' },
      { label: 'Bi-weekly', text: 'Manager reports with specific actions. Your People team sees the same data with organizational context.' },
      { label: 'Monthly', text: 'Cross-team and department level patterns showing where systemic issues are developing.' },
      { label: 'Quarterly', text: 'Executive-ready reporting with cost impact data in language your CFO will act on.' },
    ],
    actionHub: {
      subheading: 'From Sentiment to Strategy',
      text: 'Most retention data arrives too late and in the wrong language. Annual surveys capture what people felt months ago. CLOVER captures what\'s shifting today and translates it into financial exposure your leadership team can act on. Your People function moves from reporting sentiment to reporting cost impact. From exit interviews explaining what you lost to daily signals showing what you\'re about to lose.',
    },
  },

  page2: {
    headerTitle: 'What Changes When It\'s Running',
    beforeAfter: [
      { before: 'Annual survey results delivered months after collection', after: 'Continuous data showing shifts as they happen' },
      { before: 'People team reports sentiment, leadership ignores it', after: 'People team reports financial exposure, leadership acts' },
      { before: 'Exit interviews explain what you already lost', after: 'Daily signals show what you\'re about to lose' },
      { before: 'Retention strategy is reactive and event-driven', after: 'Retention strategy is predictive and data-driven' },
      { before: 'People function is seen as cost centre', after: 'People function is connected directly to cost prevention' },
    ],
    reportSection: {
      subheading: 'What Your People Team Sees',
      intro: 'Organization-wide analytics that answer three questions:',
      questions: [
        'Which managers need support right now and why?',
        'Where are the systemic patterns across teams and departments?',
        'What is the data telling leadership they need to hear?',
      ],
    },
    investmentTemplate: 'people',
  },
};
