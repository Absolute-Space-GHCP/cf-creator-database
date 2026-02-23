/**
 * @file scraperTrigger.js
 * @description Cloud Scheduler endpoint for triggering automated creator scraping
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-23
 */

const express = require('express');
const router = express.Router();

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
 * POST /api/v1/scraper/trigger
 *
 * Accepts an optional JSON body:
 *   { platforms?: string[], limit?: number }
 *
 * Stub endpoint — acknowledges the trigger request.
 * Actual scraping orchestration will be wired in a later phase.
 */
router.post('/trigger', authenticateScraperRequest, (req, res) => {
    const { platforms = ['all'], limit = 100 } = req.body || {};

    console.log(
        `[scraper-trigger] Scrape triggered | auth=${req.scraperAuth.method}` +
        ` | platforms=${JSON.stringify(platforms)} | limit=${limit}` +
        ` | time=${new Date().toISOString()}`
    );

    res.json({
        success: true,
        message: 'Scrape triggered',
        platforms,
        limit
    });
});

/**
 * GET /api/v1/scraper/status
 *
 * Returns the current scraper status (mock data for now).
 */
router.get('/status', authenticateScraperRequest, (_req, res) => {
    res.json({
        success: true,
        running: false,
        lastRun: null,
        totalRuns: 0,
        platforms: ['vimeo', 'behance', 'artstation']
    });
});

/**
 * GET /api/v1/scraper/reports
 *
 * Returns recent scrape reports (mock data for now).
 */
router.get('/reports', authenticateScraperRequest, (_req, res) => {
    const now = Date.now();
    res.json({
        success: true,
        reports: [
            {
                id: 'rpt-001',
                timestamp: new Date(now - 86400000).toISOString(),
                platform: 'behance',
                creatorsFound: 47,
                creatorsAdded: 12,
                duration: 34200,
                status: 'completed'
            },
            {
                id: 'rpt-002',
                timestamp: new Date(now - 172800000).toISOString(),
                platform: 'artstation',
                creatorsFound: 63,
                creatorsAdded: 19,
                duration: 41800,
                status: 'completed'
            },
            {
                id: 'rpt-003',
                timestamp: new Date(now - 259200000).toISOString(),
                platform: 'vimeo',
                creatorsFound: 28,
                creatorsAdded: 7,
                duration: 22500,
                status: 'completed'
            }
        ]
    });
});

module.exports = router;
