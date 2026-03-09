/**
 * @file optionalAuth.js
 * @description Optional authentication middleware – sets req.authenticated without rejecting
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-03-05
 */

/**
 * Middleware that checks for a valid Bearer token or IAP identity header
 * but never rejects. Sets req.authenticated = true/false so downstream
 * handlers can adjust behaviour for authenticated vs anonymous requests.
 * Also sets req.authenticatedUser when IAP headers are present.
 */
function optionalAuth(req, _res, next) {
    req.authenticated = false;

    if (process.env.NODE_ENV !== 'production') {
        req.authenticated = true;
        return next();
    }

    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        const token = header.slice(7);
        const validTokens = (process.env.API_AUTH_TOKENS || '')
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        if (validTokens.length > 0 && validTokens.includes(token)) {
            req.authenticated = true;
            return next();
        }
    }

    const iapEmail = req.headers['x-goog-authenticated-user-email'];
    if (iapEmail) {
        req.authenticated = true;
        req.authenticatedUser = iapEmail.replace('accounts.google.com:', '');
    }

    next();
}

module.exports = { optionalAuth };
