/**
 * SCAFFOLD: Contact Enrichment integration (task 3.2 / 8.2).
 * Awaiting budget approval from Paula and Apify actor selection.
 * No live API calls to Clay or Hunter — stub implementations only.
 *
 * @file enrichment.js
 * @description Contact enrichment routes for creator email/contact lookup.
 *              Providers: Clay.com (CLAY_API_KEY), Hunter.io (HUNTER_API_KEY).
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-03-05
 * @updated 2026-03-05
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// -----------------------------------------------------------------------------
// Provider env vars: clay (CLAY_API_KEY), hunter (HUNTER_API_KEY)
// Log warnings when missing, don't crash.
// -----------------------------------------------------------------------------
function getEnrichmentConfig() {
    const clayKey = process.env.CLAY_API_KEY;
    const hunterKey = process.env.HUNTER_API_KEY;
    const provider = (process.env.ENRICHMENT_PROVIDER || '').toLowerCase();

    if (!clayKey && !hunterKey) {
        console.warn('⚠️ No enrichment API keys set — CLAY_API_KEY and HUNTER_API_KEY both missing');
    } else if (!clayKey) {
        console.warn('⚠️ CLAY_API_KEY not set — Clay.com provider unavailable');
    } else if (!hunterKey) {
        console.warn('⚠️ HUNTER_API_KEY not set — Hunter.io provider unavailable');
    }

    const available = [];
    if (clayKey) available.push('clay');
    if (hunterKey) available.push('hunter');

    const configured = (provider === 'clay' && clayKey) || (provider === 'hunter' && hunterKey);

    return {
        provider: provider || null,
        configured,
        available,
        envVars: {
            ENRICHMENT_PROVIDER: provider || '(not set)',
            CLAY_API_KEY: clayKey ? '***' : '(not set)',
            HUNTER_API_KEY: hunterKey ? '***' : '(not set)'
        }
    };
}

// -----------------------------------------------------------------------------
// Stub provider functions (throw "not implemented" — no live API calls)
// -----------------------------------------------------------------------------

/**
 * Enrich contact via Clay.com (stub — not implemented).
 * @param {string} creatorName - Creator display name
 * @param {string} handle - Social handle (e.g. @username)
 * @throws {Error} Always — scaffold only
 */
async function enrichViaClay(creatorName, handle) {
    throw new Error('Contact enrichment via Clay.com is not yet implemented (scaffold only).');
}

/**
 * Enrich contact via Hunter.io (stub — not implemented).
 * @param {string} creatorName - Creator display name
 * @param {string} domain - Domain to look up (e.g. example.com)
 * @throws {Error} Always — scaffold only
 */
async function enrichViaHunter(creatorName, domain) {
    throw new Error('Contact enrichment via Hunter.io is not yet implemented (scaffold only).');
}

// -----------------------------------------------------------------------------
// Route: GET /api/v1/enrichment/status
// -----------------------------------------------------------------------------
router.get('/status', requireAuth, (req, res) => {
    const config = getEnrichmentConfig();
    res.json({
        success: true,
        status: config.configured ? 'ready' : 'awaiting_configuration',
        message: config.configured
            ? `Enrichment configured with provider: ${config.provider}`
            : 'Contact enrichment is not yet configured. Set ENRICHMENT_PROVIDER and the corresponding API key (CLAY_API_KEY or HUNTER_API_KEY).',
        config: {
            provider: config.provider,
            availableProviders: config.available,
            envVars: config.envVars
        }
    });
});

// -----------------------------------------------------------------------------
// Route: POST /api/v1/enrichment/enrich/:id
// Scaffold: Always returns "not yet configured" until budget/API keys approved.
// When configured, would fetch creator, determine provider, call enrichViaClay or enrichViaHunter.
// -----------------------------------------------------------------------------
router.post('/enrich/:id', requireAuth, async (req, res) => {
    const config = getEnrichmentConfig();

    if (!config.configured) {
        return res.status(503).json({
            success: false,
            error: 'Contact enrichment is not yet configured. Set ENRICHMENT_PROVIDER and ENRICHMENT_API_KEY env vars.',
            status: 'awaiting_configuration'
        });
    }

    // When configured: fetch creator, call provider stub (stub throws "not implemented")
    const firestore = req.app.get('firestore');
    if (!firestore) {
        return res.status(503).json({ success: false, error: 'Firestore not available' });
    }

    const { id } = req.params;
    const creatorsCollection = process.env.FIRESTORE_COLLECTION || 'creators';
    const doc = await firestore.collection(creatorsCollection).doc(id).get();

    if (!doc.exists) {
        return res.status(404).json({ success: false, error: 'Creator not found' });
    }

    const creator = { id: doc.id, ...doc.data() };
    const creatorName = creator.name || 'Unknown';
    const handle = creator.handle || '';
    const portfolioUrl = creator.contact?.portfolio_url || '';

    let domain = '';
    try {
        if (portfolioUrl) {
            const url = new URL(portfolioUrl);
            domain = url.hostname.replace(/^www\./, '');
        }
    } catch {
        // ignore
    }

    try {
        if (config.provider === 'clay') {
            await enrichViaClay(creatorName, handle);
        } else if (config.provider === 'hunter') {
            await enrichViaHunter(creatorName, domain);
        } else {
            return res.status(503).json({
                success: false,
                error: `Unknown provider: ${config.provider}. Set ENRICHMENT_PROVIDER to 'clay' or 'hunter'.`,
                status: 'awaiting_configuration'
            });
        }
    } catch (err) {
        return res.status(501).json({
            success: false,
            error: err.message,
            status: 'not_implemented'
        });
    }

    res.json({ success: true, creatorId: id });
});

// -----------------------------------------------------------------------------
// Route: POST /api/v1/enrichment/bulk
// -----------------------------------------------------------------------------
router.post('/bulk', requireAuth, async (req, res) => {
    const config = getEnrichmentConfig();

    if (!config.configured) {
        return res.status(503).json({
            success: false,
            error: 'Contact enrichment is not yet configured. Set ENRICHMENT_PROVIDER and the corresponding API key.',
            status: 'awaiting_configuration',
            processed: 0,
            results: []
        });
    }

    const { creatorIds } = req.body || {};
    if (!Array.isArray(creatorIds) || creatorIds.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Request body must contain a non-empty "creatorIds" array'
        });
    }

    // Stub: return awaiting_configuration for bulk (no live implementation)
    res.json({
        success: false,
        error: 'Bulk enrichment is not yet implemented (scaffold only).',
        status: 'awaiting_configuration',
        requested: creatorIds.length,
        processed: 0,
        results: []
    });
});

module.exports = router;
