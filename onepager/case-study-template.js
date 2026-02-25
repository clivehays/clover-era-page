// ============================================================
// CLOVER ERA CASE STUDY TEMPLATE
// Reusable: populate with different content per case study
// ============================================================

const ds = require('./design-system');

// ============================================================
// CASE STUDY DATA STRUCTURE
// ============================================================
// {
//   case_id: 'uk-private-school',
//   org_description: 'Large UK Private School, 300 Staff',
//   assumption_heading: 'The Assumption',
//   assumption_text: '...',
//   surfaced_heading: 'What CLOVER Surfaced',
//   surfaced_text: '...',
//   leader_quote: '...',
//   leader_attribution: 'Head Teacher',
//   intervention_heading: 'What Changed',
//   intervention_text: '...',
//   headline_result: 'The intervention cost nothing. The insight that triggered it came from Clover ERA.',
//   metrics: [
//     { label: 'Overall CLOVER Score', before: '45%', after: '66%', context: 'in 3 months' },
//     ...
//   ],
//   metrics_footnote: 'Both dimensions have continued to improve in subsequent months.',
//   user_quote: '...',
//   user_attribution: 'Staff Member',
//   proves_heading: 'What This Proves',
//   proves_points: [ '...', '...', '...' ],
// }

function buildCaseStudyHTML(data, logoOpts) {
  const col = ds.colors;
  const logoHtml = ds.logoArea(logoOpts || {});
  const footerHtml = ds.footer(data.partner_url || null);

  // Leader quote block
  const leaderQuoteBlock = data.leader_quote
    ? `<div class="quote-block">
        <div class="quote-text">${data.leader_quote}</div>
        <div class="quote-attribution">${data.leader_attribution}</div>
      </div>`
    : '';

  // User quote block
  const userQuoteBlock = data.user_quote
    ? `<div class="quote-block">
        <div class="quote-text">${data.user_quote}</div>
        <div class="quote-attribution">${data.user_attribution}</div>
      </div>`
    : '';

  // Group metrics by row (default to 1 for backward compatibility)
  const metricsByRow = {};
  data.metrics.forEach(m => {
    const row = m.row || 1;
    if (!metricsByRow[row]) metricsByRow[row] = [];
    metricsByRow[row].push(m);
  });

  const metricsHtml = Object.keys(metricsByRow)
    .sort((a, b) => Number(a) - Number(b))
    .map(rowKey => {
      const rowMetrics = metricsByRow[rowKey];
      const rowLabel = rowMetrics[0].row_label;
      const labelHtml = rowLabel
        ? `<div class="metrics-row-label">${rowLabel}</div>`
        : '';
      const cardsHtml = rowMetrics.map(m => {
        const numbersContent = m.before
          ? `<span class="metric-before">${m.before}</span>
             <span class="metric-arrow">&rarr;</span>
             <span class="metric-after">${m.after}</span>`
          : `<span class="metric-after metric-single">${m.after}</span>`;
        return `<div class="metric-card">
          <div class="metric-label">${m.label}</div>
          <div class="metric-numbers">${numbersContent}</div>
          <div class="metric-context">${m.context}</div>
        </div>`;
      }).join('');
      return `${labelHtml}<div class="metrics-row">${cardsHtml}</div>`;
    }).join('');

  // Proves points
  const provesHtml = data.proves_points.map((p, i) => `
    <div class="proves-line"><span class="proves-num">${i + 1}.</span> ${p}</div>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
${ds.globalCSS()}

  /* Case study specific styles */
  .quote-block {
    border-left: 4px solid ${col.primary};
    padding: 10px 16px;
    margin: 12px 0;
    background: ${col.lightGrey};
    border-radius: 0 4px 4px 0;
  }
  .quote-text {
    font-style: italic;
    font-size: 10.5pt;
    line-height: 1.55;
    color: ${col.textPrimary};
  }
  .quote-attribution {
    font-size: 9pt;
    color: ${col.textSecondary};
    margin-top: 6px;
    font-weight: 600;
  }

  .metrics-row {
    display: flex;
    gap: 16px;
    margin: 14px 0;
  }
  .metric-card {
    flex: 1;
    background: ${col.lightGrey};
    border-radius: 6px;
    padding: 14px 12px;
    text-align: center;
    border-top: 3px solid ${col.primary};
  }
  .metric-label {
    font-size: 9pt;
    font-weight: 600;
    color: ${col.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }
  .metric-numbers {
    font-size: 20pt;
    font-weight: 700;
    color: ${col.primaryDark};
    line-height: 1.2;
  }
  .metric-before {
    opacity: 0.5;
  }
  .metric-arrow {
    font-size: 16pt;
    margin: 0 4px;
    opacity: 0.4;
  }
  .metric-after {
    color: ${col.primary};
  }
  .metric-after.metric-single {
    font-size: 22pt;
  }
  .metric-context {
    font-size: 9pt;
    color: ${col.textSecondary};
    margin-top: 4px;
  }

  .metrics-footnote {
    font-size: 9.5pt;
    font-style: italic;
    color: ${col.textSecondary};
    margin-bottom: 12px;
  }

  .headline-result {
    font-size: 11.5pt;
    font-weight: 700;
    color: ${col.textPrimary};
    margin: 12px 0;
    line-height: 1.5;
  }

  .proves-line {
    font-size: 10.5pt;
    line-height: 1.6;
    margin-bottom: 6px;
  }
  .proves-num {
    font-weight: 700;
    color: ${col.primary};
    display: inline-block;
    min-width: 20px;
  }

  .metrics-row-label {
    font-size: 9pt;
    font-weight: 600;
    color: ${col.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-top: 8px;
    margin-bottom: 4px;
  }

  .user-quote-heading {
    font-size: 13pt;
    font-weight: 600;
    color: ${col.primaryDark};
    margin-bottom: 8px;
    margin-top: 14px;
  }
</style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="page-content">
    ${logoHtml}
    ${ds.headerBar('Case Study: ' + data.org_description)}
    <div class="body-area">

      <div class="subheading" style="margin-top:16px;">${data.assumption_heading || 'The Assumption'}</div>
      <div class="section-text">${data.assumption_text}</div>

      <div class="subheading">${data.surfaced_heading || 'What CLOVER Surfaced'}</div>
      <div class="section-text">${data.surfaced_text}</div>

      ${leaderQuoteBlock}

    </div>
    ${footerHtml}
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="page-content">
    ${ds.headerBar(data.page2_header || 'The Intervention and Results')}
    <div class="body-area">

      <div class="subheading" style="margin-top:14px;">${data.intervention_heading || 'What Changed'}</div>
      <div class="section-text">${data.intervention_text}</div>

      <div class="headline-result">${data.headline_result}</div>

      <div class="subheading">The Numbers</div>
      ${metricsHtml}
      ${data.metrics_footnote ? `<div class="metrics-footnote">${data.metrics_footnote}</div>` : ''}

      ${data.user_quote ? `<div class="user-quote-heading">What Their People Said</div>` : ''}
      ${userQuoteBlock}

      <div class="subheading">${data.proves_heading || 'What This Proves'}</div>
      ${provesHtml}

    </div>
    ${footerHtml}
  </div>
</div>

</body>
</html>`;
}

module.exports = { buildCaseStudyHTML };
