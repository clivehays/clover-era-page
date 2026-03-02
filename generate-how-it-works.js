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
// CURRENCY / NUMBER FORMATTING
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
// STATIC CONTENT - PAGE 1 (never changes)
// ============================================================
const page1 = {
  headerTitle: 'How Clover ERA Works',
  openingLine: 'Your teams answer six questions daily. Your managers get clarity before it\'s too late.',

  dimensionIntro: 'Every day, each team member receives a short anonymous check-in built on six dimensions that predict whether someone stays or leaves.',

  dimensions: [
    { letter: 'C', word: 'Communication', question: 'Is information flowing both ways? Do people feel heard?' },
    { letter: 'L', word: 'Learning', question: 'Are people growing? Do they feel like they\'re developing?' },
    { letter: 'O', word: 'Opportunity', question: 'Can people see a future here? Is there somewhere to go?' },
    { letter: 'V', word: 'Vulnerability', question: 'Can people be honest without risk? Is it safe to speak up?' },
    { letter: 'E', word: 'Enablement', question: 'Do people have what they need to do their job? Are blockers being removed?' },
    { letter: 'R', word: 'Reflection', question: 'Do people feel recognized? Is their contribution visible?' },
  ],

  dimensionFootnote: 'These aren\'t opinion questions. Each maps to specific neurochemical drivers of retention documented in peer-reviewed research. When a dimension shifts, it shows up before the person has made a decision. Not after.',

  rhythmItems: [
    { label: 'Daily', text: 'Anonymous team check-ins. Takes under two minutes.' },
    { label: 'Bi-weekly', text: 'Manager reports showing what\'s changed, who\'s at risk, and what to do about it.' },
    { label: 'Monthly', text: 'Team-level insights showing patterns across the organization.' },
    { label: 'Quarterly', text: 'Executive reporting showing cost impact and trend data.' },
  ],

  actionHubText: 'Managers don\'t get a dashboard and a "good luck." They get specific recommended actions tied to what\'s actually shifting on their team. The system tells them who needs attention, why, and what conversation to have. Not theory. Not training. A specific next step for a specific person this week.',
};

// ============================================================
// STATIC CONTENT - PAGE 2 (investment section is dynamic)
// ============================================================
const page2 = {
  headerTitle: 'What Changes When It\'s Running',

  beforeAfter: [
    {
      before: 'Manager finds out someone is leaving when they resign',
      after: 'Manager sees risk signals weeks before a decision is made',
    },
    {
      before: 'Exit interviews explain what already happened',
      after: 'Daily data shows what\'s happening right now',
    },
    {
      before: 'Annual survey captures one moment in time',
      after: 'Continuous measurement captures shifts as they occur',
    },
    {
      before: 'Managers rely on gut instinct to assess team health',
      after: 'Managers receive specific, timely data on each team member',
    },
    {
      before: 'Turnover cost is a number finance reports once a year',
      after: 'Turnover cost is a live figure leadership can act on',
    },
    {
      before: 'The question is "why did they leave?"',
      after: 'The question becomes "who can we keep?"',
    },
  ],

  managerReportIntro: 'A bi-weekly report that answers three questions:',
  managerQuestions: [
    'Who on my team should I be paying attention to right now?',
    'What specifically changed and when?',
    'What should I do about it this week?',
  ],
  managerReportClose: 'No noise. No aggregate scores. No 40-page report that sits unread. Three answers that lead to one conversation.',

  ctaText: 'Schedule Your Free Turnover Analysis',
  ctaUrl: 'cloverera.com',
};

// ============================================================
// DESIGN TOKENS
// ============================================================
const colors = {
  headerGreen: '#2D5016',
  headerGreenLight: '#3A6B1E',
  bodyText: '#333333',
  white: '#FFFFFF',
  lightGrey: '#F7F7F7',
  ruleBlue: '#D4DEE8',
  subtleGrey: '#777777',
  borderGrey: '#CCCCCC',
  dimGreen: '#4A7A2E',
  beforeBg: '#FDF6F4',
  afterBg: '#F3F8EF',
  beforeBorder: '#C8A09A',
  afterBorder: '#7BA65A',
};

// ============================================================
// HTML BUILDER
// ============================================================
function buildHTML(col, dynamicData) {
  // dynamicData is null for generic, or { company_name, tier_name, people, annual_cost, cost_per_departure, calendar_link }
  const isPersonalized = dynamicData && dynamicData.company_name;

  const p1HeaderExtra = isPersonalized
    ? ` <span style="font-family:'Caveat',cursive;font-weight:500;font-size:11pt;opacity:0.85;">for ${dynamicData.company_name}</span>`
    : '';

  // Notebook lines
  const notebookLines = '';

  // Dimensions grid (2x3)
  const dimGrid = page1.dimensions.map(d => `
    <div class="dim-cell">
      <div class="dim-letter">${d.letter}</div>
      <div class="dim-content">
        <div class="dim-word">${d.word}</div>
        <div class="dim-question">${d.question}</div>
      </div>
    </div>
  `).join('');

  // Rhythm items
  const rhythmRows = page1.rhythmItems.map(r => `
    <div class="rhythm-item">
      <span class="rhythm-label">${r.label}:</span>
      <span class="rhythm-text">${r.text}</span>
    </div>
  `).join('');

  // Before/After rows
  const baRows = page2.beforeAfter.map(row => `
    <tr>
      <td class="ba-before">${row.before}</td>
      <td class="ba-after">${row.after}</td>
    </tr>
  `).join('');

  // Manager questions
  const mgrQuestions = page2.managerQuestions.map((q, i) => `
    <div class="mgr-question">
      <span class="mgr-num">${i + 1}</span>
      <span class="mgr-text">${q}</span>
    </div>
  `).join('');

  // Investment section
  let investmentSection;
  if (dynamicData && dynamicData.tier_name) {
    const peopleLine = typeof dynamicData.people === 'number'
      ? `up to ${fmtPeople(dynamicData.people)} people`
      : `${dynamicData.people} people`;
    const annualLine = typeof dynamicData.annual_cost === 'number'
      ? fmt(dynamicData.annual_cost)
      : dynamicData.annual_cost;
    const costLine = fmt(dynamicData.cost_per_departure || 91582);

    investmentSection = `
      <div class="investment-section">
        <div class="section-label">Investment</div>
        <div class="investment-body">
          <p><strong>${dynamicData.tier_name}</strong> covers ${peopleLine} at <strong>${annualLine}</strong> per year.</p>
          <p>One prevented departure at your company saves approximately <strong>${costLine}</strong>.</p>
          <p>The investment breaks even at one.</p>
        </div>
      </div>`;
  } else {
    investmentSection = `
      <div class="investment-section">
        <div class="section-label">Investment</div>
        <div class="investment-body">
          <p>Pricing is based on the number of teams and people covered. Every tier breaks even at a single prevented departure.</p>
          <p>The average cost of one departure: <strong>$91,582</strong>.</p>
          <p>The investment breaks even at one.</p>
        </div>
      </div>`;
  }

  const calendarLink = (dynamicData && dynamicData.calendar_link) || 'https://cloverera.com/schedule';

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
    line-height: 1.5;
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
  .page:last-child { page-break-after: auto; }

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

  /* Header */
  .header-bar {
    background: ${col.headerGreen};
    padding: 13px 72px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-title {
    color: ${col.white};
    font-size: 13pt;
    font-weight: 700;
    letter-spacing: 0.3px;
  }
  .header-logo {
    color: ${col.white};
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .body-area {
    padding: 0 72px;
    flex: 1;
  }

  /* Opening line */
  .opening-line {
    font-size: 11pt;
    font-weight: 600;
    color: ${col.headerGreen};
    padding: 16px 0 14px;
    line-height: 1.4;
  }

  /* Section labels */
  .section-label {
    font-size: 9pt;
    font-weight: 800;
    color: ${col.headerGreen};
    text-transform: uppercase;
    letter-spacing: 1.8px;
    margin-bottom: 8px;
    padding-bottom: 5px;
    border-bottom: 2px solid ${col.headerGreen};
  }

  .section-intro {
    font-size: 9pt;
    color: ${col.bodyText};
    margin-bottom: 12px;
    line-height: 1.45;
  }

  /* Dimension grid */
  .dim-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
  }

  .dim-cell {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 7px 10px;
    background: ${col.lightGrey};
    border-radius: 4px;
    border-left: 3px solid ${col.headerGreen};
  }

  .dim-letter {
    font-size: 18pt;
    font-weight: 800;
    color: ${col.headerGreen};
    line-height: 1;
    min-width: 22px;
    padding-top: 2px;
  }

  .dim-content {
    flex: 1;
  }

  .dim-word {
    font-size: 9pt;
    font-weight: 700;
    color: ${col.headerGreen};
    margin-bottom: 1px;
  }

  .dim-question {
    font-size: 8pt;
    color: ${col.subtleGrey};
    line-height: 1.35;
  }

  .dim-footnote {
    font-size: 8pt;
    color: ${col.subtleGrey};
    line-height: 1.4;
    margin-bottom: 16px;
    font-style: italic;
  }

  /* Rhythm */
  .rhythm-section {
    margin-bottom: 14px;
  }

  .rhythm-item {
    margin-bottom: 5px;
    font-size: 9pt;
    line-height: 1.4;
  }

  .rhythm-label {
    font-weight: 700;
    color: ${col.headerGreen};
  }

  .rhythm-text {
    color: ${col.bodyText};
  }

  /* Action Hub */
  .action-hub-section {
    margin-bottom: 0;
  }

  .action-hub-text {
    font-size: 9pt;
    line-height: 1.5;
    color: ${col.bodyText};
  }

  /* Footer */
  .footer {
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

  /* Before / After table */
  .ba-section {
    margin-bottom: 16px;
  }

  .ba-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 6px;
    margin-top: 4px;
  }

  .ba-table thead th {
    font-size: 8pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    padding: 8px 14px;
    text-align: left;
  }

  .ba-table thead th:first-child {
    background: ${col.beforeBg};
    color: #7A4A3A;
    border-radius: 4px 0 0 4px;
    width: 50%;
  }

  .ba-table thead th:last-child {
    background: ${col.afterBg};
    color: ${col.headerGreen};
    border-radius: 0 4px 4px 0;
    width: 50%;
  }

  .ba-before {
    font-size: 8.5pt;
    line-height: 1.4;
    padding: 9px 14px;
    background: ${col.beforeBg};
    border-left: 3px solid ${col.beforeBorder};
    border-radius: 4px 0 0 4px;
    color: #5A3A30;
    vertical-align: top;
  }

  .ba-after {
    font-size: 8.5pt;
    line-height: 1.4;
    padding: 9px 14px;
    background: ${col.afterBg};
    border-left: 3px solid ${col.afterBorder};
    border-radius: 0 4px 4px 0;
    color: ${col.headerGreen};
    font-weight: 500;
    vertical-align: top;
  }

  /* Manager section */
  .mgr-section {
    margin-bottom: 14px;
  }

  .mgr-intro {
    font-size: 9pt;
    color: ${col.bodyText};
    margin-bottom: 8px;
  }

  .mgr-question {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 6px;
  }

  .mgr-num {
    font-size: 14pt;
    font-weight: 800;
    color: ${col.headerGreen};
    line-height: 1;
    min-width: 20px;
    padding-top: 1px;
  }

  .mgr-text {
    font-size: 9.5pt;
    font-weight: 500;
    line-height: 1.4;
    color: ${col.bodyText};
  }

  .mgr-close {
    font-size: 8.5pt;
    color: ${col.subtleGrey};
    margin-top: 6px;
    line-height: 1.4;
  }

  /* Investment */
  .investment-section {
    margin-bottom: 12px;
  }

  .investment-body {
    font-size: 9.5pt;
    line-height: 1.5;
  }

  .investment-body p {
    margin-bottom: 4px;
  }

  .investment-body strong {
    color: ${col.headerGreen};
  }

  /* CTA */
  .p2-cta {
    text-align: center;
    padding: 8px 0;
  }

  .cta-button {
    display: inline-block;
    background: ${col.headerGreen};
    color: ${col.white};
    font-size: 10pt;
    font-weight: 700;
    padding: 10px 32px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }

  .cta-url {
    font-size: 8pt;
    color: ${col.subtleGrey};
    margin-top: 5px;
  }
</style>
</head>
<body>

<!-- ==================== PAGE 1: WHAT CLOVER ERA DOES ==================== -->
<div class="page">
  <div class="notebook-bg">${notebookLines}</div>
  <div class="page-content">

    <div class="header-bar">
      <div class="header-title">${page1.headerTitle}${p1HeaderExtra}</div>
      <div class="header-logo">Clover ERA</div>
    </div>

    <div class="body-area">
      <div class="opening-line">${page1.openingLine}</div>

      <div class="section-label">The Six Dimensions</div>
      <div class="section-intro">${page1.dimensionIntro}</div>

      <div class="dim-grid">
        ${dimGrid}
      </div>

      <div class="dim-footnote">${page1.dimensionFootnote}</div>

      <div class="rhythm-section">
        <div class="section-label">The Rhythm</div>
        ${rhythmRows}
      </div>

      <div class="action-hub-section">
        <div class="section-label">The Action Hub</div>
        <div class="action-hub-text">${page1.actionHubText}</div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">Schedule Your Free Turnover Analysis &nbsp;|&nbsp; cloverera.com</div>
      <div class="footer-right">Confidential</div>
    </div>

  </div>
</div>

<!-- ==================== PAGE 2: WHAT CHANGES ==================== -->
<div class="page">
  <div class="notebook-bg">${notebookLines}</div>
  <div class="page-content">

    <div class="header-bar">
      <div class="header-title">${page2.headerTitle}</div>
      <div class="header-logo">Clover ERA</div>
    </div>

    <div class="body-area" style="padding-top:14px;">

      <div class="ba-section">
        <div class="section-label">Before Clover ERA vs After Clover ERA</div>
        <table class="ba-table">
          <thead>
            <tr>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            ${baRows}
          </tbody>
        </table>
      </div>

      <div class="mgr-section">
        <div class="section-label">What Your Managers See</div>
        <div class="mgr-intro">${page2.managerReportIntro}</div>
        ${mgrQuestions}
        <div class="mgr-close">${page2.managerReportClose}</div>
      </div>

      ${investmentSection}

      <div class="p2-cta">
        <div class="cta-button">${page2.ctaText}</div>
        <div class="cta-url">${calendarLink}</div>
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
async function generatePDF(outputFilename, dynamicData) {
  const html = buildHTML(colors, dynamicData);
  const outputPath = path.resolve(__dirname, outputFilename);
  const previewPath = outputPath.replace('.pdf', '-p1-preview.png');
  const preview2Path = outputPath.replace('.pdf', '-p2-preview.png');

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

  // Page 1 screenshot
  await page.screenshot({
    path: previewPath,
    clip: { x: 0, y: 0, width: 816, height: 1056 },
  });

  // Page 2 screenshot: render just page 2
  const page2Browser = await browser.newPage();
  await page2Browser.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
  const page2Html = html
    .replace(
      /<!-- ==================== PAGE 1.*?<!-- ==================== PAGE 2/s,
      '<!-- ==================== PAGE 2'
    );
  await page2Browser.setContent(page2Html, { waitUntil: 'networkidle0' });
  await page2Browser.screenshot({
    path: preview2Path,
    clip: { x: 0, y: 0, width: 816, height: 1056 },
  });

  await browser.close();

  const stats = fs.statSync(outputPath);
  console.log(`PDF saved: ${outputPath} (${Math.round(stats.size / 1024)}KB)`);
  console.log(`Page 1 preview: ${previewPath}`);
  console.log(`Page 2 preview: ${preview2Path}`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--personalized' && args[1]) {
    // Accept JSON file with company data
    const jsonPath = path.resolve(args[1]);
    const record = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const tiers = selectTiers(record.estimated_num_employees || 200);
    const mid = tiers[1]; // middle tier as default recommendation
    const companySlug = record.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    await generatePDF(`clover-era-how-it-works-${companySlug}.pdf`, {
      company_name: record.company_name,
      tier_name: mid.name,
      people: mid.people,
      annual_cost: mid.annual_cost,
      cost_per_departure: record.cost_per_departure || 91582,
      calendar_link: record.calendar_link || 'https://cloverera.com/schedule',
    });
  } else if (args[0] === '--sample') {
    // Demo with Meridian Logistics
    await generatePDF('clover-era-how-it-works-sample.pdf', {
      company_name: 'Meridian Logistics',
      tier_name: '25 Teams',
      people: 500,
      annual_cost: 54000,
      cost_per_departure: 91582,
      calendar_link: 'https://cloverera.com/schedule',
    });
  } else {
    // Default: generate generic (no company name, static investment)
    console.log('=== Generating generic version ===');
    await generatePDF('clover-era-how-it-works.pdf', null);

    console.log('\n=== Generating sample (Meridian Logistics) ===');
    await generatePDF('clover-era-how-it-works-sample.pdf', {
      company_name: 'Meridian Logistics',
      tier_name: '25 Teams',
      people: 500,
      annual_cost: 54000,
      cost_per_departure: 91582,
      calendar_link: 'https://cloverera.com/schedule',
    });
  }
}

module.exports = { selectTiers, generatePDF, buildHTML, colors };

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
