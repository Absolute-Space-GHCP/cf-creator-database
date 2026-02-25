/**
 * @file scraperTrigger.js
 * @description Cloud Scheduler endpoint for triggering automated creator scraping.
 *              Executes the Python scraper pipeline as a subprocess, transforms results
 *              to the Matching Engine schema, and imports via the batch endpoint.
 * @author Charley Scholz, JLIT
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-25
 */

const express = require('express');
const { execFile } = require('child_process');
const { readFile, unlink } = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { transformScraperRecords } = require('../services/scraper-transform');

const router = express.Router();

const SCRAPER_DIR = path.resolve(__dirname, '../../scraper');
const PYTHON_BIN = 'python3';
const SCRAPER_TIMEOUT_MS = 600_000; // 10 min max for weekly full scrapes

/**
 * Authenticate incoming scraper trigger requests.
 * Accepts either:
 *   - X-CloudScheduler-JobName header (set automatically by Cloud Scheduler)
 *   - Authorization: Bearer <SCRAPER_API_KEY> header
 */
function authenticateScraperRequest(req, res, next) {
    const jobNameHeader = req.headers['x-cloudscheduler-jobname'];
    if (jobNameHeader) {
        req.scraperAuth = { method: 'cloud-scheduler', jobName: jobNameHeader };
        return next();
    }

    const apiKey = process.env.SCRAPER_API_KEY;
    if (apiKey) {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (token === apiKey) {
            req.scraperAuth = { method: 'api-key' };
            return next();
        }
    }

    return res.status(401).json({
        success: false,
        error: 'Unauthorized. Provide X-CloudScheduler-JobName header or valid Bearer token.'
    });
}

/**
 * Get a Firestore client from the Express app (shared with index.js).
 * Falls back to creating a new one if not available.
 */
function getFirestore(req) {
    const fs = req.app.get('firestore');
    if (fs) return fs;
    try {
        const { Firestore } = require('@google-cloud/firestore');
        const projectId = process.env.GCP_PROJECT_ID || 'catchfire-app-2026';
        return new Firestore({ projectId });
    } catch {
        return null;
    }
}

/**
 * Log a scraper run to Firestore scraper_runs collection.
 */
async function logScraperRun(firestore, runData) {
    if (!firestore) return null;
    try {
        const docRef = await firestore.collection('scraper_runs').add(runData);
        return docRef.id;
    } catch (err) {
        console.error('[scraper-trigger] Failed to log scraper run:', err.message);
        return null;
    }
}

/**
 * Execute the Python scraper pipeline as a subprocess.
 * Returns the parsed JSON output.
 */
function runPythonScraper(sources, outputPath) {
    return new Promise((resolve, reject) => {
        const args = [
            path.join(SCRAPER_DIR, 'main.py'),
            '--output', outputPath,
            '--summary'
        ];

        if (sources && sources.length > 0 && !sources.includes('all')) {
            args.push('--sources', ...sources);
        }

        console.log(`[scraper-trigger] Executing: ${PYTHON_BIN} ${args.join(' ')}`);

        execFile(PYTHON_BIN, args, {
            cwd: SCRAPER_DIR,
            timeout: SCRAPER_TIMEOUT_MS,
            maxBuffer: 10 * 1024 * 1024
        }, (error, stdout, stderr) => {
            if (stdout) console.log(`[scraper-stdout] ${stdout}`);
            if (stderr) console.log(`[scraper-stderr] ${stderr}`);

            if (error) {
                if (error.killed) {
                    reject(new Error(`Scraper timed out after ${SCRAPER_TIMEOUT_MS / 1000}s`));
                } else {
                    reject(new Error(`Scraper failed (exit ${error.code}): ${error.message}`));
                }
                return;
            }
            resolve();
        });
    });
}

/**
 * Import transformed creators via the internal batch endpoint.
 */
async function importViaBatch(creators, port) {
    const url = `http://localhost:${port}/api/v1/creators/batch`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creators })
    });
    return response.json();
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/v1/scraper/trigger
 *
 * Body: { platforms?: string[], limit?: number, dryRun?: boolean }
 *
 * Runs the Python scraper pipeline, transforms output, and imports to Firestore.
 */
router.post('/trigger', authenticateScraperRequest, async (req, res) => {
    const startTime = Date.now();
    const { platforms = ['all'], limit, dryRun = false } = req.body || {};
    const runId = crypto.randomUUID();
    const outputPath = path.join('/tmp', `scrape-${runId}.json`);

    const firestore = getFirestore(req);
    const authMethod = req.scraperAuth?.method || 'unknown';

    console.log(
        `[scraper-trigger] Run ${runId} | auth=${authMethod}` +
        ` | platforms=${JSON.stringify(platforms)} | dryRun=${dryRun}` +
        ` | time=${new Date().toISOString()}`
    );

    const runDoc = {
        timestamp: new Date().toISOString(),
        platforms,
        status: 'running',
        creatorsFound: 0,
        creatorsImported: 0,
        duration: 0,
        error: null,
        triggeredBy: authMethod,
        dryRun
    };
    const runDocId = await logScraperRun(firestore, runDoc);

    try {
        // Step 1: Run Python scraper pipeline
        await runPythonScraper(platforms, outputPath);

        // Step 2: Read and parse the output JSON
        let pipelineOutput;
        try {
            const raw = await readFile(outputPath, 'utf-8');
            pipelineOutput = JSON.parse(raw);
        } catch (err) {
            throw new Error(`Failed to read scraper output at ${outputPath}: ${err.message}`);
        }

        const records = pipelineOutput.records || [];
        const pipelineMetadata = pipelineOutput.metadata || {};

        console.log(`[scraper-trigger] Pipeline returned ${records.length} records`);

        // Step 3: Transform to Matching Engine schema
        const { transformed, errors: transformErrors } = transformScraperRecords(records);

        if (transformErrors.length > 0) {
            console.warn(`[scraper-trigger] ${transformErrors.length} transform errors:`, transformErrors.slice(0, 5));
        }

        // Step 4: Import (or report for dry run)
        let importResult = null;
        if (!dryRun && transformed.length > 0) {
            const port = process.env.PORT || 8090;
            importResult = await importViaBatch(transformed, port);
            console.log(`[scraper-trigger] Batch import: ${importResult.imported || 0} imported (${importResult.new || 0} new, ${importResult.merged || 0} merged)`);
        }

        // Step 5: Clean up temp file
        try { await unlink(outputPath); } catch { /* ignore */ }

        // Step 6: Update run log
        const duration = Date.now() - startTime;
        const creatorsImported = importResult?.imported || 0;
        if (firestore && runDocId) {
            await firestore.collection('scraper_runs').doc(runDocId).update({
                status: 'completed',
                creatorsFound: records.length,
                creatorsImported,
                duration,
                error: null
            });
        }

        res.json({
            success: true,
            runId,
            dryRun,
            creatorsFound: records.length,
            creatorsTransformed: transformed.length,
            creatorsImported,
            transformErrors: transformErrors.length,
            duration,
            platforms,
            pipelineStats: pipelineMetadata.pipeline_stats || {},
            importResult: importResult || undefined
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[scraper-trigger] Run ${runId} failed:`, error.message);

        try { await unlink(outputPath); } catch { /* ignore */ }

        if (firestore && runDocId) {
            await firestore.collection('scraper_runs').doc(runDocId).update({
                status: 'failed',
                duration,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            runId,
            error: error.message,
            duration,
            platforms
        });
    }
});

/**
 * GET /api/v1/scraper/status
 *
 * Returns the most recent scraper run from Firestore.
 */
router.get('/status', authenticateScraperRequest, async (req, res) => {
    const firestore = getFirestore(req);
    if (!firestore) {
        return res.status(503).json({ success: false, error: 'Firestore not available' });
    }

    try {
        const snapshot = await firestore.collection('scraper_runs')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.json({ success: true, lastRun: null, totalRuns: 0 });
        }

        const lastRun = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };

        const countSnapshot = await firestore.collection('scraper_runs').count().get();
        const totalRuns = countSnapshot.data().count;

        res.json({ success: true, lastRun, totalRuns });
    } catch (error) {
        console.error('[scraper-trigger] Status query failed:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/scraper/reports
 *
 * Returns the last 10 scraper runs from Firestore, ordered by timestamp desc.
 */
router.get('/reports', authenticateScraperRequest, async (req, res) => {
    const firestore = getFirestore(req);
    if (!firestore) {
        return res.status(503).json({ success: false, error: 'Firestore not available' });
    }

    try {
        const snapshot = await firestore.collection('scraper_runs')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({ success: true, reports });
    } catch (error) {
        console.error('[scraper-trigger] Reports query failed:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
