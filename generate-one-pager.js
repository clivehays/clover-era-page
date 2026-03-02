const puppeteer = require('puppeteer');
const path = require('path');

// ============================================================
// CONTENT OBJECT - Edit all text here without touching layout
// ============================================================
const content = {
  // Header
  brandName: 'CLOVER ERA',
  brandTagline: 'Manager Enablement Platform',

  // Subheader
  headline: 'Turnover costs 4x what you\'re tracking.',
  subheadline: 'We make the invisible number visible.',

  // Left column - The Problem
  problemHeading: 'YOUR TURNOVER NUMBER IS WRONG',
  problemBody: [
    'Most companies track turnover rate. A percentage. It feels manageable.',
    'The real number is turnover cost. Dollars walking out the door every time someone leaves.',
  ],
  keyStat: '$91,582',
  keyStatLabel: 'The average cost of a single departure.',
  problemDetails: [
    'That includes recruiting, ramp time, lost productivity, knowledge drain, and the ripple effect on the team left behind.',
    'Most companies underestimate this by 4x or more. They budget for the backfill. They miss the 6 months of output gap, the 3 people who quietly start looking after their colleague leaves, and the institutional knowledge that walks out with no backup.',
    'By the time someone resigns, the decision was made months ago.',
  ],
  problemClosing: 'The signals were there. The system just wasn\'t built to surface them.',

  // Right column - The Solution
  solutionHeading: 'WHAT CLOVER ERA MEASURES',
  solutionSubline: 'Six leading indicators that surface flight risk before resignation.',
  cloverIndicators: [
    { letter: 'C', word: 'Consistency', description: 'Changes in check-in tone, frequency, and depth' },
    { letter: 'L', word: 'Language', description: 'Shifts in how someone talks about their role, team, and future' },
    { letter: 'O', word: 'Outreach', description: 'Decline in voluntary collaboration and cross-team participation' },
    { letter: 'V', word: 'Visibility', description: 'Withdrawal from meetings, projects, and discretionary effort' },
    { letter: 'E', word: 'Equilibrium', description: 'Disruption in work-life patterns that signal disengagement' },
    { letter: 'R', word: 'Recognition', description: 'Response to feedback, praise, and development opportunities' },
  ],
  solutionClosing: 'Your managers see these signals every day. They just don\'t have a system to read them.',

  // Pricing section
  pricingHeading: 'ONE DEPARTURE PAYS FOR CLOVER ERA',
  pricingColumns: ['Company Size', 'Recommended Tier', 'Annual Investment', 'Break-Even'],
  pricingRows: [
    ['Up to 100 people', '5 Teams', '$12,500/year', '1 departure prevented'],
    ['Up to 200 people', '10 Teams', '$21,000/year', '1 departure prevented'],
    ['Up to 500 people', '25 Teams', '$45,000/year', '1 departure prevented'],
    ['500+ people', 'Custom', 'Call with Clive', '1 departure prevented'],
  ],
  pricingFootnote: 'Every tier includes daily check-ins, bi-weekly manager reports, and monthly team insights.',

  // CTA section
  ctaHeading: 'YOUR FREE TURNOVER ANALYSIS',
  ctaBody: 'A personalized report showing your company\'s real turnover cost, department-level vulnerability, and how many of your employees are likely in the 67-day window between deciding to leave and telling you.',
  ctaDisclaimer: 'No commitment. No pitch. Just the number your P&L is missing.',
  ctaButtonText: 'Schedule Your Free Turnover Analysis',
  ctaUrl: 'cloverera.com',

  // Footer
  footerText: 'Clive Hays, Co-Founder | Co-Author, "Already Gone: 78 Ways to Miss Someone Leaving" | cloverera.com',
};

// ============================================================
// DESIGN TOKENS
// ============================================================
const colors = {
  primaryDark: '#1B2D3F',
  accentCoral: '#E8634A',
  lightGrey: '#F5F5F5',
  bodyText: '#333333',
  white: '#FFFFFF',
  subtleGrey: '#777777',
  borderGrey: '#DDDDDD',
};

// ============================================================
// HTML TEMPLATE
// ============================================================
function buildHTML(c, col) {
  const indicatorRows = c.cloverIndicators.map(ind => `
    <div style="margin-bottom: 7px; line-height: 1.35;">
      <span style="color: ${col.accentCoral}; font-weight: 700; font-size: 13pt; display: inline;">${ind.letter}</span>
      <span style="color: ${col.accentCoral}; font-weight: 700; font-size: 10.5pt; margin-left: 2px;">${ind.word}:</span>
      <span style="font-size: 9pt; color: ${col.bodyText}; margin-left: 2px;">${ind.description}</span>
    </div>
  `).join('');

  const tableRows = c.pricingRows.map(row => `
    <tr>
      <td style="padding: 6px 10px; font-size: 8.5pt; border-bottom: 1px solid ${col.borderGrey};">${row[0]}</td>
      <td style="padding: 6px 10px; font-size: 8.5pt; border-bottom: 1px solid ${col.borderGrey};">${row[1]}</td>
      <td style="padding: 6px 10px; font-size: 8.5pt; border-bottom: 1px solid ${col.borderGrey}; font-weight: 600;">${row[2]}</td>
      <td style="padding: 6px 10px; font-size: 8.5pt; border-bottom: 1px solid ${col.borderGrey}; color: ${col.accentCoral}; font-weight: 600;">${row[3]}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: ${col.bodyText};
    width: 8.5in;
    height: 11in;
    padding: 0;
    overflow: hidden;
  }

  .page-container {
    width: 8.5in;
    height: 11in;
    display: flex;
    flex-direction: column;
  }

  .header-bar {
    background: ${col.primaryDark};
    padding: 12px 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-brand {
    color: ${col.white};
    font-size: 16pt;
    font-weight: 800;
    letter-spacing: 3px;
  }

  .header-tagline {
    color: ${col.subtleGrey};
    font-size: 8pt;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .subheader {
    text-align: center;
    padding: 14px 36px 12px;
    background: ${col.white};
  }

  .subheader h1 {
    font-size: 15pt;
    font-weight: 700;
    color: ${col.primaryDark};
    margin-bottom: 2px;
  }

  .subheader p {
    font-size: 10pt;
    color: ${col.subtleGrey};
    font-weight: 400;
  }

  .two-col {
    display: flex;
    gap: 24px;
    padding: 0 36px;
    flex: 0 0 auto;
  }

  .col {
    flex: 1;
  }

  .col-heading {
    font-size: 10pt;
    font-weight: 800;
    color: ${col.primaryDark};
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 2px solid ${col.accentCoral};
  }

  .col p {
    font-size: 9pt;
    line-height: 1.4;
    margin-bottom: 6px;
  }

  .key-stat {
    text-align: center;
    margin: 10px 0 4px;
  }

  .key-stat-number {
    font-size: 26pt;
    font-weight: 800;
    color: ${col.accentCoral};
  }

  .key-stat-label {
    font-size: 8.5pt;
    color: ${col.subtleGrey};
    margin-top: 0;
  }

  .italic-close {
    font-style: italic;
    color: ${col.primaryDark};
    font-weight: 500;
  }

  .solution-subline {
    font-size: 8.5pt;
    color: ${col.subtleGrey};
    margin-bottom: 10px;
  }

  .solution-closing {
    margin-top: 10px;
    font-size: 9pt;
    font-weight: 600;
    color: ${col.primaryDark};
    line-height: 1.35;
  }

  .pricing-section {
    background: ${col.lightGrey};
    padding: 12px 36px 10px;
    margin-top: 12px;
  }

  .pricing-heading {
    text-align: center;
    font-size: 10pt;
    font-weight: 800;
    color: ${col.primaryDark};
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead tr {
    background: ${col.primaryDark};
  }

  thead th {
    color: ${col.white};
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 7px 10px;
    text-align: left;
  }

  .pricing-footnote {
    text-align: center;
    font-size: 7.5pt;
    color: ${col.subtleGrey};
    margin-top: 6px;
  }

  .cta-section {
    background: ${col.white};
    padding: 12px 36px 10px;
    text-align: center;
  }

  .cta-heading {
    font-size: 10pt;
    font-weight: 800;
    color: ${col.primaryDark};
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .cta-body {
    font-size: 8.5pt;
    color: ${col.bodyText};
    line-height: 1.4;
    max-width: 580px;
    margin: 0 auto 4px;
  }

  .cta-disclaimer {
    font-size: 8pt;
    color: ${col.subtleGrey};
    font-style: italic;
    margin-bottom: 10px;
  }

  .cta-button {
    display: inline-block;
    background: ${col.accentCoral};
    color: ${col.white};
    font-size: 10pt;
    font-weight: 700;
    padding: 10px 32px;
    border-radius: 4px;
    letter-spacing: 0.5px;
    text-decoration: none;
  }

  .cta-url {
    font-size: 8pt;
    color: ${col.subtleGrey};
    margin-top: 5px;
  }

  .footer-bar {
    background: ${col.primaryDark};
    padding: 8px 36px;
    margin-top: auto;
  }

  .footer-text {
    color: rgba(255,255,255,0.7);
    font-size: 7pt;
    text-align: center;
    letter-spacing: 0.3px;
  }
</style>
</head>
<body>
<div class="page-container">

  <!-- HEADER -->
  <div class="header-bar">
    <div class="header-brand">${c.brandName}</div>
    <div class="header-tagline">${c.brandTagline}</div>
  </div>

  <!-- SUBHEADER -->
  <div class="subheader">
    <h1>${c.headline}</h1>
    <p>${c.subheadline}</p>
  </div>

  <!-- TWO COLUMNS -->
  <div class="two-col">

    <!-- LEFT: THE PROBLEM -->
    <div class="col">
      <div class="col-heading">${c.problemHeading}</div>
      ${c.problemBody.map(p => `<p>${p}</p>`).join('')}

      <div class="key-stat">
        <div class="key-stat-number">${c.keyStat}</div>
        <div class="key-stat-label">${c.keyStatLabel}</div>
      </div>

      ${c.problemDetails.map(p => `<p>${p}</p>`).join('')}

      <p class="italic-close">${c.problemClosing}</p>
    </div>

    <!-- RIGHT: THE SOLUTION -->
    <div class="col">
      <div class="col-heading">${c.solutionHeading}</div>
      <div class="solution-subline">${c.solutionSubline}</div>

      ${indicatorRows}

      <div class="solution-closing">${c.solutionClosing}</div>
    </div>
  </div>

  <!-- PRICING -->
  <div class="pricing-section">
    <div class="pricing-heading">${c.pricingHeading}</div>
    <table>
      <thead>
        <tr>
          ${c.pricingColumns.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <div class="pricing-footnote">${c.pricingFootnote}</div>
  </div>

  <!-- CTA -->
  <div class="cta-section">
    <div class="cta-heading">${c.ctaHeading}</div>
    <div class="cta-body">${c.ctaBody}</div>
    <div class="cta-disclaimer">${c.ctaDisclaimer}</div>
    <div class="cta-button">${c.ctaButtonText}</div>
    <div class="cta-url">${c.ctaUrl}</div>
  </div>

  <!-- FOOTER -->
  <div class="footer-bar">
    <div class="footer-text">${c.footerText}</div>
  </div>

</div>
</body>
</html>`;
}

// ============================================================
// PDF GENERATION
// ============================================================
async function generatePDF() {
  const html = buildHTML(content, colors);
  const outputPath = path.resolve(__dirname, 'clover-era-one-pager.pdf');
  const previewPath = path.resolve(__dirname, 'clover-era-one-pager-preview.png');

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set viewport to US Letter at 96 DPI
  await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });

  await page.setContent(html, { waitUntil: 'networkidle0' });

  console.log('Generating PDF...');
  await page.pdf({
    path: outputPath,
    width: '8.5in',
    height: '11in',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  console.log('Generating preview image...');
  await page.screenshot({
    path: previewPath,
    clip: { x: 0, y: 0, width: 816, height: 1056 },
  });

  await browser.close();
  console.log(`PDF saved to: ${outputPath}`);
  console.log(`Preview saved to: ${previewPath}`);
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
