/**
 * @file generate-status-pdf.mjs
 * @description Generate a PDF status report using jsPDF (no browser/puppeteer needed)
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-02-17
 * @updated 2026-02-17
 *
 * Usage: node scripts/generate-status-pdf.mjs
 * Output: docs/STATUS_REPORT_2026-02-17.pdf
 */

import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

// -- Constants --
const PW = 210; // A4 width mm
const PH = 297; // A4 height mm
const M = 16;   // margin
const CW = PW - M * 2; // content width

const C = {
    black:  [17, 17, 17],
    gold:   [201, 162, 39],
    green:  [5, 150, 105],
    yellow: [217, 119, 6],
    red:    [220, 38, 38],
    gray:   [107, 114, 128],
    ltGray: [229, 231, 235],
    text:   [26, 26, 26],
    muted:  [100, 100, 100],
    bg:     [250, 250, 250],
    white:  [255, 255, 255],
};

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
let y = 0;

function checkPage(need = 12) {
    if (y > PH - M - need) {
        doc.addPage();
        y = M;
    }
}

function drawLine(x1, y1, x2, y2, color = C.ltGray, width = 0.3) {
    doc.setDrawColor(...color);
    doc.setLineWidth(width);
    doc.line(x1, y1, x2, y2);
}

function heading(text, level = 2) {
    checkPage(16);
    y += level === 1 ? 4 : 10;
    const size = level === 1 ? 20 : 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(...C.black);
    doc.text(text, M, y);
    y += 2;
    if (level === 2) {
        drawLine(M, y, M + 50, y, C.gold, 0.8);
    }
    y += 5;
}

function bodyText(text, opts = {}) {
    const { bold = false, color = C.text, size = 9, indent = 0 } = opts;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CW - indent);
    for (const line of lines) {
        checkPage(6);
        doc.text(line, M + indent, y);
        y += 4.2;
    }
}

function badge(text, x, yPos, color) {
    doc.setFillColor(...color);
    const tw = doc.getTextWidth(text) + 4;
    doc.roundedRect(x, yPos - 3, tw, 4.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.white);
    doc.text(text, x + 2, yPos);
}

function table(headers, rows, colWidths) {
    checkPage(10 + rows.length * 6);
    const totalW = colWidths.reduce((a, b) => a + b, 0);

    // Header row
    doc.setFillColor(...C.black);
    doc.rect(M, y - 3.5, totalW, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.white);
    let x = M;
    headers.forEach((h, i) => {
        doc.text(h.toUpperCase(), x + 1.5, y);
        x += colWidths[i];
    });
    y += 4;

    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    rows.forEach((row, ri) => {
        checkPage(6);
        if (ri % 2 === 0) {
            doc.setFillColor(...C.bg);
            doc.rect(M, y - 3.2, totalW, 5, 'F');
        }
        x = M;
        row.forEach((cell, ci) => {
            doc.setTextColor(...C.text);
            // Status badges
            if (typeof cell === 'object' && cell.badge) {
                const colors = {
                    green: [209, 250, 229], yellow: [254, 243, 199], red: [254, 226, 226], gray: [243, 244, 246]
                };
                const textColors = {
                    green: [6, 95, 70], yellow: [146, 64, 14], red: [153, 27, 27], gray: [55, 65, 81]
                };
                const bc = colors[cell.badge] || colors.gray;
                const tc = textColors[cell.badge] || textColors.gray;
                doc.setFillColor(...bc);
                const tw = doc.getTextWidth(cell.text) + 4;
                doc.roundedRect(x + 1, y - 2.8, tw, 4, 1, 1, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(6.5);
                doc.setTextColor(...tc);
                doc.text(cell.text, x + 3, y);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
            } else {
                const txt = String(cell);
                const wrapped = doc.splitTextToSize(txt, colWidths[ci] - 3);
                doc.text(wrapped[0] || '', x + 1.5, y);
            }
            x += colWidths[ci];
        });
        y += 5;
    });
    y += 2;
}

const B = (text, color = 'green') => ({ badge: color, text });

// ============================================================================
// TITLE PAGE
// ============================================================================

doc.setFillColor(...C.black);
doc.rect(0, 0, PW, PH, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(36);
doc.setTextColor(...C.white);
doc.text('CATCHFIRE', M, 80);

doc.setFontSize(18);
doc.setTextColor(...C.gold);
doc.text('MATCHING ENGINE', M, 92);

drawLine(M, 98, M + 50, 98, C.gold, 1);

doc.setFont('helvetica', 'normal');
doc.setFontSize(14);
doc.setTextColor(...C.white);
doc.text('Status Report', M, 112);

doc.setFontSize(11);
doc.setTextColor(...C.gray);
doc.text('February 17, 2026', M, 124);

doc.setFontSize(8);
doc.setTextColor(...C.gray);
doc.text('Node.js v24.11.1  |  0 Vulnerabilities  |  79/79 Tests Passing', M, 140);
doc.text('Repo: cf-influencer-matching-engine', M, 146);

doc.setFontSize(8);
doc.setTextColor(...C.gold);
doc.text('Finding craft, not clout.', M, PH - 20);
doc.setTextColor(...C.gray);
doc.text('Author: Charley Scholz, JLAI  |  Co-authored: Claude Opus 4.6', M, PH - 14);

// ============================================================================
// CONTENT PAGES
// ============================================================================

doc.addPage();
y = M;

heading('Accomplishments — This Session (2026-02-17)', 2);
table(['Done', 'What'], [
    ['Dependency upgrades', 'Express 4->5, Firestore 7.1->8.3, @google/genai 1.38->1.41, axios, googleapis, dotenv'],
    ['@google-cloud/vertexai migration', 'Fully removed deprecated SDK; src/llm.ts uses unified @google/genai'],
    ['package-lock.json committed', 'Removed from .gitignore; reproducible builds now possible'],
    ['Automated test suite', '79 passing tests: schemas.test.ts (38) and scoring.test.ts (41) via vitest'],
    ['vitest.config.ts', 'Test runner config with v8 coverage targeting core modules'],
    ['docs/LEARN.md', '9 documented lessons (L001-L009) from leo-participation-translator pattern'],
    ['Cursor rules', 'TDD agent and LEARN.md consultation rules for AI assistant continuity'],
    ['Status report PDF', 'jsPDF-based generator at scripts/generate-status-pdf.mjs'],
    ['TASKS.md updated', 'Marked 5.1/5.2 complete, added session work, fixed doc drift'],
    ['TODO.md -> TASKS.md', 'Verified: TODO.md redirects to TASKS.md (single source of truth)'],
    ['Session handoff', 'docs/SESSION_2026-02-17_v0.5.0.md committed'],
], [55, CW - 55]);

heading('Accomplishments — Previous Sessions (Phases 0-3)', 2);
table(['Phase', 'Status', 'Key Deliverables'], [
    ['0: Foundation',        B('Complete'), 'GCP auth, .env, deps, local server, PLAN.md'],
    ['1: API Foundation',    B('Complete'), 'Creator CRUD, Zod schemas, scoring, POST /match'],
    ['2: Intelligence',      B('Complete'), 'LLM categorize, style signatures, Golden Records (10), Apify batch'],
    ['3: Search/Discovery',  B('Complete'), 'Embeddings, semantic search, lookalike model, Control Center'],
    ['Testing UI',           B('Complete'), '/testing page: match-by-brief + thumbs up/down feedback'],
    ['Cloud Run Deploy',     B('Complete'), 'cf-matching-engine-34240596768.us-central1.run.app'],
], [38, 22, CW - 60]);

heading('Testing Architecture (Three Layers)', 2);
table(['Layer', 'What', 'Audience'], [
    ['1. Unit Tests (vitest)', '79 tests for schemas + scoring', 'Developers, CI'],
    ['2. Stakeholder QA Docs', 'Manual testing guides + deploy plan', 'Dan, stakeholders'],
    ['3. Browser Testing UI', '/testing: match-by-brief + feedback', 'Dan, testers'],
], [42, CW - 72, 30]);

heading('Git Status', 2);
table(['Item', 'Status'], [
    ['Working tree', 'Clean -- all changes committed and pushed'],
    ['Remote sync', 'Local = origin/main (up to date)'],
    ['Latest commit', 'docs: add session handoff for 2026-02-17 v0.5.0'],
], [35, CW - 35]);

// ============================================================================
// NEXT STEPS
// ============================================================================

doc.addPage();
y = M;

heading('Next Steps — Phase 4: Scraper Integration', 2);
table(['Task', 'ID', 'Status', 'Notes'], [
    ['First batch scrape', '4.1', B('Not started', 'yellow'), 'Python scrapers in cf-creator-database'],
    ['Test scraper->Engine sync', '4.2', B('Not started', 'yellow'), 'Depends on 4.1'],
    ['Verify auto-embedding', '4.3', B('Not started', 'yellow'), 'Depends on 4.2'],
    ['Golden Records one-pager', '4.4', B('Done'), 'Sent to Dan 2026-02-13'],
    ['Scraping cadence scheduler', '4.5', B('Not started', 'yellow'), 'Festivals=annual, portfolios=quarterly'],
    ['Deduplication logic', '4.6', B('Not started', 'yellow'), 'Same person across sources'],
], [42, 10, 24, CW - 76]);

heading('Next Steps — Phase 5: Production Hardening', 2);
table(['Task', 'ID', 'Status', 'Notes'], [
    ['Rate limiting', '5.1', B('Already wired'), 'express-rate-limit active in index.js'],
    ['Helmet security headers', '5.2', B('Already wired'), 'helmet active in index.js'],
    ['Cloud Monitoring alerts', '5.3', B('Not started', 'yellow'), 'Error rate, latency, uptime'],
    ['Staging environment', '5.4', B('Not started', 'yellow'), 'Separate from production'],
    ['Admin scraper dashboard', '5.5', B('Not started', 'yellow'), 'Show last run, success rate'],
], [42, 10, 24, CW - 76]);

heading('Deploy Readiness (for Dan)', 2);
table(['Item', 'Status', 'Notes'], [
    ['Server runs locally', B('Ready'), 'npm start'],
    ['Testing UI at /testing', B('Ready'), 'Match-by-brief and feedback'],
    ['Firestore has creators', B('Needs data', 'yellow'), 'Only Golden Records; needs real creators'],
    ['Feedback sheet configured', B('TBD', 'gray'), 'FEEDBACK_SHEET_ID not set'],
    ['Cloud Run deploy current', B('Needs redeploy', 'yellow'), 'Code pushed to GitHub; needs gcloud deploy'],
], [42, 26, CW - 68]);

// ============================================================================
// FUTURE / ISSUES / BLOCKED
// ============================================================================

doc.addPage();
y = M;

heading('Future Enhancements (Phase 6)', 2);
table(['ID', 'Enhancement', 'Priority'], [
    ['6.1', 'Image Analysis (Gemini Vision) — auto-tag from portfolios', B('High', 'red')],
    ['6.2', 'Contact Enrichment (Clay.com/Hunter.io) — $1K budget', B('Medium', 'yellow')],
    ['6.3', 'Brief Templates — pre-built search queries', B('High', 'red')],
    ['6.4', 'Slack Integration — /catchfire find slash command', B('Medium', 'yellow')],
    ['6.5', 'Auto-Categorize — fine-tune LLM from feedback', B('Medium', 'yellow')],
    ['6.6', 'Multi-Model Support — Gemini Pro for complex briefs', B('Low', 'gray')],
    ['--', 'End-user links to work, refs, sources', B('Medium', 'yellow')],
    ['--', 'External/cultural live data layer', B('TBD', 'gray')],
], [10, CW - 32, 22]);

heading('Remaining Documentation Drift', 2);
table(['Issue', 'Severity', 'Details'], [
    ['PLAN.md is stale', B('Medium', 'yellow'), 'Tech stack + Phase 3 show pending but are done'],
    ['ACCOMPLISHMENTS doc stale', B('Medium', 'yellow'), 'Last updated 2026-02-11; security listed as next step'],
    ['TASKS.md 5.1/5.2', B('Fixed', 'green'), 'Marked complete this session'],
    ['dotenv v17 available', B('Info', 'gray'), 'Drops CommonJS; staying on v16 is correct'],
    ['vitest v4 available', B('Info', 'gray'), 'v3 is stable and safe'],
], [38, 20, CW - 58]);

heading('Blocked / Waiting on Decision', 2);
table(['Item', 'Blocked By', 'Resolution Needed'], [
    ['Golden Records expansion', 'Creative team input', 'Waiting for Creative session (one-pager sent)'],
    ['Feedback sheet location', 'PM / Dan decision', 'Need FEEDBACK_SHEET_ID and tab name'],
    ['External/cultural data scope', 'Dan confirmation', 'Trend API needed or scraper+LLM sufficient?'],
    ['Apify actor selection', 'Budget + ToS review', 'Which platforms to scrape first'],
], [38, 32, CW - 70]);

heading('Key URLs', 2);
table(['Resource', 'URL'], [
    ['Production', 'https://cf-matching-engine-34240596768.us-central1.run.app'],
    ['GitHub (Engine)', 'https://github.com/Absolute-Space-GHCP/cf-influencer-matching-engine'],
    ['GitHub (Creator DB)', 'https://github.com/Absolute-Space-GHCP/cf-creator-database'],
], [32, CW - 32]);

// ============================================================================
// PAGE FOOTERS
// ============================================================================

const totalPages = doc.getNumberOfPages();
for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...C.gray);
    doc.text('CatchFire Matching Engine — Status Report', M, PH - 8);
    doc.text(`${i - 1} / ${totalPages - 1}`, PW - M, PH - 8, { align: 'right' });
}

// ============================================================================
// SAVE
// ============================================================================

const buffer = Buffer.from(doc.output('arraybuffer'));
const outPath = 'docs/STATUS_REPORT_2026-02-17.pdf';
writeFileSync(outPath, buffer);
console.log(`PDF generated: ${outPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
