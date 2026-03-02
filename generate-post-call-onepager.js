const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// ============================================================
// TIER SELECTION LOGIC
// ============================================================
function selectTiers(employeeCount) {
  if (employeeCount <= 100) {
    return [
      { name: 'Single Team', teams: 1, people: 20, monthly_cost: 295, annual_cost: 3540 },
      { name: '5 Teams', teams: 5, people: 100, monthly_cost: 1250, annual_cost: 15000 },
      { name: '10 Teams', teams: 10, people: 200, monthly_cost: 2100, annual_cost: 25200 },
    ];
  } else if (employeeCount <= 250) {
    return [
      { name: '5 Teams', teams: 5, people: 100, monthly_cost: 1250, annual_cost: 15000 },
      { name: '10 Teams', teams: 10, people: 200, monthly_cost: 2100, annual_cost: 25200 },
      { name: '25 Teams', teams: 25, people: 500, monthly_cost: 4500, annual_cost: 54000 },
    ];
  } else if (employeeCount <= 500) {
    return [
      { name: '10 Teams', teams: 10, people: 200, monthly_cost: 2100, annual_cost: 25200 },
      { name: '25 Teams', teams: 25, people: 500, monthly_cost: 4500, annual_cost: 54000 },
      { name: '50+ Teams', teams: '50+', people: '500+', monthly_cost: 'Custom', annual_cost: 'Custom' },
    ];
  } else {
    return [
      { name: '25 Teams', teams: 25, people: 500, monthly_cost: 4500, annual_cost: 54000 },
      { name: '50+ Teams', teams: '50+', people: '500+', monthly_cost: 'Custom', annual_cost: 'Custom' },
      { name: 'Enterprise', teams: 'Unlimited', people: 'Unlimited', monthly_cost: 8000, annual_cost: 96000 },
    ];
  }
}

// ============================================================
// APOLLO DATA TRANSFORMER
// ============================================================
function generateOnepagerData(apolloRecord) {
  const companyName = apolloRecord.company_name;
  const employeeCount = apolloRecord.estimated_num_employees;
  const dailyCost = apolloRecord.daily_cost;
  const annualCost = apolloRecord.annual_cost;
  const costPerDeparture = apolloRecord.cost_per_departure || 91582;

  const tiers = selectTiers(employeeCount);

  const data = {
    company_name: companyName,
    employee_count: employeeCount,
    cost_per_departure: costPerDeparture,
    actual_annual_turnover_cost: annualCost,
    their_estimated_turnover_cost: apolloRecord.stated_turnover_estimate
      ? apolloRecord.stated_turnover_estimate
      : Math.round(annualCost / 4),
    annual_cost_gap: apolloRecord.stated_turnover_estimate
      ? annualCost - apolloRecord.stated_turnover_estimate
      : Math.round(annualCost * 0.75),
    monthly_turnover_cost_estimate: Math.round(dailyCost * 30),
    expected_annual_departures: Math.round(annualCost / costPerDeparture),
    total_annual_turnover_cost: annualCost,
    recommended_tier_1: tiers[0],
    recommended_tier_2: tiers[1],
    recommended_tier_3: tiers[2],
    highest_tier_annual_cost: tiers[2].annual_cost,
    calendar_link: apolloRecord.calendar_link || 'https://cloverera.com/schedule',
  };

  // Optional 67-day fields
  if (apolloRecord['67_day_number'] && apolloRecord['67_day_total']) {
    data.sixty_seven_day_number = apolloRecord['67_day_number'];
    data.sixty_seven_day_total = apolloRecord['67_day_total'];
  }

  return data;
}

// ============================================================
// CURRENCY FORMATTER
// ============================================================
function fmt(value) {
  if (typeof value === 'string') return value;
  return '$' + Math.round(value).toLocaleString('en-US');
}

function fmtPeople(value) {
  if (typeof value === 'string') return value;
  return value.toLocaleString('en-US');
}

// ============================================================
// TEMPLATE DATA (placeholder version for template PDF)
// ============================================================
const TEMPLATE_DATA = {
  company_name: '{Company Name}',
  employee_count: '{Employee Count}',
  cost_per_departure: '{Cost Per Departure}',
  actual_annual_turnover_cost: '{4X Actual Annual Turnover Cost}',
  their_estimated_turnover_cost: '{Their Estimated Annual Turnover Cost}',
  annual_cost_gap: '{Annual Cost Gap}',
  monthly_turnover_cost_estimate: '{Monthly Turnover Cost Estimate}',
  expected_annual_departures: '{Expected Annual Departures}',
  total_annual_turnover_cost: '{Total Annual Turnover Cost}',
  recommended_tier_1: { name: '{Tier 1}', teams: '{Teams}', people: '{People}', monthly_cost: '{Monthly}', annual_cost: '{Annual}' },
  recommended_tier_2: { name: '{Tier 2}', teams: '{Teams}', people: '{People}', monthly_cost: '{Monthly}', annual_cost: '{Annual}' },
  recommended_tier_3: { name: '{Tier 3}', teams: '{Teams}', people: '{People}', monthly_cost: '{Monthly}', annual_cost: '{Annual}' },
  highest_tier_annual_cost: '{Highest Tier Annual Cost}',
  calendar_link: '{Calendar Link}',
};

// ============================================================
// SAMPLE DATA (for preview/demo PDF)
// ============================================================
const SAMPLE_APOLLO_RECORD = {
  company_name: 'Meridian Logistics',
  estimated_num_employees: 340,
  daily_cost: 7632,
  annual_cost: 2785680,
  cost_per_departure: 91582,
  calendar_link: 'https://cloverera.com/schedule',
};

// ============================================================
// DESIGN TOKENS
// ============================================================
const colors = {
  headerGreen: '#2D5016',
  costRed: '#8B1A1A',
  savingsGreen: '#1A5C1A',
  bodyText: '#333333',
  white: '#FFFFFF',
  lightGrey: '#F7F7F7',
  ruleBlue: '#D4DEE8',
  subtleGrey: '#777777',
  borderGrey: '#CCCCCC',
  accentCoral: '#E8634A',
};

// ============================================================
// HTML BUILDER
// ============================================================
function buildHTML(data, col, isTemplate) {
  // For template mode, values are already strings with merge field names
  // For populated mode, format currency values
  const v = {};
  if (isTemplate) {
    Object.keys(data).forEach(k => { v[k] = data[k]; });
  } else {
    v.company_name = data.company_name;
    v.employee_count = fmtPeople(data.employee_count);
    v.cost_per_departure = fmt(data.cost_per_departure);
    v.actual_annual_turnover_cost = fmt(data.actual_annual_turnover_cost);
    v.their_estimated_turnover_cost = fmt(data.their_estimated_turnover_cost);
    v.annual_cost_gap = fmt(data.annual_cost_gap);
    v.monthly_turnover_cost_estimate = fmt(data.monthly_turnover_cost_estimate);
    v.expected_annual_departures = fmtPeople(data.expected_annual_departures);
    v.total_annual_turnover_cost = fmt(data.total_annual_turnover_cost);
    v.highest_tier_annual_cost = fmt(data.highest_tier_annual_cost);
    v.calendar_link = data.calendar_link;
    v.recommended_tier_1 = data.recommended_tier_1;
    v.recommended_tier_2 = data.recommended_tier_2;
    v.recommended_tier_3 = data.recommended_tier_3;
  }

  function tierRow(tier, idx) {
    if (isTemplate) {
      return `<tr class="${idx % 2 === 1 ? 'alt-row' : ''}">
        <td>${tier.name}</td><td>${tier.teams}</td><td>${tier.people}</td>
        <td>${tier.monthly_cost}</td><td>${tier.annual_cost}</td>
        <td class="break-even">1 departure</td></tr>`;
    }
    return `<tr class="${idx % 2 === 1 ? 'alt-row' : ''}">
      <td>${tier.name}</td>
      <td>${typeof tier.teams === 'number' ? tier.teams : tier.teams}</td>
      <td>${typeof tier.people === 'number' ? 'Up to ' + fmtPeople(tier.people) : tier.people}</td>
      <td>${typeof tier.monthly_cost === 'number' ? fmt(tier.monthly_cost) : tier.monthly_cost}</td>
      <td>${typeof tier.annual_cost === 'number' ? fmt(tier.annual_cost) : tier.annual_cost}</td>
      <td class="break-even">1 departure</td></tr>`;
  }

  const notebookLines = Array.from({ length: 45 }, (_, i) =>
    `<div style="position:absolute;top:${24 * (i + 1)}px;left:0;right:0;height:1px;background:${col.ruleBlue};opacity:0.45;"></div>`
  ).join('');

  // 67-day line (optional)
  const sixtySevenLine = data.sixty_seven_day_number
    ? `<p class="sixty-seven">In the next 67 days, ${v.company_name} will likely lose ${fmtPeople(data.sixty_seven_day_number)} people at a cost of ${fmt(data.sixty_seven_day_total)}.</p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  @page { size: 8.5in 11in; margin: 0; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: ${col.bodyText};
    font-size: 9.5pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 8.5in;
    height: 11in;
    position: relative;
    overflow: hidden;
    page-break-after: always;
  }

  .page:last-child {
    page-break-after: auto;
  }

  /* Notebook lines background */
  .notebook-bg {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    pointer-events: none;
    z-index: 0;
  }

  .page-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  /* Header bar */
  .header-bar {
    background: ${col.headerGreen};
    padding: 14px 72px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-title {
    color: ${col.white};
    font-size: 13pt;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .header-logo {
    color: ${col.white};
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .company-name {
    font-family: 'Caveat', cursive;
    font-weight: 600;
  }

  /* Body padding */
  .body-area {
    padding: 0 72px;
    flex: 1;
  }

  /* Opening label */
  .opening-label {
    font-style: italic;
    color: ${col.subtleGrey};
    font-size: 9pt;
    padding-top: 16px;
    padding-bottom: 14px;
  }

  /* Section headers */
  .section-header {
    font-size: 10pt;
    font-weight: 800;
    color: ${col.headerGreen};
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 2px solid ${col.headerGreen};
  }

  /* The Gap visual */
  .gap-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 48px;
    padding: 18px 0 10px;
  }

  .gap-number {
    text-align: center;
  }

  .gap-estimated {
    position: relative;
    display: inline-block;
  }

  .gap-estimated .amount {
    font-size: 26pt;
    font-weight: 800;
    color: ${col.subtleGrey};
    opacity: 0.6;
  }

  .gap-estimated .strikethrough {
    position: absolute;
    top: 0; left: -8px; right: -8px; bottom: 0;
    pointer-events: none;
  }

  .gap-estimated .strikethrough svg {
    width: 100%;
    height: 100%;
  }

  .gap-label {
    font-size: 7.5pt;
    color: ${col.subtleGrey};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-top: 2px;
  }

  .gap-actual .amount {
    font-size: 30pt;
    font-weight: 800;
    color: ${col.costRed};
  }

  .gap-arrow {
    font-size: 24pt;
    color: ${col.costRed};
    font-weight: 300;
  }

  .gap-explanation {
    text-align: center;
    font-size: 9pt;
    color: ${col.bodyText};
    padding-bottom: 16px;
    max-width: 540px;
    margin: 0 auto;
    line-height: 1.4;
  }

  /* Steps */
  .steps-section {
    padding-bottom: 14px;
  }

  .step {
    display: flex;
    gap: 12px;
    margin-bottom: 10px;
    align-items: flex-start;
  }

  .step-num {
    font-size: 16pt;
    font-weight: 800;
    color: ${col.headerGreen};
    line-height: 1;
    min-width: 24px;
    padding-top: 2px;
  }

  .step-text {
    font-size: 9.5pt;
    line-height: 1.45;
    flex: 1;
  }

  /* Inaction strip */
  .inaction-strip {
    background: ${col.lightGrey};
    border-left: 4px solid ${col.costRed};
    padding: 14px 20px;
    margin: 10px 0 14px;
  }

  .inaction-strip p {
    font-size: 9.5pt;
    font-weight: 600;
    line-height: 1.45;
    color: ${col.bodyText};
  }

  .inaction-strip .cost-highlight {
    color: ${col.costRed};
    font-weight: 800;
  }

  /* CTA */
  .cta-section {
    text-align: center;
    padding: 14px 0 0;
  }

  .cta-heading {
    font-size: 11pt;
    font-weight: 800;
    color: ${col.headerGreen};
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .cta-link {
    font-size: 9pt;
    color: ${col.headerGreen};
    font-weight: 600;
    margin-bottom: 6px;
  }

  .cta-body {
    font-size: 8.5pt;
    color: ${col.subtleGrey};
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.4;
  }

  /* Footer */
  .footer {
    background: ${col.white};
    border-top: 1px solid ${col.borderGrey};
    padding: 8px 72px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }

  .footer-left {
    font-size: 7pt;
    color: ${col.headerGreen};
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .footer-right {
    font-size: 7pt;
    color: ${col.subtleGrey};
    font-style: italic;
  }

  /* ===== PAGE 2 ===== */
  .question-block {
    margin-bottom: 14px;
  }

  .question-quote {
    font-size: 10.5pt;
    font-weight: 700;
    color: ${col.headerGreen};
    margin-bottom: 5px;
    font-style: italic;
  }

  .question-answer {
    font-size: 9pt;
    line-height: 1.45;
    color: ${col.bodyText};
  }

  .question-answer .cost-highlight {
    color: ${col.costRed};
    font-weight: 700;
  }

  .question-answer .savings-highlight {
    color: ${col.savingsGreen};
    font-weight: 700;
  }

  /* ROI emphasis */
  .roi-callout {
    text-align: center;
    padding: 10px 0 12px;
    font-size: 10pt;
    font-weight: 700;
  }

  .roi-callout .savings-highlight {
    color: ${col.savingsGreen};
    font-weight: 800;
    font-size: 12pt;
  }

  /* Table */
  .tier-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 8.5pt;
  }

  .tier-table thead tr {
    background: ${col.headerGreen};
  }

  .tier-table thead th {
    color: ${col.white};
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 7px 8px;
    text-align: left;
  }

  .tier-table tbody td {
    padding: 6px 8px;
    border-bottom: 1px solid #E0E0E0;
    font-size: 8.5pt;
  }

  .tier-table .alt-row td {
    background: ${col.lightGrey};
  }

  .tier-table .break-even {
    color: ${col.savingsGreen};
    font-weight: 700;
  }

  .table-note {
    font-size: 8pt;
    line-height: 1.4;
    color: ${col.bodyText};
    margin: 6px 0 10px;
  }

  .table-note .cost-highlight {
    color: ${col.costRed};
    font-weight: 700;
  }

  .table-note .savings-highlight {
    color: ${col.savingsGreen};
    font-weight: 700;
  }

  /* Bottom strip */
  .bottom-strip {
    background: ${col.lightGrey};
    border-left: 4px solid ${col.headerGreen};
    padding: 12px 20px;
    margin: 8px 0 12px;
  }

  .bottom-strip p {
    font-size: 8.5pt;
    line-height: 1.45;
    color: ${col.bodyText};
  }

  .bottom-strip .cost-highlight {
    color: ${col.costRed};
    font-weight: 700;
  }

  .sixty-seven {
    font-size: 8.5pt;
    color: ${col.costRed};
    font-weight: 600;
    margin-top: 6px;
  }

  /* P2 CTA */
  .p2-cta {
    text-align: center;
    padding: 10px 0 0;
  }

  .p2-cta .cta-heading {
    font-size: 10pt;
  }

  .p2-cta .cta-link {
    font-size: 8.5pt;
  }

  .merge-field {
    background: #FFF3CD;
    padding: 1px 4px;
    border-radius: 2px;
    font-family: 'Inter', monospace;
    font-size: 8pt;
    border: 1px dashed #D4A017;
  }
</style>
</head>
<body>

<!-- ==================== PAGE 1: THE DECISION PAGE ==================== -->
<div class="page">
  <div class="notebook-bg">${notebookLines}</div>
  <div class="page-content">

    <div class="header-bar">
      <div class="header-title">Prepared for <span class="company-name">${isTemplate ? '<span class="merge-field">' + v.company_name + '</span>' : v.company_name}</span></div>
      <div class="header-logo">Clover ERA</div>
    </div>

    <div class="body-area">
      <div class="opening-label">The cost between what you're tracking and what you're losing.</div>

      <!-- THE GAP -->
      <div class="section-header">The Gap</div>

      <div class="gap-container">
        <div class="gap-number">
          <div class="gap-estimated">
            <span class="amount">${isTemplate ? '<span class="merge-field">' + v.their_estimated_turnover_cost + '</span>' : v.their_estimated_turnover_cost}</span>
            <div class="strikethrough">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="95" x2="100" y2="5" stroke="${col.costRed}" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </div>
          </div>
          <div class="gap-label">What you're tracking</div>
        </div>

        <div class="gap-arrow">&rarr;</div>

        <div class="gap-number">
          <div class="gap-actual">
            <span class="amount">${isTemplate ? '<span class="merge-field">' + v.actual_annual_turnover_cost + '</span>' : v.actual_annual_turnover_cost}</span>
          </div>
          <div class="gap-label">What it's actually costing</div>
        </div>
      </div>

      <div class="gap-explanation">Most companies track turnover rate. The ones who lose least track turnover cost. The gap is typically 4X.</div>

      <!-- WHAT CHANGES -->
      <div class="section-header">How Clover ERA Works</div>

      <div class="steps-section">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">We measure what's actually happening across your teams through daily anonymous check-ins built on six proven retention dimensions.</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">Your managers receive specific, prioritized actions before someone reaches the point of resignation.</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text">You see cost impact at the team, department, and company level, updated in real time.</div>
        </div>
      </div>

      <!-- THE INACTION LINE -->
      <div class="inaction-strip">
        <p>Every month without visibility costs <span class="company-name">${isTemplate ? '<span class="merge-field">' + v.company_name + '</span>' : v.company_name}</span> approximately <span class="cost-highlight">${isTemplate ? '<span class="merge-field">' + v.monthly_turnover_cost_estimate + '</span>' : v.monthly_turnover_cost_estimate}</span>. Not in scores. In replacement costs, lost productivity, and institutional knowledge walking out the door.</p>
      </div>

      <!-- CTA -->
      <div class="cta-section">
        <div class="cta-heading">Schedule Your Free Turnover Analysis</div>
        <div class="cta-link">${isTemplate ? '<span class="merge-field">' + v.calendar_link + '</span>' : v.calendar_link}</div>
        <div class="cta-body">We will show you the exact gap between what you're tracking and what you're losing. No commitment. No pitch. Just the math.</div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">Schedule Your Free Turnover Analysis &nbsp;|&nbsp; cloverera.com</div>
      <div class="footer-right">Confidential</div>
    </div>

  </div>
</div>

<!-- ==================== PAGE 2: THE CFO PAGE ==================== -->
<div class="page">
  <div class="notebook-bg">${notebookLines}</div>
  <div class="page-content">

    <div class="header-bar">
      <div class="header-title">The Three Questions Your CFO Will Ask</div>
      <div class="header-logo">Clover ERA</div>
    </div>

    <div class="body-area" style="padding-top: 14px;">

      <!-- Q1 -->
      <div class="question-block">
        <div class="question-quote">"We already track turnover."</div>
        <div class="question-answer">You track who left and when. Clover ERA measures why they're about to. Most organizations calculate turnover using direct replacement cost only. The full cost, including lost productivity, knowledge transfer failure, team disruption, and manager time, runs 4X higher. For <span class="company-name">${isTemplate ? '<span class="merge-field">' + v.company_name + '</span>' : v.company_name}</span> at ${isTemplate ? '<span class="merge-field">' + v.employee_count + '</span>' : v.employee_count} employees, the difference between what you're reporting to the board and what turnover is actually costing is approximately <span class="cost-highlight">${isTemplate ? '<span class="merge-field">' + v.annual_cost_gap + '</span>' : v.annual_cost_gap}</span>.</div>
      </div>

      <!-- Q2 -->
      <div class="question-block">
        <div class="question-quote">"How is this different from what we already have?"</div>
        <div class="question-answer">Annual surveys measure what people felt three months ago. Quarterly pulse checks measure what people felt three weeks ago. Clover ERA measures what's changing today across six dimensions: Communication, Learning, Opportunity, Vulnerability, Enablement, and Reflection. Each maps to specific neurochemical drivers of retention. When a score shifts, the manager gets a recommended action before the shift becomes a resignation. The difference is timing. Most tools tell you what happened. This tells you what's happening.</div>
      </div>

      <!-- Q3 -->
      <div class="question-block">
        <div class="question-quote">"What's the ROI?"</div>
        <div class="roi-callout">Single prevented departure at <span class="company-name">${isTemplate ? '<span class="merge-field">' + v.company_name + '</span>' : v.company_name}</span> saves approximately <span class="savings-highlight">${isTemplate ? '<span class="merge-field">' + v.cost_per_departure + '</span>' : v.cost_per_departure}</span>.</div>

        <table class="tier-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Teams</th>
              <th>People Covered</th>
              <th>Monthly</th>
              <th>Annual</th>
              <th>Breaks Even At</th>
            </tr>
          </thead>
          <tbody>
            ${tierRow(isTemplate ? v.recommended_tier_1 : data.recommended_tier_1, 0)}
            ${tierRow(isTemplate ? v.recommended_tier_2 : data.recommended_tier_2, 1)}
            ${tierRow(isTemplate ? v.recommended_tier_3 : data.recommended_tier_3, 2)}
          </tbody>
        </table>

        <div class="table-note">Every tier is profitable if it prevents one departure. At <span class="company-name">${isTemplate ? '<span class="merge-field">' + v.company_name + '</span>' : v.company_name}</span>, one departure costs <span class="cost-highlight">${isTemplate ? '<span class="merge-field">' + v.cost_per_departure + '</span>' : v.cost_per_departure}</span>. The highest investment tier listed above is <span class="savings-highlight">${isTemplate ? '<span class="merge-field">' + v.highest_tier_annual_cost + '</span>' : v.highest_tier_annual_cost}</span>.</div>
      </div>

      <!-- Bottom strip -->
      <div class="bottom-strip">
        <p><span class="company-name">${isTemplate ? '<span class="merge-field">' + v.company_name + '</span>' : v.company_name}</span> currently has approximately ${isTemplate ? '<span class="merge-field">' + v.employee_count + '</span>' : v.employee_count} employees. Based on industry averages, <span class="cost-highlight">${isTemplate ? '<span class="merge-field">' + v.expected_annual_departures + '</span>' : v.expected_annual_departures}</span> will leave this year. At <span class="cost-highlight">${isTemplate ? '<span class="merge-field">' + v.cost_per_departure + '</span>' : v.cost_per_departure}</span> per departure, that represents <span class="cost-highlight">${isTemplate ? '<span class="merge-field">' + v.total_annual_turnover_cost + '</span>' : v.total_annual_turnover_cost}</span> in total turnover cost. The question is not whether people will leave. It's how many you can prevent and how early you see it coming.</p>
        ${sixtySevenLine}
      </div>

      <!-- P2 CTA -->
      <div class="p2-cta">
        <div class="cta-heading">Schedule Your Free Turnover Analysis</div>
        <div class="cta-link">${isTemplate ? '<span class="merge-field">' + v.calendar_link + '</span>' : v.calendar_link}</div>
      </div>

    </div>

    <div class="footer">
      <div class="footer-left">Schedule Your Free Turnover Analysis &nbsp;|&nbsp; cloverera.com</div>
      <div class="footer-right">Confidential</div>
    </div>

  </div>
</div>

</body>
</html>`;
}

// ============================================================
// PDF GENERATION
// ============================================================
async function generatePDF(data, outputFilename, isTemplate = false) {
  const html = buildHTML(data, colors, isTemplate);
  const outputPath = path.resolve(__dirname, outputFilename);
  const previewPath = outputPath.replace('.pdf', '-preview.png');

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  console.log(`Generating PDF: ${outputFilename}...`);
  await page.pdf({
    path: outputPath,
    width: '8.5in',
    height: '11in',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  // Screenshot page 1 for preview
  console.log('Generating preview...');
  await page.screenshot({
    path: previewPath,
    clip: { x: 0, y: 0, width: 816, height: 1056 },
  });

  // Screenshot page 2
  const preview2Path = outputPath.replace('.pdf', '-page2-preview.png');
  await page.evaluate(() => window.scrollTo(0, document.querySelector('.page:last-child').offsetTop));
  await new Promise(r => setTimeout(r, 200));

  // Re-render with page 2 visible
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
  // Extract page 2 HTML by showing only page 2
  const page2Html = html.replace(
    '<!-- ==================== PAGE 1: THE DECISION PAGE ====================',
    '<!-- PAGE 1 HIDDEN'
  ).replace(
    /<div class="page">\s*<div class="notebook-bg">.*?<\/div>\s*<div class="page-content">.*?<div class="header-bar">.*?Prepared for/s,
    '<div class="page" style="display:none;"><div class="page-content"><div class="header-bar"><div class="header-title">Prepared for'
  );
  await page2.setContent(page2Html, { waitUntil: 'networkidle0' });
  await page2.screenshot({
    path: preview2Path,
    clip: { x: 0, y: 0, width: 816, height: 1056 },
  });

  await browser.close();

  const stats = fs.statSync(outputPath);
  console.log(`PDF saved: ${outputPath} (${Math.round(stats.size / 1024)}KB)`);
  console.log(`Preview saved: ${previewPath}`);
  console.log(`Page 2 preview saved: ${preview2Path}`);
}

// ============================================================
// MAIN - Generate both template and sample
// ============================================================
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--template') {
    await generatePDF(TEMPLATE_DATA, 'clover-era-post-call-template.pdf', true);
  } else if (args[0] === '--sample') {
    const sampleData = generateOnepagerData(SAMPLE_APOLLO_RECORD);
    await generatePDF(sampleData, 'clover-era-post-call-sample.pdf', false);
  } else if (args[0] === '--json') {
    // Accept JSON file path as input
    const jsonPath = path.resolve(args[1]);
    const apolloRecord = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const data = generateOnepagerData(apolloRecord);
    const companySlug = data.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await generatePDF(data, `clover-era-${companySlug}.pdf`, false);
  } else {
    // Default: generate both
    console.log('=== Generating template version ===');
    await generatePDF(TEMPLATE_DATA, 'clover-era-post-call-template.pdf', true);

    console.log('\n=== Generating sample (Meridian Logistics) ===');
    const sampleData = generateOnepagerData(SAMPLE_APOLLO_RECORD);
    await generatePDF(sampleData, 'clover-era-post-call-sample.pdf', false);
  }
}

// Export for external use
module.exports = { generateOnepagerData, selectTiers, generatePDF, buildHTML, colors };

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
