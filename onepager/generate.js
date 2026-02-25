const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const ds = require('./design-system');

// Version content modules
const versions = {
  ceo: require('./version-ceo'),
  people: require('./version-people'),
  manager: require('./version-manager'),
  partner: require('./version-partner'),
};

// ============================================================
// TIER SELECTION
// ============================================================
function selectRecommendedTier(employeeCount) {
  if (employeeCount <= 100) {
    return { name: '5 Teams', teams: 5, people: 100, monthly_cost: 1250, annual_cost: 15000 };
  } else if (employeeCount <= 250) {
    return { name: '10 Teams', teams: 10, people: 200, monthly_cost: 2100, annual_cost: 25200 };
  } else if (employeeCount <= 500) {
    return { name: '25 Teams', teams: 25, people: 500, monthly_cost: 4500, annual_cost: 54000 };
  } else {
    return { name: 'Enterprise', teams: 'Unlimited', people: 'Unlimited', monthly_cost: 8000, annual_cost: 96000 };
  }
}

function fmt(value) {
  if (typeof value === 'string') return value;
  return '$' + Math.round(value).toLocaleString('en-US');
}

function fmtPeople(value) {
  if (typeof value === 'string') return value;
  return value.toLocaleString('en-US');
}

// ============================================================
// INVESTMENT SECTION BUILDER
// ============================================================
function buildInvestment(template, data) {
  // data: { company_name, tier_name, people, annual_cost, cost_per_departure }
  const cpd = fmt(data.cost_per_departure || 91582);

  if (template === 'manager') {
    return `<div class="investment-block">
      <div class="subheading">Investment</div>
      <p>Single Team: <strong>$295 per month</strong>. Covers up to 20 people.</p>
      <p>Breaks even if it prevents one person from leaving. One.</p>
    </div>`;
  }

  const tierLine = data.tier_name && data.people && data.annual_cost
    ? `<p><strong>${data.tier_name}</strong> covers up to ${typeof data.people === 'number' ? fmtPeople(data.people) : data.people} people at <strong>${typeof data.annual_cost === 'number' ? fmt(data.annual_cost) : data.annual_cost}</strong> per year.</p>`
    : '';

  let costLine;
  if (template === 'ceo' && data.company_name) {
    costLine = `<p>One prevented departure at <span class="company-name">${data.company_name}</span> saves approximately <strong>${cpd}</strong>.</p>`;
  } else {
    costLine = `<p>One prevented departure saves approximately <strong>${cpd}</strong>.</p>`;
  }

  const breakEven = '<p>The investment breaks even at one.</p>';
  const peopleSuffix = template === 'people'
    ? '<p>Positioned as operational infrastructure. Funded from operational budget.</p>'
    : '';

  return `<div class="investment-block">
    <div class="subheading">Investment</div>
    ${tierLine}
    ${costLine}
    ${breakEven}
    ${peopleSuffix}
  </div>`;
}

// ============================================================
// PARTNER PAGE 2 BUILDER
// ============================================================
function buildPartnerPage2(v, col) {
  const pt = v.page2.pricingTable;
  const pm = v.page2.partnershipModel;
  const ct = v.page2.commissionTable;

  // Pricing table
  const pHeaders = pt.columns.map((c, i) =>
    `<th${pt.numCols.includes(i) ? ' class="num-col"' : ''}>${c}</th>`
  ).join('');
  const pRows = pt.rows.map((row, ri) => {
    const tds = row.map((cell, ci) =>
      `<td${pt.numCols.includes(ci) ? ' class="num-col"' : ''}>${cell}</td>`
    ).join('');
    return `<tr class="${ri % 2 === 1 ? 'alt' : ''}">${tds}</tr>`;
  }).join('');

  // Commission table
  const cHeaders = ct.columns.map((c, i) =>
    `<th${ct.numCols.includes(i) ? ' class="num-col"' : ''}>${c}</th>`
  ).join('');
  const cRows = ct.rows.map((row, ri) => {
    const tds = row.map((cell, ci) =>
      `<td${ct.numCols.includes(ci) ? ' class="num-col"' : ''}>${cell}</td>`
    ).join('');
    return `<tr class="${ri % 2 === 1 ? 'alt' : ''}">${tds}</tr>`;
  }).join('');

  return `
    <div class="subheading" style="margin-top:14px;">${pt.subheading}</div>
    <table class="data-table">
      <thead><tr>${pHeaders}</tr></thead>
      <tbody>${pRows}</tbody>
    </table>
    <p class="section-text" style="margin-bottom:14px;">${pt.belowTable}</p>

    <div class="subheading">${pm.subheading}</div>

    <div class="partner-block">
      <div class="partner-block-heading">${pm.referral.heading}</div>
      ${pm.referral.lines.map((l, i) => {
        if (i === 1) return `<p><span class="commission-figure">${pm.referral.commission}</span> commission for the life of the customer.</p>`;
        return `<p>${l}</p>`;
      }).join('')}
    </div>

    <div class="partner-block">
      <div class="partner-block-heading">${pm.managed.heading}</div>
      ${pm.managed.lines.map((l, i) => {
        if (i === 1) return `<p><span class="commission-figure">${pm.managed.commission}</span> commission for the life of the customer.</p>`;
        return `<p>${l}</p>`;
      }).join('')}
    </div>

    <div class="subheading">${ct.subheading}</div>
    <table class="data-table">
      <thead><tr>${cHeaders}</tr></thead>
      <tbody>${cRows}</tbody>
    </table>
  `;
}

// ============================================================
// STANDARD PAGE 2 BUILDER (CEO, People, Manager)
// ============================================================
function buildStandardPage2(v, data) {
  const p2 = v.page2;
  const rs = p2.reportSection;

  const baTable = ds.beforeAfterTable(p2.beforeAfter);
  const questions = ds.numberedLines(rs.questions);
  const closingLine = rs.closingLine
    ? `<div class="section-close">${rs.closingLine}</div>`
    : '';
  const investment = buildInvestment(p2.investmentTemplate, data);

  return `
    <div class="subheading" style="margin-top:14px;">Before Clover ERA vs After Clover ERA</div>
    ${baTable}

    <div class="subheading">${rs.subheading}</div>
    <div class="section-text">${rs.intro}</div>
    ${questions}
    ${closingLine}

    ${investment}
  `;
}

// ============================================================
// FULL HTML ASSEMBLY
// ============================================================
function buildHTML(versionId, data, logoOpts) {
  const v = versions[versionId];
  if (!v) throw new Error(`Unknown version: ${versionId}`);

  const p1 = v.page1;
  const isPartner = versionId === 'partner';
  const footerHtml = ds.footer(data.partner_url || null);
  // Always show logo - use provided opts or default Clover ERA logo
  const logoHtml = ds.logoArea(logoOpts || {});

  // Page 1 body
  let page1Body = '';

  // Pre-grid section (partner only)
  if (p1.preGridSection) {
    page1Body += `<div class="subheading">${p1.preGridSection.subheading}</div>
      <div class="section-text" style="margin-bottom:12px;">${p1.preGridSection.text}</div>`;
  }

  // CLOVER grid
  page1Body += ds.cloverGrid();
  page1Body += `<div class="below-grid">${ds.belowGridLine[p1.belowGridVariant]}</div>`;

  // Rhythm
  page1Body += ds.rhythmSection(p1.rhythm);

  // Action hub or positioning (partner)
  if (p1.actionHub) {
    page1Body += `<div class="section-block">
      <div class="subheading">${p1.actionHub.subheading}</div>
      <div class="section-text">${p1.actionHub.text}</div>
    </div>`;
  }
  if (p1.positioningSection) {
    page1Body += `<div class="section-block">
      <div class="subheading">${p1.positioningSection.subheading}</div>
      <div class="section-text">${p1.positioningSection.text}</div>
    </div>`;
  }

  // Page 2 body
  let page2Body;
  if (isPartner) {
    page2Body = buildPartnerPage2(v, ds.colors);
  } else {
    page2Body = buildStandardPage2(v, data);
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${ds.globalCSS()}</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="page-content">
    ${logoHtml}
    ${ds.headerBar(p1.headerTitle)}
    <div class="body-area">
      <div class="opening-line">${p1.openingLine}</div>
      ${page1Body}
    </div>
    ${footerHtml}
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="page-content">
    ${ds.headerBar(v.page2.headerTitle)}
    <div class="body-area">
      ${page2Body}
    </div>
    ${footerHtml}
  </div>
</div>

</body>
</html>`;
}

// ============================================================
// CASE STUDY SUPPORT
// ============================================================
const { buildCaseStudyHTML } = require('./case-study-template');
const { buildComparisonHTML } = require('./comparison-template');

async function generateCaseStudyPDF(caseData, outputFilename, logoOpts) {
  const html = buildCaseStudyHTML(caseData, logoOpts);
  const outputDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, outputFilename);
  const p1Preview = outputPath.replace('.pdf', '-p1.png');
  const p2Preview = outputPath.replace('.pdf', '-p2.png');

  console.log(`  Generating ${outputFilename}...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    width: '8.5in',
    height: '11in',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await page.screenshot({ path: p1Preview, clip: { x: 0, y: 0, width: 816, height: 1056 } });

  const p2Page = await browser.newPage();
  await p2Page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
  const p2Html = html.replace(/<!-- PAGE 1 -->[\s\S]*?<!-- PAGE 2 -->/, '<!-- PAGE 2 -->');
  await p2Page.setContent(p2Html, { waitUntil: 'networkidle0' });
  await p2Page.screenshot({ path: p2Preview, clip: { x: 0, y: 0, width: 816, height: 1056 } });

  await browser.close();

  const stats = fs.statSync(outputPath);
  console.log(`  Saved: ${outputPath} (${Math.round(stats.size / 1024)}KB)`);
  return { outputPath, p1Preview, p2Preview };
}

// ============================================================
// COMPARISON PDF GENERATION (single page)
// ============================================================
async function generateComparisonPDF(comparisonData, outputFilename, logoOpts) {
  const html = buildComparisonHTML(comparisonData, logoOpts);
  const outputDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, outputFilename);
  const preview = outputPath.replace('.pdf', '-preview.png');

  const isLandscape = comparisonData.landscape || false;
  const vpW = isLandscape ? 1056 : 816;
  const vpH = isLandscape ? 816 : 1056;
  const pdfW = isLandscape ? '11in' : '8.5in';
  const pdfH = isLandscape ? '8.5in' : '11in';

  console.log(`  Generating ${outputFilename}${isLandscape ? ' (landscape)' : ''}...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: vpW, height: vpH, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    width: pdfW,
    height: pdfH,
    printBackground: true,
    landscape: isLandscape,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await page.screenshot({ path: preview, clip: { x: 0, y: 0, width: vpW, height: vpH } });
  await browser.close();

  const stats = fs.statSync(outputPath);
  console.log(`  Saved: ${outputPath} (${Math.round(stats.size / 1024)}KB)`);
  return { outputPath, preview };
}

// ============================================================
// PDF GENERATION
// ============================================================
async function generatePDF(versionId, outputFilename, data, logoOpts) {
  const html = buildHTML(versionId, data || {}, logoOpts);
  const outputDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, outputFilename);
  const p1Preview = outputPath.replace('.pdf', '-p1.png');
  const p2Preview = outputPath.replace('.pdf', '-p2.png');

  console.log(`  Generating ${outputFilename}...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    width: '8.5in',
    height: '11in',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  // Page 1 screenshot
  await page.screenshot({ path: p1Preview, clip: { x: 0, y: 0, width: 816, height: 1056 } });

  // Page 2 screenshot
  const p2Page = await browser.newPage();
  await p2Page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 });
  const p2Html = html.replace(
    /<!-- PAGE 1 -->[\s\S]*?<!-- PAGE 2 -->/,
    '<!-- PAGE 2 -->'
  );
  await p2Page.setContent(p2Html, { waitUntil: 'networkidle0' });
  await p2Page.screenshot({ path: p2Preview, clip: { x: 0, y: 0, width: 816, height: 1056 } });

  await browser.close();

  const stats = fs.statSync(outputPath);
  console.log(`  Saved: ${outputPath} (${Math.round(stats.size / 1024)}KB)`);
  return { outputPath, p1Preview, p2Preview };
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  const args = process.argv.slice(2);
  const requestedVersion = args[0];

  // Sample personalized data
  const sampleData = {
    company_name: 'Meridian Logistics',
    tier_name: '25 Teams',
    people: 500,
    annual_cost: 54000,
    cost_per_departure: 91582,
    calendar_link: 'https://cloverera.com/schedule',
  };

  // Generic data (no company name)
  const genericData = {
    cost_per_departure: 91582,
  };

  if (requestedVersion && versions[requestedVersion]) {
    // Generate single version, both generic and sample
    console.log(`\n=== ${requestedVersion.toUpperCase()} version ===`);
    await generatePDF(requestedVersion, `clover-era-${requestedVersion}.pdf`, genericData);
    if (requestedVersion !== 'partner') {
      await generatePDF(requestedVersion, `clover-era-${requestedVersion}-sample.pdf`, sampleData);
    }
  } else if (args[0] === '--json' && args[1] && args[2]) {
    // node generate.js --json ceo company.json
    const vId = args[1];
    const jsonPath = path.resolve(args[2]);
    const record = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const tier = selectRecommendedTier(record.estimated_num_employees || 200);
    const data = {
      company_name: record.company_name,
      tier_name: tier.name,
      people: tier.people,
      annual_cost: tier.annual_cost,
      cost_per_departure: record.cost_per_departure || 91582,
      calendar_link: record.calendar_link || 'https://cloverera.com/schedule',
    };
    const slug = data.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await generatePDF(vId, `clover-era-${vId}-${slug}.pdf`, data);
  } else if (args[0] === '--case-study' && args[1]) {
    // node generate.js --case-study uk-school
    const caseFile = path.resolve(__dirname, `case-study-${args[1]}.js`);
    const caseData = require(caseFile);
    console.log(`\n=== CASE STUDY: ${caseData.org_description} ===`);
    await generateCaseStudyPDF(caseData, `clover-era-case-study-${caseData.case_id}.pdf`);
  } else if (args[0] === '--comparison') {
    // node generate.js --comparison
    const comparisonFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('comparison-data') && f.endsWith('.js'));
    for (const cFile of comparisonFiles) {
      const compData = require(path.resolve(__dirname, cFile));
      console.log(`\n=== COMPARISON: ${compData.title} ===`);
      await generateComparisonPDF(compData, `clover-era-comparison-${compData.comparison_id}.pdf`);
    }
  } else {
    // Generate all versions + all case studies
    for (const vId of Object.keys(versions)) {
      console.log(`\n=== ${vId.toUpperCase()} ===`);
      await generatePDF(vId, `clover-era-${vId}.pdf`, genericData);
      if (vId !== 'partner') {
        await generatePDF(vId, `clover-era-${vId}-sample.pdf`, sampleData);
      }
    }

    // Generate all case studies
    const caseStudyFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('case-study-') && f !== 'case-study-template.js');
    for (const csFile of caseStudyFiles) {
      const caseData = require(path.resolve(__dirname, csFile));
      console.log(`\n=== CASE STUDY: ${caseData.org_description} ===`);
      await generateCaseStudyPDF(caseData, `clover-era-case-study-${caseData.case_id}.pdf`);
    }

    // Generate all comparison documents
    const comparisonFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('comparison-data') && f.endsWith('.js'));
    for (const cFile of comparisonFiles) {
      const compData = require(path.resolve(__dirname, cFile));
      console.log(`\n=== COMPARISON: ${compData.title} ===`);
      await generateComparisonPDF(compData, `clover-era-comparison-${compData.comparison_id}.pdf`);
    }
  }

  console.log('\nDone.');
}

module.exports = { buildHTML, generatePDF, generateCaseStudyPDF, generateComparisonPDF, selectRecommendedTier, versions };

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
