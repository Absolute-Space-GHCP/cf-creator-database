/**
 * @file md-to-pdf.mjs
 * @description Converts markdown files to styled PDF using Puppeteer + Chrome
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-03-05
 * @updated 2026-03-05
 */

import { readFileSync } from 'fs';
import { resolve, basename } from 'path';
import puppeteer from 'puppeteer-core';
import { marked } from 'marked';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/md-to-pdf.mjs <input.md> [output.pdf]');
  process.exit(1);
}

const inputPath = resolve(args[0]);
const outputPath = args[1]
  ? resolve(args[1])
  : resolve('pdf-exports', basename(inputPath).replace(/\.md$/, '.pdf'));

const markdown = readFileSync(inputPath, 'utf-8');

// Custom marked renderer to tag mermaid code blocks for client-side rendering
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code;
renderer.code = function (code, language) {
  // marked v4: code is an object {text, lang} or (text, lang, escaped) depending on version
  const text = typeof code === 'object' ? code.text : code;
  const lang = typeof code === 'object' ? code.lang : language;

  if (lang === 'mermaid') {
    return `<pre class="mermaid">${text}</pre>`;
  }
  if (originalCodeRenderer) {
    return originalCodeRenderer.call(this, code, language);
  }
  const escaped = (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<pre><code class="language-${lang || ''}">${escaped}</code></pre>`;
};

marked.setOptions({ renderer });
const htmlBody = marked.parse(markdown);

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<script src="${MERMAID_CDN}"></script>
<style>
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 100%;
    padding: 0 10px;
  }
  h1 {
    font-size: 22pt;
    border-bottom: 3px solid #c8a96e;
    padding-bottom: 8px;
    margin-top: 30px;
    color: #111;
  }
  h2 {
    font-size: 16pt;
    border-bottom: 2px solid #c8a96e;
    padding-bottom: 6px;
    margin-top: 28px;
    color: #222;
  }
  h3 {
    font-size: 13pt;
    margin-top: 22px;
    color: #333;
  }
  h4 { font-size: 11pt; margin-top: 18px; color: #444; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0;
    font-size: 9.5pt;
  }
  thead th {
    background: #1a1a1a;
    color: #fff;
    text-transform: uppercase;
    font-size: 8.5pt;
    letter-spacing: 0.5px;
    padding: 8px 10px;
    text-align: left;
  }
  tbody td {
    padding: 6px 10px;
    border-bottom: 1px solid #e0e0e0;
  }
  tbody tr:nth-child(even) { background: #fafafa; }
  code {
    background: #f4f4f4;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 9.5pt;
    font-family: 'Cascadia Code', 'Consolas', monospace;
  }
  pre {
    background: #f4f4f4;
    padding: 12px 16px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.5;
    border: 1px solid #e0e0e0;
  }
  pre code { background: none; padding: 0; }
  pre.mermaid {
    background: #fff;
    border: 1px solid #e2e8f0;
    text-align: center;
    font-size: inherit;
    line-height: inherit;
  }
  pre.mermaid svg {
    max-width: 100%;
    height: auto;
  }
  blockquote {
    border-left: 4px solid #c8a96e;
    margin: 12px 0;
    padding: 8px 16px;
    color: #555;
    background: #faf8f4;
  }
  ul, ol { padding-left: 24px; }
  li { margin-bottom: 4px; }
  hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
  a { color: #2563eb; text-decoration: none; }
  strong { color: #111; }
</style>
</head>
<body>
${htmlBody}
<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    themeVariables: {
      primaryColor: '#f0ebe0',
      primaryBorderColor: '#c8a96e',
      primaryTextColor: '#1a1a1a',
      lineColor: '#94a3b8',
      secondaryColor: '#f8fafc',
      tertiaryColor: '#faf8f4',
      fontSize: '13px'
    },
    flowchart: { htmlLabels: true, curve: 'basis' },
    sequence: { useMaxWidth: true },
  });
</script>
</body>
</html>`;

console.log(`Converting: ${inputPath}`);
console.log(`Output: ${outputPath}`);

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

// Wait for Mermaid to finish rendering all diagrams
await page.evaluate(() => {
  return new Promise((resolve) => {
    const check = () => {
      const pending = document.querySelectorAll('pre.mermaid:not([data-processed])');
      const svgs = document.querySelectorAll('pre.mermaid svg, pre.mermaid[data-processed] svg');
      if (pending.length === 0 || svgs.length > 0) {
        setTimeout(resolve, 500);
      } else {
        setTimeout(check, 200);
      }
    };
    setTimeout(check, 1000);
  });
});

const diagramCount = await page.evaluate(() =>
  document.querySelectorAll('pre.mermaid svg').length
);
console.log(`Mermaid diagrams rendered: ${diagramCount}`);

await page.pdf({
  path: outputPath,
  format: 'A4',
  margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `
    <div style="font-size: 8pt; color: #999; width: 100%; text-align: center; padding: 0 20mm;">
      <span>CatchFire Influencer Matching Engine</span>
      <span style="float: right;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`,
});

await browser.close();
console.log(`PDF generated: ${outputPath}`);
