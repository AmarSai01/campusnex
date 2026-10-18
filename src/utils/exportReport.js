// CSV download and printable (Save as PDF) reports.

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function downloadCsv(filename, headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','));
  // BOM so Excel opens UTF-8 names correctly.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// sections: [{ heading, headers, rows }]. Opens the browser print dialog, where "Save as PDF" is available.
export function printReport({ title, subtitle, sections }) {
  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) {
    throw new Error('Allow pop-ups for this site to print or save the report as PDF.');
  }

  const tables = sections
    .map(
      ({ heading, headers, rows }) => `
      <h2>${escapeHtml(heading)}</h2>
      ${
        rows.length
          ? `<table>
              <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
              <tbody>${rows
                .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
                .join('')}</tbody>
            </table>`
          : '<p class="empty">No records.</p>'
      }`
    )
    .join('');

  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font: 12px/1.45 system-ui, -apple-system, Segoe UI, sans-serif; color: #0f172a; margin: 24px; }
  h1 { font-size: 18px; margin: 0; }
  .sub { color: #475569; margin: 4px 0 16px; }
  h2 { font-size: 14px; margin: 20px 0 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #f1f5f9; }
  tr { break-inside: avoid; }
  .empty { color: #64748b; }
</style></head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="sub">${escapeHtml(subtitle)}</p>
  ${tables}
</body></html>`);
  win.document.close();
  win.focus();
  win.print();
}
