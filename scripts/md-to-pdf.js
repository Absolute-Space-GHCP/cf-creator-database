/**
 * @file md-to-pdf.js
 * @description Converts a markdown file to a styled PDF using Puppeteer
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Cursor (IDE)
 * @created 2026-02-19
 * @updated 2026-02-19
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function markdownToHtml(md) {
  let html = md;

  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  const lines = html.split('\n');
  const result = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listItems = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('|')) {
      if (!inTable) {
        if (inList) {
          result.push('<ul>' + listItems.join('') + '</ul>');
          listItems = [];
          inList = false;
        }
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
      continue;
    } else if (inTable) {
      result.push(renderTable(tableRows));
      inTable = false;
      tableRows = [];
    }

    if (line.startsWith('- ')) {
      if (!inList) inList = true;
      listItems.push('<li>' + line.slice(2) + '</li>');
      continue;
    } else if (inList) {
      result.push('<ul>' + listItems.join('') + '</ul>');
      listItems = [];
      inList = false;
    }

    if (line.trim() === '---') {
      result.push('<hr>');
    } else if (line.trim() === '') {
      result.push('');
    } else if (!line.startsWith('<h')) {
      result.push('<p>' + line + '</p>');
    } else {
      result.push(line);
    }
  }

  if (inTable) result.push(renderTable(tableRows));
  if (inList) result.push('<ul>' + listItems.join('') + '</ul>');

  return result.join('\n');
}

function renderTable(rows) {
  if (rows.length < 2) return '';
  const headerCells = rows[0].split('|').filter(c => c.trim() !== '').map(c => c.trim());
  const dataRows = rows.slice(2);

  let html = '<table><thead><tr>';
  headerCells.forEach(cell => { html += `<th>${cell}</th>`; });
  html += '</tr></thead><tbody>';

  dataRows.forEach(row => {
    const cells = row.split('|').filter(c => c.trim() !== '').map(c => c.trim());
    html += '<tr>';
    cells.forEach(cell => { html += `<td>${cell}</td>`; });
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}

async function generatePdf(inputPath, outputPath) {
  const md = fs.readFileSync(inputPath, 'utf-8');
  const bodyHtml = markdownToHtml(md);

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 11px;
    line-height: 1.55;
    color: #1a1a1a;
    padding: 0;
  }

  h1 {
    font-size: 22px;
    font-weight: 700;
    color: #111;
    margin-bottom: 4px;
    letter-spacing: -0.3px;
  }

  h2 {
    font-size: 14px;
    font-weight: 700;
    color: #111;
    margin-top: 18px;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 2px solid #c8a96e;
  }

  h3 {
    font-size: 12px;
    font-weight: 600;
    color: #333;
    margin-top: 12px;
    margin-bottom: 5px;
  }

  p {
    margin-bottom: 4px;
    color: #333;
  }

  hr {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 14px 0;
  }

  strong { font-weight: 600; color: #111; }

  code {
    font-family: 'JetBrains Mono', 'SF Mono', monospace;
    font-size: 10px;
    background: #f4f1ec;
    padding: 1px 5px;
    border-radius: 3px;
    color: #7a5c2e;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 12px;
    font-size: 10.5px;
  }

  thead th {
    background: #1a1a1a;
    color: #fff;
    font-weight: 600;
    text-align: left;
    padding: 6px 10px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  tbody td {
    padding: 5px 10px;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }

  tbody tr:nth-child(even) { background: #fafaf8; }
  tbody tr:hover { background: #f5f3ee; }

  ul {
    margin: 6px 0 10px 18px;
    padding: 0;
  }

  li {
    margin-bottom: 3px;
    color: #333;
  }

  li code {
    font-size: 9.5px;
  }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'Letter',
    margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' },
    printBackground: true,
  });
  await browser.close();
  console.log(`PDF generated: ${outputPath}`);
}

const input = process.argv[2];
const output = process.argv[3];

if (!input) {
  console.error('Usage: node scripts/md-to-pdf.js <input.md> [output.pdf]');
  process.exit(1);
}

const inputPath = path.resolve(input);
const outputPath = output ? path.resolve(output) : inputPath.replace(/\.md$/, '.pdf');

generatePdf(inputPath, outputPath).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
