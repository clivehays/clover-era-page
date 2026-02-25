// ============================================================
// CLOVER ERA "PROOF AT A GLANCE" COMPARISON TEMPLATE
// Single page: two case studies compared side by side
// ============================================================

const ds = require('./design-system');

function buildComparisonHTML(data, logoOpts) {
  const col = ds.colors;
  const logoHtml = ds.logoArea(logoOpts || {});
  const footerHtml = ds.footer(null);

  const studies = data.studies;
  const rows = data.comparison_rows;

  const tableRows = rows.map((r, i) => `
    <tr class="${i % 2 === 1 ? 'alt' : ''}">
      <td class="comp-label">${r.label}</td>
      <td class="comp-value">${r.values[0]}</td>
      <td class="comp-value">${r.values[1]}</td>
    </tr>
  `).join('');

  const highlightsHtml = data.highlights ? `
    <div class="subheading" style="margin-top: 18px;">${data.highlights_heading || 'The Pattern'}</div>
    <div class="comp-highlight">
      ${data.highlights.map(h => `
        <div class="comp-highlight-card">
          <div class="comp-highlight-label">${h.label}</div>
          <div class="comp-highlight-value">${h.value}</div>
          <div class="comp-highlight-context">${h.context}</div>
        </div>
      `).join('')}
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
${ds.globalCSS()}

  .comp-table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
  }
  .comp-table thead th {
    background: ${col.charcoal};
    color: ${col.white};
    font-size: 10pt;
    font-weight: 700;
    padding: 10px 12px;
    text-align: left;
  }
  .comp-table thead th:first-child {
    width: 28%;
  }
  .comp-table tbody td {
    padding: 9px 12px;
    font-size: 10pt;
    line-height: 1.45;
    border-bottom: 0.5px solid ${col.tableBorder};
    vertical-align: top;
  }
  .comp-table tbody tr.alt td {
    background: ${col.lightTealTint};
  }
  .comp-label {
    font-weight: 600;
    color: ${col.textPrimary};
  }
  .comp-value {
    color: ${col.textPrimary};
  }

  .comp-intro {
    font-size: 10.5pt;
    line-height: 1.55;
    color: ${col.textPrimary};
    margin: 14px 0 8px;
  }

  .comp-footer-note {
    font-size: 9.5pt;
    font-style: italic;
    color: ${col.textSecondary};
    margin-top: 14px;
    line-height: 1.5;
  }

  .comp-highlight {
    display: flex;
    gap: 16px;
    margin-top: 10px;
  }
  .comp-highlight-card {
    flex: 1;
    background: ${col.lightGrey};
    border-radius: 6px;
    padding: 14px 16px;
    border-top: 3px solid ${col.primary};
    text-align: center;
  }
  .comp-highlight-label {
    font-size: 9pt;
    font-weight: 600;
    color: ${col.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 6px;
  }
  .comp-highlight-value {
    font-size: 18pt;
    font-weight: 700;
    color: ${col.primary};
    line-height: 1.2;
  }
  .comp-highlight-context {
    font-size: 9pt;
    color: ${col.textSecondary};
    margin-top: 4px;
  }
</style>
</head>
<body>

<div class="page">
  <div class="page-content">
    ${logoHtml}
    ${ds.headerBar(data.title || 'Proof at a Glance')}
    <div class="body-area">

      <div class="comp-intro">${data.intro_text}</div>

      <table class="comp-table">
        <thead>
          <tr>
            <th></th>
            <th>${studies[0].name}</th>
            <th>${studies[1].name}</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      ${highlightsHtml}

      <div class="comp-footer-note">${data.footer_note}</div>

    </div>
    ${footerHtml}
  </div>
</div>

</body>
</html>`;
}

module.exports = { buildComparisonHTML };
