// ============================================================
// CLOVER ERA ONE-PAGER DESIGN SYSTEM
// Shared across all document versions
// Colors matched to cloverera.com website branding
// ============================================================

const path = require('path');

// Default logo path
const DEFAULT_LOGO_PATH = path.resolve(__dirname, '..', 'images', 'Clover-era-new-logo-1.png');

const colors = {
  primary: '#46AEB8',       // Teal - main brand color (CTAs, buttons, accents)
  primaryDark: '#0D7C88',   // Deep teal - hover states, header bars
  coral: '#E07A5F',         // Coral accent
  charcoal: '#1F2937',      // Dark charcoal - headings, dark backgrounds
  textPrimary: '#111827',   // Main body text
  textSecondary: '#4B5563', // Secondary/descriptive text
  white: '#FFFFFF',
  warmWhite: '#FDFBF7',     // Secondary background
  lightGrey: '#F8F9FA',     // Section backgrounds
  cellBorder: '#E5E7EB',    // Borders and dividers
  tableBorder: '#E5E7EB',
  footerGrey: '#999999',
  lightTealTint: '#E8F4F5', // Light teal for alternating rows
};

const typography = {
  heading: "font-family:'Inter',Helvetica,Arial,sans-serif;font-weight:700;font-size:18pt;color:#FFFFFF;",
  subheading: "font-family:'Inter',Helvetica,Arial,sans-serif;font-weight:600;font-size:13pt;color:#0D7C88;",
  body: "font-family:'Inter',Helvetica,Arial,sans-serif;font-weight:400;font-size:10.5pt;color:#111827;line-height:1.55;",
  openingItalic: "font-family:'Inter',Helvetica,Arial,sans-serif;font-weight:400;font-style:italic;font-size:11pt;color:#4B5563;line-height:1.5;",
  tableText: "font-family:'Inter',Helvetica,Arial,sans-serif;font-weight:400;font-size:10pt;color:#111827;",
  tableHeader: "font-family:'Inter',Helvetica,Arial,sans-serif;font-weight:700;font-size:10pt;color:#FFFFFF;",
};

// ============================================================
// SHARED CONTENT COMPONENTS
// ============================================================

const cloverDimensions = [
  { letter: 'C', word: 'Communication', desc: 'Is information flowing both ways? Do people feel heard?' },
  { letter: 'L', word: 'Learning', desc: 'Are people growing? Do they feel like they\'re developing?' },
  { letter: 'O', word: 'Opportunity', desc: 'Can people see a future here? Is there somewhere to go?' },
  { letter: 'V', word: 'Vulnerability', desc: 'Can people be honest without risk? Is it safe to speak up?' },
  { letter: 'E', word: 'Enablement', desc: 'Do people have what they need to do their job? Are blockers being removed?' },
  { letter: 'R', word: 'Reflection', desc: 'Do people feel recognized? Is their contribution visible?' },
];

const belowGridLine = {
  standard: 'Each dimension maps to specific neurochemical drivers of retention documented in peer-reviewed research. When a dimension shifts, it shows up before the person has made a decision. Not after.',
  partner: 'Each dimension maps to specific neurochemical drivers of retention documented in peer-reviewed research. This is the methodology behind the platform your clients will use.',
};

// ============================================================
// HTML COMPONENT BUILDERS
// ============================================================

function notebookBackground() {
  // Plain white - no lines
  return '';
}

function headerBar(title) {
  return `<div class="header-bar"><div class="header-title">${title}</div></div>`;
}

function toDataURI(filePath) {
  const data = require('fs').readFileSync(filePath);
  const ext = filePath.split('.').pop().toLowerCase();
  const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${data.toString('base64')}`;
}

function logoArea(opts) {
  // opts: { cloverLogoPath, partnerLogoPath, partnerUrl }
  // Always show Clover ERA logo on page 1 by default
  const logoSrc = toDataURI((opts && opts.cloverLogoPath) || DEFAULT_LOGO_PATH);

  if (opts && opts.partnerLogoPath) {
    const partnerSrc = toDataURI(opts.partnerLogoPath);
    return `<div class="logo-area co-branded">
      <div class="logo-left">
        <img src="${partnerSrc}" class="logo-img" />
        <div class="powered-by">Powered by Clover ERA</div>
      </div>
      <div class="logo-right">
        <img src="${logoSrc}" class="logo-img" />
      </div>
    </div>`;
  }
  return `<div class="logo-area branded">
    <div class="logo-right-only">
      <img src="${logoSrc}" class="logo-img" />
    </div>
  </div>`;
}

function cloverGrid() {
  const rows = [];
  for (let i = 0; i < cloverDimensions.length; i += 2) {
    const left = cloverDimensions[i];
    const right = cloverDimensions[i + 1];
    rows.push(`<div class="clover-row">
      <div class="clover-cell">
        <div class="clover-letter">${left.letter}</div>
        <div class="clover-cell-body">
          <div class="clover-word">${left.word}</div>
          <div class="clover-desc">${left.desc}</div>
        </div>
      </div>
      <div class="clover-cell">
        <div class="clover-letter">${right.letter}</div>
        <div class="clover-cell-body">
          <div class="clover-word">${right.word}</div>
          <div class="clover-desc">${right.desc}</div>
        </div>
      </div>
    </div>`);
  }
  return `<div class="clover-grid">${rows.join('')}</div>`;
}

function rhythmSection(items) {
  const lines = items.map(it =>
    `<div class="rhythm-line"><span class="rhythm-label">${it.label}:</span> ${it.text}</div>`
  ).join('');
  return `<div class="section-block">
    <div class="subheading">The Rhythm</div>
    ${lines}
  </div>`;
}

function numberedLines(items) {
  return items.map((text, i) =>
    `<div class="numbered-line"><span class="num">${i + 1}.</span> ${text}</div>`
  ).join('');
}

function beforeAfterTable(rows) {
  const trs = rows.map((r, i) =>
    `<tr class="${i % 2 === 1 ? 'alt' : ''}"><td class="ba-before">${r.before}</td><td class="ba-after">${r.after}</td></tr>`
  ).join('');
  return `<table class="ba-table">
    <thead><tr><th>Before</th><th>After</th></tr></thead>
    <tbody>${trs}</tbody>
  </table>`;
}

function footer(partnerUrl) {
  const left = partnerUrl
    ? `${partnerUrl} &nbsp;|&nbsp; cloverera.com`
    : 'cloverera.com';
  return `<div class="footer"><div class="footer-left">${left}</div><div class="footer-right">Confidential</div></div>`;
}

// ============================================================
// GLOBAL CSS
// ============================================================
function globalCSS() {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 8.5in 11in; margin: 0; }

  body {
    font-family: 'Inter', Helvetica, Arial, sans-serif;
    color: ${colors.textPrimary};
    font-size: 10.5pt;
    line-height: 1.55;
    background: ${colors.white};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 8.5in;
    height: 11in;
    position: relative;
    overflow: hidden;
    background: ${colors.white};
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  .notebook-bg {
    display: none;
  }

  .page-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  /* Logo area */
  .logo-area {
    padding: 12px 72px 6px;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    min-height: 48px;
  }
  .logo-area.co-branded {
    justify-content: space-between;
  }
  .logo-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .logo-right, .logo-right-only {
    display: flex;
    align-items: flex-end;
  }
  .logo-img {
    height: 36px;
    width: auto;
  }
  .powered-by {
    font-size: 8pt;
    color: ${colors.textSecondary};
    margin-top: 2px;
  }

  /* Header bar */
  .header-bar {
    background: ${colors.charcoal};
    padding: 10px 72px;
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  .header-title {
    color: ${colors.white};
    font-size: 18pt;
    font-weight: 700;
    line-height: 1.3;
  }

  /* Body area */
  .body-area {
    padding: 0 72px;
    flex: 1;
  }

  /* Opening line */
  .opening-line {
    font-style: italic;
    font-size: 11pt;
    color: ${colors.textSecondary};
    line-height: 1.5;
    padding: 14px 0 12px;
  }

  /* Subheadings */
  .subheading {
    font-size: 13pt;
    font-weight: 600;
    color: ${colors.primaryDark};
    margin-bottom: 8px;
    margin-top: 14px;
  }
  .subheading:first-child { margin-top: 0; }
  .body-area > .subheading:first-child { margin-top: 14px; }

  /* CLOVER grid */
  .clover-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-bottom: 8px;
  }
  .clover-row {
    display: flex;
    gap: 0;
  }
  .clover-cell {
    flex: 1;
    display: flex;
    gap: 10px;
    padding: 10px;
    border: 0.5px solid ${colors.cellBorder};
    align-items: flex-start;
  }
  .clover-letter {
    font-size: 24pt;
    font-weight: 700;
    color: ${colors.primary};
    line-height: 1;
    min-width: 28px;
  }
  .clover-cell-body { flex: 1; }
  .clover-word {
    font-size: 11pt;
    font-weight: 700;
    color: ${colors.textPrimary};
    margin-bottom: 2px;
  }
  .clover-desc {
    font-size: 9.5pt;
    color: ${colors.textPrimary};
    line-height: 1.4;
  }

  .below-grid {
    font-size: 9.5pt;
    font-style: italic;
    color: ${colors.textSecondary};
    line-height: 1.45;
    margin-bottom: 12px;
  }

  /* Rhythm */
  .rhythm-line {
    font-size: 10.5pt;
    line-height: 1.55;
    margin-bottom: 4px;
  }
  .rhythm-label {
    font-weight: 700;
    color: ${colors.primaryDark};
  }

  /* Section block */
  .section-block {
    margin-bottom: 12px;
  }

  .section-text {
    font-size: 10.5pt;
    line-height: 1.55;
    color: ${colors.textPrimary};
  }

  /* Before / After table */
  .ba-table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 12px;
  }
  .ba-table thead th {
    background: ${colors.charcoal};
    color: ${colors.white};
    font-size: 10pt;
    font-weight: 700;
    padding: 8px;
    text-align: left;
  }
  .ba-table tbody td {
    padding: 7px 8px;
    font-size: 10pt;
    line-height: 1.4;
    border-bottom: 0.5px solid ${colors.tableBorder};
    vertical-align: top;
  }
  .ba-table tbody tr.alt td {
    background: ${colors.lightTealTint};
  }
  .ba-before { width: 50%; }
  .ba-after { width: 50%; }

  /* Numbered lines */
  .numbered-line {
    font-size: 10.5pt;
    line-height: 1.6;
    margin-bottom: 4px;
  }
  .numbered-line .num {
    font-weight: 700;
    color: ${colors.primary};
    display: inline-block;
    min-width: 18px;
  }

  .section-close {
    font-size: 9.5pt;
    color: ${colors.textSecondary};
    margin-top: 6px;
    line-height: 1.45;
  }

  /* Investment */
  .investment-block {
    margin-top: 12px;
  }
  .investment-block p {
    font-size: 10.5pt;
    line-height: 1.55;
    margin-bottom: 4px;
  }
  .investment-block strong {
    color: ${colors.primaryDark};
    font-weight: 700;
  }

  /* Generic tables */
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0 8px;
  }
  .data-table thead th {
    background: ${colors.charcoal};
    color: ${colors.white};
    font-size: 10pt;
    font-weight: 700;
    padding: 6px 8px;
    text-align: left;
  }
  .data-table thead th.num-col {
    text-align: right;
  }
  .data-table tbody td {
    padding: 6px 8px;
    font-size: 10pt;
    line-height: 1.4;
    border-bottom: 0.5px solid ${colors.tableBorder};
  }
  .data-table tbody tr.alt td {
    background: ${colors.lightTealTint};
  }
  .data-table td.num-col {
    text-align: right;
  }

  /* Partner blocks */
  .partner-block {
    background: ${colors.lightTealTint};
    padding: 14px 16px;
    margin-bottom: 10px;
    border-radius: 3px;
  }
  .partner-block-heading {
    font-size: 12pt;
    font-weight: 700;
    color: ${colors.textPrimary};
    margin-bottom: 6px;
  }
  .partner-block p {
    font-size: 10pt;
    line-height: 1.5;
    margin-bottom: 4px;
  }
  .commission-figure {
    font-size: 18pt;
    font-weight: 700;
    color: ${colors.primary};
  }

  /* Footer */
  .footer {
    border-top: 0.5px solid ${colors.tableBorder};
    padding: 8px 72px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }
  .footer-left {
    font-size: 8pt;
    color: ${colors.footerGrey};
  }
  .footer-right {
    font-size: 8pt;
    color: ${colors.footerGrey};
    font-style: italic;
  }

  /* Company name handwritten style */
  .company-name {
    font-family: 'Caveat', cursive;
    font-weight: 600;
  }
  `;
}

module.exports = {
  colors,
  typography,
  cloverDimensions,
  belowGridLine,
  notebookBackground,
  headerBar,
  logoArea,
  cloverGrid,
  rhythmSection,
  numberedLines,
  beforeAfterTable,
  footer,
  globalCSS,
  DEFAULT_LOGO_PATH,
};
