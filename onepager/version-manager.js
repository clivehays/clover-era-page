// VERSION 3: MANAGERS AND TEAM LEADS
// File identifier: manager

module.exports = {
  id: 'manager',

  page1: {
    headerTitle: 'How Clover ERA Works',
    openingLine: 'Your team checks in daily. You get clarity on what\'s really happening before someone decides to leave.',
    belowGridVariant: 'standard',
    rhythm: [
      { label: 'Daily', text: 'Your team answers a short anonymous check-in. Takes under two minutes. You don\'t see individual responses. You see patterns.' },
      { label: 'Bi-weekly', text: 'You receive a report showing what\'s changed on your team, who needs attention, and a specific recommended action.' },
      { label: 'Monthly', text: 'Team-level insights showing trends over time so you can see whether things are improving or declining.' },
      { label: 'Quarterly', text: 'Your contribution to retention is visible to leadership with real cost impact data.' },
    ],
    actionHub: {
      subheading: 'What Lands In Your Hands',
      text: 'Not another dashboard to check. Not another training to complete. Every two weeks you receive a report that tells you who needs attention, what specifically changed, and what conversation to have this week. The system does the analysis. You have the conversation. When someone on your team starts pulling away, you\'ll know before they\'ve made a decision. Not after they\'ve handed in notice.',
    },
  },

  page2: {
    headerTitle: 'What Changes When It\'s Running',
    beforeAfter: [
      { before: 'You find out someone is leaving when they hand in notice', after: 'You see risk signals weeks before they decide' },
      { before: '1:1s rely on what people choose to tell you', after: 'Anonymous daily data shows what people won\'t say directly' },
      { before: 'You guess which team members need attention', after: 'You know which team members need attention and why' },
      { before: 'Silence from a team member could mean anything', after: 'Silence is measured, flagged, and explained' },
      { before: 'You react to resignations', after: 'You prevent them' },
    ],
    reportSection: {
      subheading: 'What You See Every Two Weeks',
      intro: 'A bi-weekly report that answers three questions:',
      questions: [
        'Who on my team should I be paying attention to right now?',
        'What specifically changed and when did it shift?',
        'What should I do about it this week?',
      ],
      closingLine: 'No noise. No aggregate scores. No 40-page report. Three answers. One conversation.',
    },
    investmentTemplate: 'manager',
  },
};
