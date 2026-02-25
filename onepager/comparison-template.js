// ============================================================
// CLOVER ERA "PROOF AT A GLANCE" COMPARISON TEMPLATE
// Single page: case studies compared side by side
// Supports 2+ columns, portrait or landscape orientation
// ============================================================

const ds = require('./design-system');

function buildComparisonHTML(data, logoOpts) {
  const col = ds.colors;
  const logoHtml = ds.logoArea(logoOpts || {});
  const footerHtml = ds.footer(null);

  const studies = data.studies;
  const rows = data.comparison_rows;
  const isLandscape = data.landscape || false;

  // Dynamic table headers
  const headerCells = studies.map(s => `<th>${s.name}</th>`).join('');

  // Dynamic table rows
  const tableRows = rows.map((r, i) => {
    const valueCells = r.values.map(v => `<td class="comp-value">${v}</td>`).join('');
    return `<tr class="${i % 2 === 1 ? 'alt' : ''}">
      <td class="comp-label">${r.label}</td>
      ${valueCells}
    </tr>`;
  }).join('');

  const highlightsHtml = data.highlights ? `
    <div class="subheading" style="margin-top: 16px;">${data.highlights_heading || 'The Pattern'}</div>
    <div class="comp-highlight">
      ${data.highlights.map(h => `
        <div class="comp-highlight-card">
          <div class="comp-highlight-label">${h.label}</div>
          <div class="comp-highlight-value">${h.value}</div>
          <div class="comp-highlight-context">${h.context}</div>
        </div>
      `).join('')}
    </div>` : '';

  // Objections section (optional)
  const objectionsHtml = data.objections ? `
    <div class="subheading" style="margin-top: 16px;">${data.objections_heading || 'Each Case Study Answers a Different Objection'}</div>
    <div class="objections-row">
      ${data.objections.map(o => `
        <div class="objection-card">
          <div class="objection-label">${o.study}</div>
          <div class="objection-text">${o.objection}</div>
        </div>
      `).join('')}
    </div>` : '';

  // Page dimensions based on orientation
  const pageWidth = isLandscape ? '11in' : '8.5in';
  const pageHeight = isLandscape ? '8.5in' : '11in';
  const viewportW = isLandscape ? 1056 : 816;
  const viewportH = isLandscape ? 816 : 1056;
  const labelWidth = studies.length >= 3 ? '18%' : '28%';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
${ds.globalCSS()}

  @page {
    size: ${pageWidth} ${pageHeight};
    margin: 0;
  }

  .page {
    width: ${pageWidth};
    height: ${pageHeight};
  }

  .comp-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
  }
  .comp-table thead th {
    background: ${col.charcoal};
    color: ${col.white};
    font-size: ${studies.length >= 3 ? '9pt' : '10pt'};
    font-weight: 700;
    padding: 9px 10px;
    text-align: left;
  }
  .comp-table thead th:first-child {
    width: ${labelWidth};
  }
  .comp-table tbody td {
    padding: 8px 10px;
    font-size: ${studies.length >= 3 ? '9pt' : '10pt'};
    line-height: 1.4;
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
    margin: 12px 0 6px;
  }

  .comp-footer-note {
    font-size: 8.5pt;
    font-style: italic;
    color: ${col.textSecondary};
    margin-top: 12px;
    line-height: 1.5;
  }

  .comp-highlight {
    display: flex;
    gap: 14px;
    margin-top: 8px;
  }
  .comp-highlight-card {
    flex: 1;
    background: ${col.lightGrey};
    border-radius: 6px;
    padding: 12px 14px;
    border-top: 3px solid ${col.primary};
    text-align: center;
  }
  .comp-highlight-label {
    font-size: 8pt;
    font-weight: 600;
    color: ${col.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 4px;
  }
  .comp-highlight-value {
    font-size: 16pt;
    font-weight: 700;
    color: ${col.primary};
    line-height: 1.2;
  }
  .comp-highlight-context {
    font-size: 8pt;
    color: ${col.textSecondary};
    margin-top: 3px;
  }

  .objections-row {
    display: flex;
    gap: 14px;
    margin-top: 8px;
  }
  .objection-card {
    flex: 1;
    background: ${col.lightGrey};
    border-radius: 6px;
    padding: 10px 12px;
    border-left: 3px solid ${col.primary};
  }
  .objection-label {
    font-size: 8pt;
    font-weight: 700;
    color: ${col.primaryDark};
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin-bottom: 4px;
  }
  .objection-text {
    font-size: 9pt;
    color: ${col.textPrimary};
    line-height: 1.4;
    font-style: italic;
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
            ${headerCells}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      ${highlightsHtml}

      ${objectionsHtml}

      <div class="comp-footer-note">${data.footer_note}</div>

    </div>
    ${footerHtml}
  </div>
</div>

</body>
</html>`;
}

module.exports = { buildComparisonHTML };
