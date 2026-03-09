/**
 * @file slack.js
 * @description Slack slash command integration for CatchFire Matching Engine.
 *              Handles /catchfire find <query> commands via POST /api/v1/slack/commands.
 *              Uses raw HTTP handling (no Slack SDK) for lightweight Cloud Run deployment.
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-03-05
 * @updated 2026-03-05
 */

const express = require('express');
const crypto = require('crypto');
const { generateEmbedding, findSimilar } = require('../llm');

const router = express.Router();

const TIMESTAMP_TOLERANCE_S = 300; // 5 minutes — reject replay attacks

if (!process.env.SLACK_SIGNING_SECRET) {
    console.warn('⚠️ SLACK_SIGNING_SECRET not set — Slack signature verification disabled (dev mode)');
}

// urlencoded parser scoped to this router only; preserves raw body for HMAC verification
router.use(express.urlencoded({
    extended: true,
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    }
}));

/**
 * Verify Slack request signature using HMAC-SHA256.
 * Computes v0:timestamp:body and compares against X-Slack-Signature header.
 * Skips verification when SLACK_SIGNING_SECRET is not configured (dev mode).
 */
function verifySlackSignature(req, res, next) {
    const secret = process.env.SLACK_SIGNING_SECRET;
    if (!secret) {
        return next();
    }

    const timestamp = req.headers['x-slack-request-timestamp'];
    const slackSignature = req.headers['x-slack-signature'];

    if (!timestamp || !slackSignature) {
        return res.status(401).json({ error: 'Missing Slack signature headers' });
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > TIMESTAMP_TOLERANCE_S) {
        return res.status(401).json({ error: 'Request timestamp too old' });
    }

    const sigBasestring = `v0:${timestamp}:${req.rawBody}`;
    const hmac = crypto.createHmac('sha256', secret)
        .update(sigBasestring)
        .digest('hex');
    const expectedSignature = `v0=${hmac}`;

    if (expectedSignature.length !== slackSignature.length ||
        !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(slackSignature))) {
        return res.status(401).json({ error: 'Invalid Slack signature' });
    }

    next();
}

/**
 * Format creator search results as Slack Block Kit blocks.
 * @param {Array} results - Creators with similarity scores
 * @param {string} query - Original search query
 * @returns {Array} Slack Block Kit blocks array
 */
function formatResultsAsBlocks(results, query) {
    const blocks = [
        {
            type: 'header',
            text: { type: 'plain_text', text: `CatchFire Results for "${query}"`, emoji: true }
        }
    ];

    if (results.length === 0) {
        blocks.push({
            type: 'section',
            text: { type: 'mrkdwn', text: 'No matching creators found. Try a broader search query.' }
        });
        return blocks;
    }

    const top = results.slice(0, 5);
    for (const creator of top) {
        const similarity = Math.round((creator.similarity || 0) * 100);
        const craft = creator.craft?.primary || 'Unknown';
        const location = creator.contact?.location || 'Not specified';
        const name = creator.name || 'Unnamed';
        const style = creator.craft?.styleSignature || '';

        let text = `*${name}* | ${craft} | ${location} | Score: ${similarity}%`;
        if (style) {
            text += `\n_${style}_`;
        }

        blocks.push(
            { type: 'section', text: { type: 'mrkdwn', text } },
            { type: 'divider' }
        );
    }

    if (results.length > 5) {
        blocks.push({
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `_${results.length - 5} more results not shown_` }]
        });
    }

    return blocks;
}

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /api/v1/slack/health - Health check for Slack URL verification
 */
router.get('/health', (_req, res) => {
    res.json({ ok: true });
});

/**
 * POST /api/v1/slack/commands - Handle Slack slash commands
 *
 * Slack sends form-urlencoded data with: token, team_id, team_domain, channel_id,
 * channel_name, user_id, user_name, command, text, response_url.
 *
 * Parses `text` as a semantic search query, runs embedding search against the
 * creator database, and returns up to 5 results formatted as Slack Block Kit.
 */
router.post('/commands', verifySlackSignature, async (req, res) => {
    const { command, text, user_name, channel_name } = req.body;
    console.log(`📥 Slack command: ${command} "${text}" from @${user_name} in #${channel_name}`);

    const query = (text || '').trim();
    if (!query) {
        return res.json({
            response_type: 'ephemeral',
            text: 'Usage: `/catchfire find <query>`\nExample: `/catchfire find moody cinematographer in Berlin`'
        });
    }

    try {
        const getCreators = req.app.get('getCreators');
        if (!getCreators) {
            throw new Error('getCreators not available on app context');
        }

        const queryEmbedding = await generateEmbedding(query, 'RETRIEVAL_QUERY');

        const allCreators = await getCreators();
        const candidates = allCreators.filter(c => c.embedding);

        if (candidates.length === 0) {
            return res.json({
                response_type: 'in_channel',
                blocks: formatResultsAsBlocks([], query)
            });
        }

        const results = findSimilar(queryEmbedding.values, candidates, {
            limit: 10,
            minSimilarity: 0.3
        });

        res.json({
            response_type: 'in_channel',
            blocks: formatResultsAsBlocks(results, query)
        });
    } catch (error) {
        console.error('❌ Slack command failed:', error.message);
        res.json({
            response_type: 'ephemeral',
            text: `Something went wrong: ${error.message}`
        });
    }
});

module.exports = router;
