// VERSION 4: PARTNERS AND RESELLERS
// File identifier: partner

module.exports = {
  id: 'partner',

  page1: {
    headerTitle: 'What You\'re Offering Your Clients',
    openingLine: 'Your clients are losing people they can\'t afford to replace. Clover ERA gives you a retention offering that sells on math, not promises.',
    preGridSection: {
      subheading: 'The Problem You Solve For Your Clients',
      text: 'Your clients track turnover rate. They don\'t track turnover cost. The gap is typically 4X what they estimate. Clover ERA makes that gap visible and gives their managers tools to close it before people resign.',
    },
    belowGridVariant: 'partner',
    rhythm: [
      { label: 'Daily', text: 'Client team members answer a short anonymous check-in. Takes under two minutes.' },
      { label: 'Bi-weekly', text: 'Client managers receive reports showing what\'s changed, who\'s at risk, and what to do.' },
      { label: 'Monthly', text: 'Team and department level insights showing patterns across the client organization.' },
      { label: 'Quarterly', text: 'Executive reporting showing cost impact and retention ROI.' },
    ],
    positioningSection: {
      subheading: 'How To Position It',
      text: 'This is operational infrastructure, not HR software. Sell to CEOs, CFOs, and COOs. The buyer is the person who owns the P&L, not the person who owns the people survey. The Turnover Intelligence Report is your door opener. A personalized financial exposure analysis for any company, generated in minutes. It shows them the gap between what they think turnover costs and what it actually costs. That report starts the conversation. Clover ERA is what they buy to close the gap.',
    },
  },

  page2: {
    headerTitle: 'The Commercial Opportunity',
    pricingTable: {
      subheading: 'Client Pricing',
      columns: ['Tier', 'Teams', 'People Covered', 'Monthly', 'Annual', 'Savings'],
      numCols: [3, 4, 5], // 0-indexed columns that are right-aligned
      rows: [
        ['Single Team', '1', 'Up to 20', '$295', '$3,540', '-'],
        ['5 Teams', '5', 'Up to 100', '$1,250', '$15,000', '15%'],
        ['10 Teams', '10', 'Up to 200', '$2,100', '$25,200', '29%'],
        ['25 Teams', '25', 'Up to 500', '$4,500', '$54,000', '39%'],
        ['50+ Teams', '50+', '500+', 'Custom', 'Custom', 'Call'],
      ],
      belowTable: 'Every tier breaks even for your client at one prevented departure.',
    },
    partnershipModel: {
      subheading: 'Your Partnership Model',
      referral: {
        heading: 'Referral Partner',
        lines: [
          'You introduce. We handle everything. From the first conversation through onboarding, ongoing management, and support.',
          '10% commission for the life of the customer.',
          'No operational load. No client management. You make the introduction, we do the rest.',
        ],
        commission: '10%',
      },
      managed: {
        heading: 'Managed Partner',
        lines: [
          'You own the relationship. You run the full customer management process from sale and onboarding through check-ins and ongoing support. Clover ERA is your retention offering, delivered under your client relationship.',
          '25% commission for the life of the customer.',
        ],
        commission: '25%',
      },
    },
    commissionTable: {
      subheading: 'What Lifetime Commission Looks Like',
      columns: ['Scenario', 'Client Size', 'Annual Revenue', 'Referral (10%)', 'Managed (25%)'],
      numCols: [2, 3, 4],
      rows: [
        ['5 clients', '10 teams each', '$126,000', '$12,600/yr', '$31,500/yr'],
        ['5 clients', '25 teams each', '$270,000', '$27,000/yr', '$67,500/yr'],
      ],
    },
  },
};
