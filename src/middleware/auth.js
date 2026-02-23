/**
 * @file auth.js
 * @description API key authentication middleware – validates Bearer tokens against API_AUTH_TOKENS env var
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-23
 */

/**
 * Middleware that requires a valid Bearer token.
 * Skips enforcement when NODE_ENV !== 'production' (local dev).
 * Tokens are read from API_AUTH_TOKENS (comma-separated).
 */
function requireAuth(req, res, next) {
    if (process.env.NODE_ENV !== 'production') {
        req.authenticated = true;
        return next();
    }

    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = header.slice(7);
    const validTokens = (process.env.API_AUTH_TOKENS || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

    if (validTokens.length === 0 || !validTokens.includes(token)) {
        return res.status(403).json({ error: 'Invalid token' });
    }

    req.authenticated = true;
    next();
}

module.exports = { requireAuth };
