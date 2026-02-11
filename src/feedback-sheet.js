/**
 * @file feedback-sheet.js
 * @description Append feedback rows (thumbs up/down) to a Google Sheet for testing monitoring.
 * Requires FEEDBACK_SHEET_ID and optionally FEEDBACK_TAB_NAME in env.
 */

const { google } = require('googleapis');

const FEEDBACK_SHEET_ID = process.env.FEEDBACK_SHEET_ID;
const FEEDBACK_TAB_NAME = process.env.FEEDBACK_TAB_NAME || 'Feedback';

/**
 * Append one feedback row to the configured Google Sheet.
 * @param {object} payload - { event, briefOrQuery, sessionId?, resultId?, creatorId?, rating: 'up'|'down', comment? }
 * @returns {Promise<boolean>} true if appended, false if skipped (no sheet id or error)
 */
async function appendFeedbackRow(payload) {
    if (!FEEDBACK_SHEET_ID) {
        console.log('📋 Feedback: FEEDBACK_SHEET_ID not set, skipping sheet append');
        return false;
    }
    try {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        const sheets = google.sheets({ version: 'v4', auth });
        const row = [
            new Date().toISOString(),
            payload.event || '',
            payload.briefOrQuery || '',
            payload.sessionId || '',
            payload.resultId || '',
            payload.creatorId || '',
            payload.rating === 'up' ? '👍' : payload.rating === 'down' ? '👎' : payload.rating || '',
            payload.comment || ''
        ];
        await sheets.spreadsheets.values.append({
            spreadsheetId: FEEDBACK_SHEET_ID,
            range: `${FEEDBACK_TAB_NAME}!A:H`,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [row] }
        });
        console.log('✅ Feedback appended to sheet');
        return true;
    } catch (err) {
        console.error('❌ Feedback sheet append failed:', err.message);
        return false;
    }
}

module.exports = { appendFeedbackRow, FEEDBACK_SHEET_ID, FEEDBACK_TAB_NAME };
