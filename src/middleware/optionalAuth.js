/**
 * @file optionalAuth.js
 * @description Optional authentication middleware – sets req.authenticated without rejecting
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-23
 */

/**
 * Middleware that checks for a valid Bearer token but never rejects.
 * Sets req.authenticated = true/false so downstream handlers can
 * adjust behaviour for authenticated vs anonymous requests.
 */
function optionalAuth(req, _res, next) {
    req.authenticated = false;

    if (process.env.NODE_ENV !== 'production') {
        req.authenticated = true;
        return next();
    }

    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return next();
    }

    const token = header.slice(7);
    const validTokens = (process.env.API_AUTH_TOKENS || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

    if (validTokens.length > 0 && validTokens.includes(token)) {
        req.authenticated = true;
    }

    next();
}

module.exports = { optionalAuth };
