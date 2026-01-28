/**
 * @file index.js
 * @version 1.0.0-clean
 * @date 2026-01-28
 * @repo ai-agents-gmaster-build
 */

/**
 * AI Golden Master Framework - Slack Bot v1.0.0-clean
 * Repository: github.com/Absolute-Space-GHCP/ai-agents-gmaster-build
 * 
 * A reusable AI-powered Slack bot framework with:
 * LAYER 1: Document RAG (Gemini 2.5 Flash + GCS Direct PDF) ✅
 * LAYER 2: Slack Integration ✅
 * LAYER 3: Entity Directory (Firestore) ✅
 * LAYER 4: Feedback (👍/👎 → Google Sheets) ✅
 * LAYER 5: Pre-canned Responses (Google Sheets) ✅
 * LAYER 6: PII Security Check ✅
 * LAYER 7: Thread Continuity ✅
 * LAYER 8: Monitoring Dashboard ✅
 * LAYER 9: Smart Query Reasoning (Yes/No Questions) ✅
 * LAYER 10: Process-Aware Routing + Helpful Fallbacks ✅
 * LAYER 11: Year-Aware Document Selection ✅
 * LAYER 12: Custom Query Handler (Example) ✅
 * 
 * CUSTOMIZE: Update CONFIG section below with your settings
 * See docs/SETUP.md for deployment instructions
 */

require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
const { VertexAI } = require('@google-cloud/vertexai');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
const { google } = require('googleapis');

// =============================================================================
// 🔧 CONFIGURATION - CUSTOMIZE FOR YOUR DEPLOYMENT
// All values should be set via environment variables
// See docs/SETUP.md for details
// =============================================================================
const CONFIG = {
    // GCP Project
    projectId: process.env.GCP_PROJECT_ID || 'YOUR_PROJECT_ID',
    location: process.env.GCP_REGION || 'us-central1',
    
    // Gemini Model
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    
    // GCS Bucket with Documents
    gcsBucket: process.env.GCS_BUCKET || 'YOUR_BUCKET_NAME',
    
    // Slack Credentials (REQUIRED)
    slackBotToken: process.env.SLACK_BOT_TOKEN,
    slackSigningSecret: process.env.SLACK_SIGNING_SECRET,
    
    // Google Sheets (Feedback + Pre-canned Responses)
    feedbackSheetId: process.env.FEEDBACK_SHEET_ID || 'YOUR_SHEET_ID',
    feedbackTabName: process.env.FEEDBACK_TAB_NAME || 'Feedback',
    preCannedTabName: process.env.PRECANNED_TAB_NAME || 'Sheet1',
    
    // Firestore Collection (Entity Directory)
    firestoreCollection: process.env.FIRESTORE_COLLECTION || 'entities',
    
    // Server
    port: process.env.PORT || 8090,
    
    // App Identity (customize for your bot)
    appName: process.env.APP_NAME || 'AI Assistant',
    appVersion: process.env.APP_VERSION || '0.1.0',
    organizationName: process.env.ORG_NAME || 'Your Organization',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    baseUrl: process.env.BASE_URL || 'http://localhost:8090'
};

// =============================================================================
// CLIENTS
// =============================================================================
const storage = new Storage({ projectId: CONFIG.projectId });
const vertexAI = new VertexAI({ project: CONFIG.projectId, location: CONFIG.location });
const geminiModel = vertexAI.getGenerativeModel({ model: CONFIG.model });
const firestore = new Firestore({ projectId: CONFIG.projectId });

// =============================================================================
// EMPLOYEE CACHE - Avoid repeated Firestore calls
// =============================================================================
let employeeCache = null;
let employeeCacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes (increased from 5 to reduce cold starts)

async function getEmployees() {
    const now = Date.now();
    if (employeeCache && (now - employeeCacheTime) < CACHE_TTL) {
        console.log('📦 Using cached employee data');
        return employeeCache;
    }
    
    console.log('🔄 Fetching fresh employee data from Firestore...');
    const startTime = Date.now();
    const snapshot = await firestore.collection(CONFIG.firestoreCollection).get();
    const fetchTime = Date.now() - startTime;
    console.log(`⏱️ Firestore fetch took ${fetchTime}ms`);
    
    employeeCache = [];
    snapshot.forEach(doc => employeeCache.push(doc.data()));
    employeeCacheTime = now;
    
    console.log(`📊 Cached ${employeeCache.length} employees`);
    return employeeCache;
}

// =============================================================================
// ANALYTICS - Track usage metrics (CONFIGURABLE - set ENABLE_ANALYTICS=true)
// =============================================================================
const ENABLE_ANALYTICS = process.env.ENABLE_ANALYTICS !== 'false'; // Enabled by default

async function logAnalytics(queryType, keywords = [], responseTimeMs = 0, userId = 'anonymous') {
    if (!ENABLE_ANALYTICS) return;
    
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const docRef = firestore.collection('analytics').doc(`daily_${today}`);
        
        // Use transaction to safely increment counters
        await firestore.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            
            if (!doc.exists) {
                // Create new daily record
                transaction.set(docRef, {
                    date: today,
                    totalQueries: 1,
                    queryTypes: { [queryType]: 1 },
                    topKeywords: keywords.reduce((acc, k) => ({ ...acc, [k]: 1 }), {}),
                    totalResponseTime: responseTimeMs,
                    queryCount: 1,
                    uniqueUsers: [userId],
                    createdAt: new Date()
                });
            } else {
                const data = doc.data();
                
                // Update counters
                const queryTypes = data.queryTypes || {};
                queryTypes[queryType] = (queryTypes[queryType] || 0) + 1;
                
                const topKeywords = data.topKeywords || {};
                keywords.forEach(k => {
                    topKeywords[k] = (topKeywords[k] || 0) + 1;
                });
                
                const uniqueUsers = data.uniqueUsers || [];
                if (!uniqueUsers.includes(userId)) {
                    uniqueUsers.push(userId);
                }
                
                transaction.update(docRef, {
                    totalQueries: (data.totalQueries || 0) + 1,
                    queryTypes,
                    topKeywords,
                    totalResponseTime: (data.totalResponseTime || 0) + responseTimeMs,
                    queryCount: (data.queryCount || 0) + 1,
                    uniqueUsers
                });
            }
        });
        
        console.log(`📈 Analytics logged: ${queryType}`);
    } catch (error) {
        console.error('⚠️ Analytics logging failed:', error.message);
        // Don't throw - analytics failures shouldn't break the bot
    }
}

async function getAnalytics(days = 7) {
    if (!ENABLE_ANALYTICS) {
        return { enabled: false, message: 'Analytics disabled' };
    }
    
    try {
        const analytics = [];
        const today = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const doc = await firestore.collection('analytics').doc(`daily_${dateStr}`).get();
            if (doc.exists) {
                const data = doc.data();
                analytics.push({
                    date: dateStr,
                    totalQueries: data.totalQueries || 0,
                    queryTypes: data.queryTypes || {},
                    avgResponseTime: data.queryCount > 0 
                        ? Math.round((data.totalResponseTime || 0) / data.queryCount) 
                        : 0,
                    uniqueUsers: (data.uniqueUsers || []).length,
                    topKeywords: getTopN(data.topKeywords || {}, 10)
                });
            }
        }
        
        // Calculate totals
        const totals = {
            totalQueries: analytics.reduce((sum, d) => sum + d.totalQueries, 0),
            avgResponseTime: Math.round(
                analytics.reduce((sum, d) => sum + d.avgResponseTime, 0) / Math.max(analytics.length, 1)
            ),
            totalUniqueUsers: new Set(analytics.flatMap(d => d.uniqueUsers || [])).size,
            queryTypeBreakdown: {}
        };
        
        // Aggregate query types
        analytics.forEach(d => {
            Object.entries(d.queryTypes).forEach(([type, count]) => {
                totals.queryTypeBreakdown[type] = (totals.queryTypeBreakdown[type] || 0) + count;
            });
        });
        
        return {
            enabled: true,
            period: `${days} days`,
            dailyData: analytics,
            totals
        };
    } catch (error) {
        console.error('⚠️ Analytics retrieval failed:', error.message);
        return { enabled: true, error: error.message };
    }
}

function getTopN(obj, n) {
    return Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}

// Google Sheets client
const sheetsAuth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });

// =============================================================================
// THREAD TRACKING - For conversation continuity
// =============================================================================
const activeThreads = new Map();
const THREAD_TTL = 30 * 60 * 1000; // 30 minutes

// Clean up old threads periodically
setInterval(() => {
    const now = Date.now();
    for (const [threadTs, lastActive] of activeThreads) {
        if (now - lastActive > THREAD_TTL) {
            activeThreads.delete(threadTs);
        }
    }
}, 5 * 60 * 1000); // Every 5 minutes

// =============================================================================
// SLACK: Request Verification & Deduplication
// =============================================================================
const processedEvents = new Set();
const EVENT_CACHE_TTL = 60000;

function verifySlackRequest(req, rawBody) {
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    
    if (!signature || !timestamp) return false;
    if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 60 * 5) return false;
    
    const sigBasestring = `v0:${timestamp}:${rawBody}`;
    const mySignature = 'v0=' + crypto.createHmac('sha256', CONFIG.slackSigningSecret)
        .update(sigBasestring, 'utf8').digest('hex');
    
    return mySignature === signature;
}

function isEventProcessed(eventId) {
    if (processedEvents.has(eventId)) return true;
    processedEvents.add(eventId);
    setTimeout(() => processedEvents.delete(eventId), EVENT_CACHE_TTL);
    return false;
}

// =============================================================================
// SLACK: Send Message with Feedback Buttons
// =============================================================================
async function sendSlackMessage(channel, text, threadTs, includeFeedback = false) {
    const message = { 
        channel, 
        text,
        thread_ts: threadTs 
    };
    
    if (includeFeedback) {
        message.blocks = [
            { type: 'section', text: { type: 'mrkdwn', text } },
            { type: 'actions', elements: [
                { 
                    type: 'button', 
                    text: { type: 'plain_text', text: '👍', emoji: true }, 
                    value: 'helpful', 
                    action_id: 'feedback_helpful' 
                },
                { 
                    type: 'button', 
                    text: { type: 'plain_text', text: '👎', emoji: true }, 
                    value: 'not_helpful', 
                    action_id: 'feedback_not_helpful' 
                }
            ]}
        ];
    }
    
    try {
        await axios.post('https://slack.com/api/chat.postMessage', message, {
            headers: { 'Authorization': `Bearer ${CONFIG.slackBotToken}` }
        });
    } catch (error) {
        console.error('❌ Slack send error:', error.message);
    }
}

// Send message with custom blocks (for pagination, etc.)
async function sendSlackMessageWithBlocks(channel, text, blocks, threadTs, includeFeedback = false) {
    const finalBlocks = [...blocks];
    
    if (includeFeedback) {
        finalBlocks.push({ type: 'divider' });
        finalBlocks.push({
            type: 'actions',
            elements: [
                { 
                    type: 'button', 
                    text: { type: 'plain_text', text: '👍', emoji: true }, 
                    value: 'helpful', 
                    action_id: 'feedback_helpful' 
                },
                { 
                    type: 'button', 
                    text: { type: 'plain_text', text: '👎', emoji: true }, 
                    value: 'not_helpful', 
                    action_id: 'feedback_not_helpful' 
                }
            ]
        });
    }
    
    try {
        await axios.post('https://slack.com/api/chat.postMessage', {
            channel,
            text,
            blocks: finalBlocks,
            thread_ts: threadTs
        }, { headers: { 'Authorization': `Bearer ${CONFIG.slackBotToken}` }});
    } catch (error) {
        console.error('❌ Slack send error:', error.message);
    }
}

// =============================================================================
// FEEDBACK: Store to Google Sheets
// =============================================================================
async function storeFeedback(timestamp, question, rating, response) {
    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.feedbackSheetId,
            range: `${CONFIG.feedbackTabName}!A:D`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [[timestamp, question, rating, response]] }
        });
        console.log('✅ Feedback stored:', rating);
    } catch (error) {
        console.error('❌ Feedback storage error:', error.message);
    }
}

// =============================================================================
// PII SECURITY CHECK - Block requests for protected information
// =============================================================================
const PII_KEYWORDS = [
    'social security', 'ssn', 'social security number',
    'phone number', 'cell phone', 'mobile phone', 'telephone', 'call me',
    'home address', 'residential address', 'where does', 'where do they live',
    'street address', 'apt', 'apartment number'
];

// Sensitive PERSONAL queries that should be handled in DMs, not public channels
const SENSITIVE_PERSONAL_KEYWORDS = [
    'my salary', 'my pay', 'my compensation', 'how much do i make', 'how much am i paid',
    'my benefits cost', 'my premium', 'my contribution', 'my deduction',
    'my medical plan', 'my health insurance', 'my coverage',
    'my review', 'my performance', 'my evaluation', 'my raise',
    'my 401k', 'my retirement', 'my hra balance',
    'my fsa', 'my flexible spending',
    'am i enrolled', 'am i eligible', 'my enrollment'
];

// Check if channel is a DM (DMs start with 'D' in Slack)
function isDirectMessage(channelId) {
    return channelId && channelId.startsWith('D');
}

// Check if query contains sensitive personal information requests
function isSensitivePersonalQuery(query) {
    const lowerQuery = query.toLowerCase();
    return SENSITIVE_PERSONAL_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
}

// Redirect sensitive queries to DM if asked in public channel
async function checkAndRedirectSensitive(query, channel, threadTs) {
    if (!isDirectMessage(channel) && isSensitivePersonalQuery(query)) {
        console.log('🔒 Sensitive query in public channel - redirecting to DM:', query);
        
        const redirectText = "🔒 *Privacy Notice*\n\n" +
            "Questions about your personal benefits, salary, or enrollment status contain sensitive information that shouldn't be discussed in public channels.\n\n" +
            "Please *send me a direct message (DM)* for help with personal benefits questions! 💬\n\n" +
            "_Just click on my name and select 'Message' to start a private conversation._";
        
        await sendSlackMessage(channel, redirectText, threadTs);
        return true; // Indicates we handled this and should stop processing
    }
    return false; // Continue normal processing
}

// =============================================================================
// META QUESTIONS (version, about, who are you)
// =============================================================================
function isMetaQuestion(query) {
    const lower = query.toLowerCase();
    const metaPatterns = [
        /what version/i,
        /which version/i,
        /your version/i,
        /version are you/i,
        /who are you/i,
        /what are you/i,
        /about yourself/i,
        /tell me about you/i,
        /introduce yourself/i
    ];
    return metaPatterns.some(pattern => pattern.test(lower));
}

async function handleMetaQuestion(channel, threadTs) {
    const response = `I'm *${CONFIG.appName} v${CONFIG.appVersion}* 🚀 - ${CONFIG.organizationName}'s AI assistant!

I can help you with:
• 📄 *<${CONFIG.baseUrl}/documents|Documents & Policies>* - Browse available documents
• 👥 *<${CONFIG.baseUrl}/directory|Directory>* - Find people by name or department
• 📊 *<${CONFIG.baseUrl}/dashboard|Dashboard>* - View system status

Just ask me anything! What can I help you with today?`;

    await sendSlackMessage(channel, response, threadTs, true);
    console.log('ℹ️ Meta question answered (version/about)');
}

// =============================================================================
// CUSTOM QUERY HANDLER (EXAMPLE - CUSTOMIZE FOR YOUR USE CASE)
// This is an example of how to add custom query handlers for specific topics
// =============================================================================
function isCustomQuery(text) {
    const lower = text.toLowerCase();
    // CUSTOMIZE: Add patterns for queries you want to handle specially
    const customPatterns = [
        /about (the|our) (company|organization)/i,
        /company (history|info|information)/i,
        /who (started|founded|created)/i
    ];
    return customPatterns.some(p => p.test(lower));
}

async function handleCustomQuery(channel, threadTs) {
    // CUSTOMIZE: Provide information about your organization
    const response = `🏛️ *About ${CONFIG.organizationName}*

This is a template response. Customize this handler in \`src/index.js\` to provide information about your organization.

You can include:
• Company history and founding
• Mission and values
• Key facts and figures
• Links to relevant resources

_This handler demonstrates how to add custom query routing for specific topics._`;

    await sendSlackMessage(channel, response, threadTs, true);
    console.log('🏛️ Custom query answered');
}

// =============================================================================
// PII SECURITY CHECK
// =============================================================================
async function checkAndBlockPII(query, channel, threadTs) {
    const lowerQuery = query.toLowerCase();
    
    if (PII_KEYWORDS.some(keyword => lowerQuery.includes(keyword))) {
        console.log('⚠️ PII Request Blocked:', query);
        
        const warningText = "⚠️ *Security Notice: Protected Information*\n\n" +
            "I cannot provide phone numbers, home addresses, or social security numbers as this is protected Personally Identifiable Information (PII).\n\n" +
            "For assistance with sensitive information, please contact your administrator:\n" +
            `📧 <mailto:${CONFIG.supportEmail}|${CONFIG.supportEmail}>`;
        
        await sendSlackMessage(channel, warningText, threadTs);
        await storeFeedback(new Date().toISOString(), query, 'PII_BLOCKED', warningText);
        return true; // Query was blocked
    }
    return false; // Query is safe
}

// =============================================================================
// PRE-CANNED RESPONSES: Search Q&A Sheet
// =============================================================================
let preCannedCache = null;
let preCannedCacheTime = 0;
const PRECANNED_CACHE_TTL = 30 * 60 * 1000; // 30 minutes (increased to reduce cold starts)

async function getPreCannedResponses() {
    const now = Date.now();
    if (preCannedCache && (now - preCannedCacheTime) < PRECANNED_CACHE_TTL) {
        return preCannedCache;
    }
    
    try {
        console.log('📋 Fetching pre-canned responses from Sheet...');
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.feedbackSheetId,
            range: `${CONFIG.preCannedTabName}!A:C`
        });
        
        preCannedCache = response.data.values || [];
        preCannedCacheTime = now;
        console.log(`✅ Cached ${preCannedCache.length} pre-canned responses`);
        return preCannedCache;
    } catch (error) {
        console.error('❌ Pre-canned fetch error:', error.message);
        return [];
    }
}

async function searchPreCannedResponses(query) {
    const rows = await getPreCannedResponses();
    if (!rows.length) return null;
    
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3); // Require 4+ char words
    
    // Skip pre-canned for document-specific queries (these go to RAG)
    const documentTopics = ['dog', 'pet', 'career', 'mapping', 'promotion', 'benefits', 'pto', 'vacation', 'holiday', 'maternity', 'paternity', 'leave', '401k', 'retirement'];
    if (documentTopics.some(topic => queryLower.includes(topic))) {
        console.log('📄 Document topic detected, skipping pre-canned');
        return null;
    }
    
    // Find matching rows (require stronger matches)
    const matches = rows.filter(row => {
        const rowText = row.join(' ').toLowerCase();
        // Require at least 2 meaningful words to match
        const matchCount = queryWords.filter(word => rowText.includes(word)).length;
        return matchCount >= 2;
    });
    
    if (matches.length > 0) {
        console.log(`📋 Found ${matches.length} pre-canned matches`);
        return matches;
    }
    return null;
}

// =============================================================================
// EMPLOYEE DIRECTORY: Department Aliases & Validation
// =============================================================================
const VALID_DEPARTMENTS = [
    'Leadership', 'People & Culture', 'Operations & Administration', 'Finance & Accounting',
    'IT', 'Business Affairs', 'New Business/Communications', 'Strategy & Planning',
    'Production', 'Account Management', 'Design', 'Creative', 'Project Management'
];

const DEPARTMENT_ALIASES = {
    'it': 'IT', 'tech': 'IT', 'technology': 'IT',
    'p&c': 'People & Culture', 'hr': 'People & Culture', 'people': 'People & Culture',
    'ops': 'Operations & Administration', 'admin': 'Operations & Administration',
    'finance': 'Finance & Accounting', 'accounting': 'Finance & Accounting',
    'strategy': 'Strategy & Planning', 'planning': 'Strategy & Planning',
    'biz affairs': 'Business Affairs', 'legal': 'Business Affairs',
    'new biz': 'New Business/Communications', 'comms': 'New Business/Communications',
    'acct': 'Account Management', 'account': 'Account Management',
    'pm': 'Project Management', 'project': 'Project Management'
};

function normalizeDepartmentName(query) {
    const normalized = query.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
    if (DEPARTMENT_ALIASES[normalized]) return DEPARTMENT_ALIASES[normalized];
    const match = VALID_DEPARTMENTS.find(dept => dept.toLowerCase() === normalized);
    return match || query;
}

// =============================================================================
// NAME MATCHING: Phonetic & Fuzzy Matching for Name Variants
// =============================================================================

/**
 * Soundex algorithm for phonetic matching
 * "Charley" and "Charlie" both produce the same code
 */
function soundex(name) {
    if (!name || typeof name !== 'string') return '';
    
    const s = name.toUpperCase().replace(/[^A-Z]/g, '');
    if (s.length === 0) return '';
    
    const codes = {
        'B': '1', 'F': '1', 'P': '1', 'V': '1',
        'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
        'D': '3', 'T': '3',
        'L': '4',
        'M': '5', 'N': '5',
        'R': '6'
    };
    
    let result = s[0];
    let prevCode = codes[s[0]] || '';
    
    for (let i = 1; i < s.length && result.length < 4; i++) {
        const code = codes[s[i]] || '';
        if (code && code !== prevCode) {
            result += code;
        }
        prevCode = code || prevCode;
    }
    
    return (result + '000').slice(0, 4);
}

/**
 * Common name variants mapping (covers typical spelling variations)
 */
const NAME_VARIANTS = {
    // Common spelling variations
    'charley': ['charlie', 'charly', 'charlee'],
    'charlie': ['charley', 'charly', 'charlee'],
    'kathy': ['cathy', 'kathie', 'cathie', 'kathleen'],
    'cathy': ['kathy', 'cathie', 'kathie', 'catherine'],
    'kathleen': ['kathy', 'cathy', 'kathie'],
    'chris': ['kris', 'cris'],
    'kris': ['chris', 'cris'],
    'steven': ['stephen', 'steve'],
    'stephen': ['steven', 'steve'],
    'mike': ['michael', 'mick', 'mikey'],
    'michael': ['mike', 'mick', 'mikey'],
    'jen': ['jennifer', 'jenn', 'jenny'],
    'jennifer': ['jen', 'jenn', 'jenny'],
    'jeff': ['geoffrey', 'jeffrey', 'geoff'],
    'geoffrey': ['jeff', 'jeffrey', 'geoff'],
    'bob': ['robert', 'bobby', 'rob'],
    'robert': ['bob', 'bobby', 'rob'],
    'bill': ['william', 'billy', 'will'],
    'william': ['bill', 'billy', 'will'],
    'dan': ['daniel', 'danny'],
    'daniel': ['dan', 'danny'],
    'tom': ['thomas', 'tommy'],
    'thomas': ['tom', 'tommy'],
    'kate': ['catherine', 'katie', 'katherine', 'katy'],
    'katie': ['kate', 'catherine', 'katherine', 'katy'],
    'liz': ['elizabeth', 'beth', 'lizzy', 'eliza'],
    'elizabeth': ['liz', 'beth', 'lizzy', 'eliza'],
    'jon': ['john', 'jonathan', 'johnny'],
    'john': ['jon', 'jonathan', 'johnny'],
    'alex': ['alexander', 'alexandra', 'al'],
    'jim': ['james', 'jimmy'],
    'james': ['jim', 'jimmy'],
    'nick': ['nicholas', 'nicky', 'nico'],
    'nicholas': ['nick', 'nicky', 'nico'],
    'matt': ['matthew', 'matty'],
    'matthew': ['matt', 'matty'],
    'sam': ['samuel', 'samantha', 'sammy'],
    'sue': ['susan', 'susie', 'suzanne'],
    'susan': ['sue', 'susie', 'suzanne'],
    'pat': ['patrick', 'patricia', 'patty'],
    'patrick': ['pat', 'paddy'],
    'tony': ['anthony', 'ant'],
    'anthony': ['tony', 'ant'],
    'andy': ['andrew', 'drew'],
    'andrew': ['andy', 'drew'],
    'helen': ['helena', 'ellen', 'ellie'],
    'helena': ['helen', 'ellen'],
    'sara': ['sarah'],
    'sarah': ['sara'],
    'anne': ['ann', 'anna', 'annie'],
    'ann': ['anne', 'anna', 'annie'],
    'joe': ['joseph', 'joey'],
    'joseph': ['joe', 'joey'],
    'ed': ['edward', 'eddie', 'ted'],
    'edward': ['ed', 'eddie', 'ted'],
    'rich': ['richard', 'rick', 'ricky', 'dick'],
    'richard': ['rich', 'rick', 'ricky', 'dick'],
    'greg': ['gregory'],
    'gregory': ['greg'],
    'phil': ['philip', 'phillip'],
    'philip': ['phil', 'phillip'],
    'becca': ['rebecca', 'becky'],
    'rebecca': ['becca', 'becky'],
    'meg': ['megan', 'meghan', 'meggie'],
    'megan': ['meg', 'meghan', 'meggie']
};

/**
 * Get all variant spellings for a name
 */
function getNameVariants(name) {
    const lower = name.toLowerCase();
    const variants = new Set([lower]);
    
    // Add explicit variants
    if (NAME_VARIANTS[lower]) {
        NAME_VARIANTS[lower].forEach(v => variants.add(v));
    }
    
    // Also check if the input matches any variant and add the primary name
    for (const [primary, alts] of Object.entries(NAME_VARIANTS)) {
        if (alts.includes(lower)) {
            variants.add(primary);
            alts.forEach(v => variants.add(v));
        }
    }
    
    return Array.from(variants);
}

/**
 * Check if two names are phonetically similar
 * Stricter matching to avoid false positives (Katie ≠ Kathy)
 */
function areNamesSimilar(name1, name2) {
    const n1 = name1.toLowerCase();
    const n2 = name2.toLowerCase();
    
    // Exact match
    if (n1 === n2) return true;
    
    // One contains the other (handles nicknames) - require 4+ char overlap
    if (n1.length >= 4 && n2.length >= 4) {
        if (n1.includes(n2) || n2.includes(n1)) return true;
    }
    
    // Explicit variants match (preferred over Soundex for accuracy)
    const variants1 = getNameVariants(n1);
    const variants2 = getNameVariants(n2);
    if (variants1.some(v => variants2.includes(v))) return true;
    
    // Soundex match - ONLY for longer names (5+ chars) to avoid false positives
    // Short names like Kate/Kathy have too many false matches with Soundex
    if (n1.length >= 5 && n2.length >= 5 && soundex(n1) === soundex(n2)) {
        return true;
    }
    
    return false;
}

// =============================================================================
// EMPLOYEE DIRECTORY: Search & Formatting
// =============================================================================
async function searchEmployeeDirectory(query) {
    console.log(`👥 Searching Employee Directory for: "${query}"`);
    let employeeObjects = [];

    try {
        const allEmployees = await getEmployees();
        if (allEmployees.length === 0) {
            console.log('⚠️ Employee collection is empty');
            return [];
        }
        
        console.log(`📊 Total employees: ${allEmployees.length}`);

        // Check if this is a department-only search (prefixed with "dept:")
        const isDeptOnlySearch = query.startsWith('dept:');
        const searchQuery = isDeptOnlySearch ? query.substring(5) : query;
        const queryLower = searchQuery.toLowerCase();
        
        // For department searches, match ONLY on department field
        if (isDeptOnlySearch) {
            console.log(`🎯 Department-only search: "${queryLower}"`);
            for (const emp of allEmployees) {
                const dept = (emp.Department || emp.department || '').toLowerCase();
                
                // Exact department match only
                if (dept === queryLower) {
                    employeeObjects.push({ ...emp, score: 100 });
                }
            }
            console.log(`✅ Found ${employeeObjects.length} employees in ${searchQuery}`);
            return employeeObjects.sort((a, b) => {
                // Sort by name within department
                const nameA = (a.Name || a.name || '').toLowerCase();
                const nameB = (b.Name || b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
        }
        
        // Regular search (names, titles, etc.)
        const normalizedDept = normalizeDepartmentName(queryLower).toLowerCase();
        const isFullDeptName = VALID_DEPARTMENTS.some(d => d.toLowerCase() === queryLower);
        
        // Get name variants for fuzzy matching (e.g., Charley -> Charlie)
        const queryVariants = getNameVariants(queryLower);
        const querySoundex = soundex(queryLower);
        console.log(`🔤 Name variants for "${queryLower}":`, queryVariants);

        for (const emp of allEmployees) {
            let score = 0;
            let matchReason = '';
            const name = (emp.Name || emp.name || '').toLowerCase();
            const dept = (emp.Department || emp.department || '').toLowerCase();
            const title = (emp.Title || emp.title || '').toLowerCase();
            const email = (emp.Email || emp.email || '').toLowerCase();
            const nameParts = name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts[nameParts.length - 1] || '';

            // Exact name match (highest priority)
            if (name === queryLower) {
                score += 100;
                matchReason = 'exact';
            }
            
            // Name contains search term (but require 3+ chars to avoid "it" matching)
            if (queryLower.length >= 3 && name.includes(queryLower)) {
                score += 50;
                matchReason = matchReason || 'contains';
            }
            
            // First or last name starts with query
            if (nameParts.some(part => part.startsWith(queryLower))) {
                score += 40;
                matchReason = matchReason || 'starts-with';
            }
            
            // PHONETIC MATCHING: Check if first name sounds like query
            // Only match if no exact/contains match found (score === 0)
            if (queryLower.length >= 3 && score === 0) {
                // Check against EXPLICIT name variants only (Charley/Charlie)
                // This is the most reliable matching - use NAME_VARIANTS dictionary
                if (queryVariants.length > 1) {  // Only if we have known variants
                    if (queryVariants.some(variant => firstName === variant)) {
                        score += 48;
                        matchReason = 'variant';
                    }
                    // Check if any employee name part matches a variant exactly
                    if (nameParts.some(part => queryVariants.includes(part))) {
                        score += 46;
                        matchReason = matchReason || 'variant-part';
                    }
                }
                
                // Soundex matching - ONLY for longer names (5+ chars) to avoid false positives
                // Katie/Kathy are too similar in Soundex but are different names
                if (score === 0 && queryLower.length >= 5 && firstName.length >= 5) {
                    if (querySoundex === soundex(firstName)) {
                        score += 35;  // Lower score for phonetic-only matches
                        matchReason = 'phonetic';
                    }
                }
            }
            
            // Department exact match (only if query looks like a department)
            if (isFullDeptName && dept === normalizedDept) score += 50;
            
            // Title match (require 3+ chars)
            if (queryLower.length >= 3 && title.includes(queryLower)) score += 20;
            
            // Email username match (require 3+ chars)
            if (queryLower.length >= 3) {
                const emailUser = email.split('@')[0];
                if (emailUser.includes(queryLower)) score += 15;
            }
            
            if (score > 0) {
                employeeObjects.push({ ...emp, score, matchReason });
            }
        }
        
        console.log(`✅ Found ${employeeObjects.length} matching employees`);
        
        // Log match reasons for debugging
        if (employeeObjects.length > 0) {
            console.log('📋 Match breakdown:', employeeObjects.map(e => 
                `${e.Name || e.name}: ${e.score} (${e.matchReason})`
            ).join(', '));
        }
        
        return employeeObjects.sort((a, b) => b.score - a.score);
    } catch (error) {
        console.error('❌ Employee search error:', error.message);
        return [];
    }
}

// Department context for richer responses
const DEPARTMENT_CONTEXT = {
    'IT': { emoji: '💻', description: 'Technology & Systems' },
    'Creative': { emoji: '🎨', description: 'Creative Development' },
    'Design': { emoji: '✏️', description: 'Visual & Brand Design' },
    'Production': { emoji: '🎬', description: 'Content Production' },
    'Finance & Accounting': { emoji: '📊', description: 'Financial Operations' },
    'People & Culture': { emoji: '💜', description: 'HR & Employee Experience' },
    'Strategy & Planning': { emoji: '🎯', description: 'Strategic Planning' },
    'Leadership': { emoji: '⭐', description: 'Executive Team' },
    'Operations & Administration': { emoji: '⚙️', description: 'Business Operations' },
    'Account Management': { emoji: '🤝', description: 'Client Partnerships' },
    'Project Management': { emoji: '📋', description: 'Project Delivery' },
    'Business Affairs': { emoji: '📜', description: 'Legal & Contracts' },
    'New Business/Communications': { emoji: '📣', description: 'Growth & Communications' }
};

function formatEmployeeResults(employees, searchTerm, startIndex = 0) {
    const PAGE_SIZE = 5;
    const totalCount = employees.length;
    const effectiveStart = startIndex === -1 ? 0 : startIndex; // -1 means show all
    const effectiveLimit = startIndex === -1 ? 50 : PAGE_SIZE;
    
    // Check if this was a department search
    const isDeptSearch = searchTerm && searchTerm.startsWith('dept:');
    const displayTerm = isDeptSearch ? searchTerm.substring(5) : searchTerm;
    
    // Build a conversational introduction
    let text = '';
    
    if (isDeptSearch) {
        // Department search - add context
        const deptInfo = DEPARTMENT_CONTEXT[displayTerm] || { emoji: '👥', description: '' };
        if (totalCount === 1) {
            text = `${deptInfo.emoji} There's *1 person* in the *${displayTerm}* team`;
        } else {
            text = `${deptInfo.emoji} The *${displayTerm}* team has *${totalCount} people*`;
        }
        if (deptInfo.description) {
            text += ` _(${deptInfo.description})_`;
        }
        text += `:\n\n`;
    } else if (totalCount === 1) {
        // Single person found - more conversational
        const person = employees[0];
        const name = person.Name || person.name;
        text = `✅ I found *${name}*! Here's their info:\n\n`;
    } else if (displayTerm) {
        // Multiple results for name/term search
        text = `👥 I found *${totalCount} people* with names similar to "${displayTerm}":\n\n`;
    } else {
        text = `👥 Here are *${totalCount} employees*:\n\n`;
    }
    
    const displayList = employees.slice(effectiveStart, effectiveStart + effectiveLimit);
    
    displayList.forEach((emp, index) => {
        const num = effectiveStart + index + 1;
        const name = emp.Name || emp.name || 'Unknown';
        const title = emp.Title || emp.title || '-';
        const dept = emp.Department || emp.department || '-';
        const email = emp.Email || emp.email || '-';
        const slideLink = emp.Slide_Link || emp.slide_link;
        const deptInfo = DEPARTMENT_CONTEXT[dept] || { emoji: '👤' };
        
        if (totalCount === 1) {
            // Single result - more detailed format
            text += `*${name}*\n`;
            text += `📌 ${title}\n`;
            text += `🏢 ${dept}\n`;
            text += `📧 <mailto:${email}|${email}>`;
            if (slideLink) text += `\n🔗 <${slideLink}|View Full Profile>`;
            text += '\n';
        } else {
            // Multiple results - compact list format
            text += `${num}. *${name}*\n`;
            text += `    ${title} | ${dept}\n`;
            text += `    📧 <mailto:${email}|${email}>`;
            if (slideLink) text += ` · <${slideLink}|Profile>`;
            text += '\n\n';
        }
    });
    
    const nextStart = effectiveStart + effectiveLimit;
    const remaining = Math.max(0, totalCount - nextStart);
    
    // Check if we need pagination buttons
    const needsPagination = remaining > 0 && startIndex !== -1;
    
    // Add directory link for non-paginated results (all results shown)
    if (!needsPagination) {
        text += `\n📋 <${CONFIG.baseUrl}/directory|View Full Employee Directory>`;
    }
    
    // Add helpful tip for single results
    if (totalCount === 1) {
        text += `\n\n_Need to find others? Try "Who's in ${employees[0].Department || employees[0].department}?" or search by role._`;
    }
    
    // Build blocks array (AFTER all text modifications)
    const blocks = [{ type: 'section', text: { type: 'mrkdwn', text } }];
    
    // Add pagination buttons if there are more results
    if (needsPagination) {
        const elements = [
            {
                type: 'button',
                text: { type: 'plain_text', text: `Show Next ${Math.min(PAGE_SIZE, remaining)} (${remaining} more)`, emoji: true },
                value: JSON.stringify({ term: searchTerm, start: nextStart }),
                action_id: 'show_more_employees'
            }
        ];
        
        // Add "Show All" button if total is manageable
        if (totalCount <= 50 && totalCount > PAGE_SIZE) {
            elements.push({
                type: 'button',
                text: { type: 'plain_text', text: '📋 Show Full List', emoji: true },
                value: JSON.stringify({ term: searchTerm, start: -1 }),
                action_id: 'show_full_employee_list'
            });
        }
        
        blocks.push({ type: 'actions', elements });
    }
    
    return { text, blocks };
}

function formatNoEmployeeResultsMessage(searchTerm) {
    // Clean up internal prefixes for display
    const displayTerm = searchTerm.startsWith('dept:') ? searchTerm.substring(5) : searchTerm;
    const isDeptSearch = searchTerm.startsWith('dept:');
    
    let response = `🔍 I couldn't find any employees matching "${displayTerm}".\n\n`;
    
    if (isDeptSearch) {
        // Department search with no results - suggest valid departments
        response += `*Available departments to search:*\n`;
        response += `• IT, Creative, Design, Production\n`;
        response += `• Finance & Accounting, Strategy & Planning\n`;
        response += `• People & Culture, Operations, Leadership\n`;
        response += `• Account Management, Project Management\n\n`;
        response += `_Tip: Try "Who works in Creative?" or "Show me the IT team"_`;
    } else {
        // Name search with no results - offer alternatives
        response += `*Here are some things to try:*\n`;
        response += `• Check the spelling of the name\n`;
        response += `• Try just the first name or last name\n`;
        response += `• Search by department (e.g., "Who's in IT?")\n`;
        response += `• Search by role (e.g., "designers" or "producers")\n\n`;
        response += `📋 <${CONFIG.baseUrl}/directory|View Full Employee Directory>\n\n`;
        response += `_Need help finding someone specific? Contact us at ${CONFIG.supportEmail}_`;
    }
    
    return response;
}

// =============================================================================
// EMPLOYEE DIRECTORY: Yes/No Questions (Smart Query Reasoning)
// =============================================================================
function isYesNoEmployeeQuestion(text) {
    const lower = text.toLowerCase();
    // Patterns like "Is X in Y?", "Does X work in Y?", "Am I in Y?"
    const patterns = [
        /\bis\s+(\w+)\s+(?:in|on|part of|a member of)\s+/i,
        /\bdoes\s+(\w+)\s+work\s+(?:in|on|for|with)\s+/i,
        /\bam\s+i\s+(?:in|on|part of)\s+/i,
        /\bare\s+(?:they|we)\s+(?:in|on|part of)\s+/i,
        /\bis\s+(\w+)\s+(?:a|an)\s+\w+\s*\?/i  // "Is X a designer?"
    ];
    return patterns.some(p => p.test(lower));
}

function extractYesNoQueryParts(text) {
    const lower = text.toLowerCase();
    
    // Pattern: "Is [Person] in [Department]?"
    let match = lower.match(/\bis\s+(\w+)\s+(?:in|on|part of)\s+(.+?)[\?]?$/i);
    if (match) {
        return { person: match[1], department: match[2].trim().replace(/[?.,!]/g, '') };
    }
    
    // Pattern: "Does [Person] work in [Department]?"
    match = lower.match(/\bdoes\s+(\w+)\s+work\s+(?:in|on|for|with)\s+(.+?)[\?]?$/i);
    if (match) {
        return { person: match[1], department: match[2].trim().replace(/[?.,!]/g, '') };
    }
    
    // Pattern: "Is [Person] a [Title]?"
    match = lower.match(/\bis\s+(\w+)\s+(?:a|an)\s+(.+?)[\?]?$/i);
    if (match) {
        return { person: match[1], role: match[2].trim().replace(/[?.,!]/g, '') };
    }
    
    return null;
}

async function handleYesNoEmployeeQuestion(text, channel, threadTs) {
    const parts = extractYesNoQueryParts(text);
    if (!parts) return false;
    
    console.log('🤔 Yes/No question detected:', parts);
    
    // Search for the person
    const allMatches = await searchEmployeeDirectory(parts.person);
    
    // Filter out low-confidence matches (phonetic-only with score < 40)
    // This prevents Kathy returning Katie (Soundex false positive)
    const employees = allMatches.filter(emp => emp.score >= 40);
    console.log(`📊 Filtered ${allMatches.length} → ${employees.length} high-confidence matches`);
    
    if (employees.length === 0) {
        // Enhanced "not found" response with variant suggestions
        const variants = getNameVariants(parts.person);
        let response = `🔍 I couldn't find anyone named *"${parts.person}"* in the employee directory.\n\n`;
        response += `*Suggestions:*\n`;
        response += `• Check the spelling of the name\n`;
        if (variants.length > 1) {
            response += `• Try alternate spellings: ${variants.filter(v => v !== parts.person.toLowerCase()).slice(0, 3).join(', ')}\n`;
        }
        response += `• Try searching with just the first or last name\n`;
        response += `• Browse by department: "Who's in Creative?"\n\n`;
        response += `📋 <${CONFIG.baseUrl}/directory|View Full Employee Directory>`;
        
        await sendSlackMessage(channel, response, threadTs, true);
        return true;
    }
    
    let response = '';
    
    // Check if we have multiple people with similar names
    const hasMultipleMatches = employees.length > 1;
    
    if (hasMultipleMatches) {
        // MULTIPLE MATCHES: Show all employees with that name
        console.log(`👥 Multiple matches found (${employees.length}) for "${parts.person}"`);
        
        if (parts.department) {
            // Question about department - show all and indicate who's in that dept
            const queriedDept = normalizeDepartmentName(parts.department).toLowerCase();
            const inDept = [];
            const notInDept = [];
            
            for (const emp of employees) {
                const empDept = (emp.Department || emp.department || '').toLowerCase();
                const normalizedEmpDept = normalizeDepartmentName(empDept).toLowerCase();
                if (normalizedEmpDept === queriedDept || empDept.includes(queriedDept) || queriedDept.includes(empDept)) {
                    inDept.push(emp);
                } else {
                    notInDept.push(emp);
                }
            }
            
            response = `👥 I found *${employees.length} people* with names similar to "${parts.person}":\n\n`;
            
            if (inDept.length > 0) {
                response += `✅ *In ${parts.department}:*\n`;
                for (const emp of inDept) {
                    const name = emp.Name || emp.name;
                    const title = emp.Title || emp.title || '';
                    const dept = emp.Department || emp.department || '';
                    const email = emp.Email || emp.email || '';
                    const slideLink = emp.Slide_Link || emp.slide_link;
                    const deptInfo = DEPARTMENT_CONTEXT[dept] || { emoji: '👤' };
                    
                    response += `\n• *${name}*\n`;
                    response += `  📌 ${title}\n`;
                    response += `  ${deptInfo.emoji} ${dept}\n`;
                    response += `  📧 <mailto:${email}|${email}>`;
                    if (slideLink) response += ` · <${slideLink}|Profile>`;
                    response += '\n';
                }
            }
            
            if (notInDept.length > 0) {
                response += `\n🔸 *Not in ${parts.department}:*\n`;
                for (const emp of notInDept) {
                    const name = emp.Name || emp.name;
                    const title = emp.Title || emp.title || '';
                    const dept = emp.Department || emp.department || '';
                    const email = emp.Email || emp.email || '';
                    const slideLink = emp.Slide_Link || emp.slide_link;
                    const deptInfo = DEPARTMENT_CONTEXT[dept] || { emoji: '👤' };
                    
                    response += `\n• *${name}*\n`;
                    response += `  📌 ${title}\n`;
                    response += `  ${deptInfo.emoji} ${dept} _(not ${parts.department})_\n`;
                    response += `  📧 <mailto:${email}|${email}>`;
                    if (slideLink) response += ` · <${slideLink}|Profile>`;
                    response += '\n';
                }
            }
            
        } else if (parts.role) {
            // Question about role - show all and indicate who has that role
            const queriedRole = parts.role.toLowerCase();
            const hasRole = [];
            const notHasRole = [];
            
            for (const emp of employees) {
                const empTitle = (emp.Title || emp.title || '').toLowerCase();
                if (empTitle.includes(queriedRole) || queriedRole.includes(empTitle.split(' ')[0])) {
                    hasRole.push(emp);
                } else {
                    notHasRole.push(emp);
                }
            }
            
            response = `👥 I found *${employees.length} people* with names similar to "${parts.person}":\n\n`;
            
            if (hasRole.length > 0) {
                response += `✅ *Who are ${parts.role}s:*\n`;
                for (const emp of hasRole) {
                    const name = emp.Name || emp.name;
                    const title = emp.Title || emp.title || '';
                    const dept = emp.Department || emp.department || '';
                    const email = emp.Email || emp.email || '';
                    const slideLink = emp.Slide_Link || emp.slide_link;
                    const deptInfo = DEPARTMENT_CONTEXT[dept] || { emoji: '👤' };
                    
                    response += `\n• *${name}*\n`;
                    response += `  📌 ${title}\n`;
                    response += `  ${deptInfo.emoji} ${dept}\n`;
                    response += `  📧 <mailto:${email}|${email}>`;
                    if (slideLink) response += ` · <${slideLink}|Profile>`;
                    response += '\n';
                }
            }
            
            if (notHasRole.length > 0) {
                response += `\n🔸 *Who are NOT ${parts.role}s:*\n`;
                for (const emp of notHasRole) {
                    const name = emp.Name || emp.name;
                    const title = emp.Title || emp.title || '';
                    const dept = emp.Department || emp.department || '';
                    const email = emp.Email || emp.email || '';
                    const slideLink = emp.Slide_Link || emp.slide_link;
                    const deptInfo = DEPARTMENT_CONTEXT[dept] || { emoji: '👤' };
                    
                    response += `\n• *${name}*\n`;
                    response += `  📌 ${title} _(not ${parts.role})_\n`;
                    response += `  ${deptInfo.emoji} ${dept}\n`;
                    response += `  📧 <mailto:${email}|${email}>`;
                    if (slideLink) response += ` · <${slideLink}|Profile>`;
                    response += '\n';
                }
            }
        } else {
            // Just asking about the person - show all matches
            response = `👥 I found *${employees.length} people* with names similar to "${parts.person}":\n\n`;
            for (const emp of employees) {
                const name = emp.Name || emp.name;
                const title = emp.Title || emp.title || '';
                const dept = emp.Department || emp.department || '';
                const email = emp.Email || emp.email || '';
                const slideLink = emp.Slide_Link || emp.slide_link;
                const deptInfo = DEPARTMENT_CONTEXT[dept] || { emoji: '👤' };
                
                response += `• *${name}*\n`;
                response += `  📌 ${title}\n`;
                response += `  ${deptInfo.emoji} ${dept}\n`;
                response += `  📧 <mailto:${email}|${email}>`;
                if (slideLink) response += ` · <${slideLink}|Profile>`;
                response += '\n\n';
            }
        }
        
    } else {
        // SINGLE MATCH: Original behavior
        const person = employees[0];
        const personName = person.Name || person.name || 'Unknown';
        const personDept = person.Department || person.department || '';
        const personDeptLower = personDept.toLowerCase();
        const personTitle = person.Title || person.title || '';
        const personTitleLower = personTitle.toLowerCase();
        const personEmail = person.Email || person.email || '';
        const slideLink = person.Slide_Link || person.slide_link;
        const deptInfo = DEPARTMENT_CONTEXT[personDept] || { emoji: '👤', description: '' };
        
        if (parts.department) {
            // Check department membership
            const queriedDept = normalizeDepartmentName(parts.department).toLowerCase();
            const actualDept = normalizeDepartmentName(personDeptLower).toLowerCase();
            
            if (actualDept === queriedDept || personDeptLower.includes(queriedDept) || queriedDept.includes(personDeptLower)) {
                // YES - they are in that department
                response = `✅ *Yes!* ${personName} is part of the *${personDept}* team.\n\n`;
                response += `*${personName}'s Details:*\n`;
                response += `📌 ${personTitle}\n`;
                response += `${deptInfo.emoji} ${personDept}`;
                if (deptInfo.description) response += ` _(${deptInfo.description})_`;
                response += `\n📧 <mailto:${personEmail}|${personEmail}>`;
                if (slideLink) response += `\n🔗 <${slideLink}|View Full Profile>`;
            } else {
                // NO - they are in a different department
                const actualDeptInfo = DEPARTMENT_CONTEXT[personDept] || { emoji: '👤' };
                response = `🤔 *Hmm*, ${personName} is not in ${parts.department}.\n\n`;
                response += `*Here's where ${personName} actually works:*\n`;
                response += `📌 ${personTitle}\n`;
                response += `${actualDeptInfo.emoji} *${personDept}*`;
                if (actualDeptInfo.description) response += ` _(${actualDeptInfo.description})_`;
                response += `\n📧 <mailto:${personEmail}|${personEmail}>`;
                if (slideLink) response += `\n🔗 <${slideLink}|View Full Profile>`;
                response += `\n\n_Want to see who IS in ${parts.department}? Ask "Who works in ${parts.department}?"_`;
            }
        } else if (parts.role) {
            // Check role/title
            const queriedRole = parts.role.toLowerCase();
            if (personTitleLower.includes(queriedRole) || queriedRole.includes(personTitleLower.split(' ')[0])) {
                // YES - that is their role
                response = `✅ *Yes!* ${personName} is a *${personTitle}*.\n\n`;
                response += `*${personName}'s Details:*\n`;
                response += `📌 ${personTitle}\n`;
                response += `${deptInfo.emoji} ${personDept}`;
                if (deptInfo.description) response += ` _(${deptInfo.description})_`;
                response += `\n📧 <mailto:${personEmail}|${personEmail}>`;
                if (slideLink) response += `\n🔗 <${slideLink}|View Full Profile>`;
            } else {
                // NO - that's not their role
                response = `🤔 *Hmm*, ${personName} is not a ${parts.role}.\n\n`;
                response += `*Here's ${personName}'s actual role:*\n`;
                response += `📌 *${personTitle}*\n`;
                response += `${deptInfo.emoji} ${personDept}`;
                if (deptInfo.description) response += ` _(${deptInfo.description})_`;
                response += `\n📧 <mailto:${personEmail}|${personEmail}>`;
                if (slideLink) response += `\n🔗 <${slideLink}|View Full Profile>`;
                response += `\n\n_Looking for ${parts.role}s? Try searching "show me ${parts.role}s" or "who is a ${parts.role}"_`;
            }
        }
    }
    
    // Always add directory link to Yes/No responses
    response += `\n\n📋 <${CONFIG.baseUrl}/directory|View Full Employee Directory>`;
    
    await sendSlackMessage(channel, response, threadTs, true);
    return true;
}

// =============================================================================
// EMPLOYEE DIRECTORY: Analytical Queries (counts, lists)
// =============================================================================
function isAnalyticalEmployeeQuery(text) {
    const patterns = ['how many', 'count', 'list all', 'number of', 'total'];
    return patterns.some(p => text.toLowerCase().includes(p));
}

async function generateEmployeeAnalysisResponse(query, employees) {
    try {
        // Build department summary
        const deptCounts = {};
        employees.forEach(e => {
            const dept = e.Department || e.department || 'Unknown';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        
        const deptSummary = Object.entries(deptCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([dept, count]) => `${dept}: ${count}`)
            .join('\n');
        
        const context = employees.map(e => {
            const name = e.Name || e.name || 'Unknown';
            const title = e.Title || e.title || '-';
            const dept = e.Department || e.department || '-';
            return `${name} (${title}, ${dept})`;
        }).join('\n');
        
        const prompt = `You are ${CONFIG.appName}, the friendly HR assistant for ${CONFIG.organizationName}.
Answer this employee directory question in a warm, conversational way: "${query}"

Employee Data (${employees.length} total employees):
${context}

Department Summary:
${deptSummary}

Tone & Style:
- Be warm and friendly - like a helpful colleague
- Start with a VARIED, brief acknowledgment. IMPORTANT: Mix up your openers - don't always say "Great question!" Use variety like:
  • "Happy to help!" / "I can answer that!" / "Let me check..."
  • "Sure thing!" / "Absolutely!" / "Of course!"
  • "Here's what I found..." / "Looking at the directory..."
- Use appropriate emoji to add warmth: 👋 for greetings, 👍 for confirmations, ✨ for highlights
- Use Slack mrkdwn formatting: *bold* for emphasis, bullet points with •
- Include specific numbers and names when relevant
- Keep the response concise but helpful
- If listing people, format nicely with their titles
- End with a friendly note or offer to help find more info`;
        
        const result = await geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        
        let response = result.response.candidates[0].content.parts[0].text;
        
        // Add directory link at the end
        response += `\n\n📋 <${CONFIG.baseUrl}/directory|View Full Employee Directory>`;
        
        return convertMarkdownToSlack(response);
    } catch (error) {
        console.error('❌ Analysis error:', error.message);
        return "I encountered an error analyzing the employee data. Please try rephrasing your question or ask something like \"Who works in IT?\"";
    }
}

function extractEmployeeSearchTerms(query) {
    // Clean up Slack formatting artifacts (bullets, special chars)
    let cleaned = query
        .replace(/[•·‣⁃▪▸►◦●○]/g, '') // Remove bullet points
        .replace(/<[^>]+>/g, '')        // Remove Slack user mentions
        .replace(/[""'']/g, '')         // Remove smart quotes
        .trim();
    
    const lower = cleaned.toLowerCase();
    
    // First, check if this is a department search
    const deptMatch = extractDepartmentFromQuery(lower);
    if (deptMatch) {
        console.log(`🏢 Detected department query: ${deptMatch}`);
        return `dept:${deptMatch}`;  // Prefix to indicate department-only search
    }
    
    // Otherwise, extract name/title search terms
    return lower
        .replace(/\b(who|what|where|how|is|are|the|a|an|show|me|find|search|for|in|at|works|working|team|department|people|email|contact|phone)\b/gi, '')
        .replace(/[?.,!]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractDepartmentFromQuery(query) {
    const lower = query.toLowerCase();
    
    // Check for department mentions (with aliases)
    const deptMappings = {
        'it': 'IT', 'tech': 'IT', 'technology': 'IT',
        'hr': 'People & Culture', 'p&c': 'People & Culture', 'people & culture': 'People & Culture', 'people and culture': 'People & Culture',
        'creative': 'Creative',
        'design': 'Design',
        'production': 'Production',
        'finance': 'Finance & Accounting', 'accounting': 'Finance & Accounting',
        'leadership': 'Leadership',
        'operations': 'Operations & Administration', 'admin': 'Operations & Administration',
        'strategy': 'Strategy & Planning', 'planning': 'Strategy & Planning',
        'legal': 'Business Affairs', 'business affairs': 'Business Affairs',
        'account management': 'Account Management',
        'project management': 'Project Management', 'pm': 'Project Management'
    };
    
    // Check for explicit department patterns first
    for (const [alias, fullName] of Object.entries(deptMappings)) {
        // Use word boundary for short aliases like 'it', 'hr', 'pm'
        if (alias.length <= 3) {
            const regex = new RegExp(`\\b${alias}\\b`, 'i');
            if (regex.test(lower)) return fullName;
        } else {
            if (lower.includes(alias)) return fullName;
        }
    }
    
    return null;
}

// =============================================================================
// SLACK: Convert Markdown to Slack mrkdwn format
// =============================================================================
function convertMarkdownToSlack(text) {
    return text
        // Convert **bold** to *bold*
        .replace(/\*\*([^*]+)\*\*/g, '*$1*')
        // Convert __bold__ to *bold*
        .replace(/__([^_]+)__/g, '*$1*')
        // Convert _italic_ to _italic_ (same, but ensure single underscore)
        // Convert bullet lists: "* item" or "- item" to "• item"
        .replace(/^[\*\-]\s+/gm, '• ')
        // Convert numbered markdown lists with asterisks
        .replace(/^\d+\.\s+\*\*([^*]+)\*\*/gm, '• *$1*')
        // Clean up any triple asterisks from nested bold
        .replace(/\*\*\*/g, '*')
        // Remove excessive newlines
        .replace(/\n{3,}/g, '\n\n');
}

// =============================================================================
// 🔧 TEMPLATE CONFIG: PROCESS MAPPINGS
// Maps mid-process/life-event queries to relevant PDFs
// CUSTOMIZE: Replace with your own regex patterns and document paths
// See docs/TEMPLATE_SETUP.md for details
// =============================================================================
const PROCESS_MAPPINGS = {
    // Life events - child-related (post-birth questions)
    'baby|newborn|child|kid|dependent': [
        '01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf',
        '01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf'
    ],
    'add.*insurance|enroll.*insurance|enrollment': [
        '01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf',
        '01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf'
    ],
    'add.*dependent|new.*dependent|family.*coverage': [
        '01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf',
        '01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf'
    ],
    
    // Retirement/financial processes
    '401k|401\\(k\\)|retirement.*match|matching.*contribution': [
        '01_Benefits/JL Retirement Plan Highlights.pdf',
        '01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf',
        '01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf'
    ],
    'how.*(?:do|can).*(?:get|start|sign up|enroll).*401': [
        '01_Benefits/JL Retirement Plan Highlights.pdf'
    ],
    
    // Health/medical processes
    'health.*insurance|medical.*insurance|dental|vision|hsa|fsa': [
        '01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf',
        '01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf'
    ],
    'open.*enrollment|benefits.*enrollment': [
        '01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf',
        '01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf'
    ],
    
    // Life change triggers
    'just.*(?:had|got|have).*(?:baby|married|divorced)': [
        '01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf',
        '01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf'
    ],
    'qualifying.*(?:life)?.*event|life.*change': [
        '01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf',
        '01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf'
    ],
    
    // NEW: Mental health & EAP (Employee Assistance Program) - Provider: BHS, 8 sessions/person/issue/year
    'eap|employee.*assistance|counseling|mental.*health|therapist|therapy|stress|anxiety|crisis|support.*program|feeling.*down|depressed|overwhelm|burnout|relationship.*issue|life.*transition|need.*talk|someone.*talk': [
        '05_Company_Policies/EAP.pdf'
    ],
    
    // NEW: Performance reviews (ADP, March/September cycles, salary reviews separate)
    'performance.*review|review.*process|evaluation|feedback.*session|manager.*review|annual.*review|360.*review|when.*review|how.*review.*work|salary.*review|get.*raise|pay.*increase|informal.*check|self.*assessment': [
        '05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'
    ],
    
    // NEW: Wellness & gym benefits
    'gym|fitness|wellness|workout|wellhub|gympass|exercise': [
        '01_Benefits/Wellhub Wellness Benefit.pdf'
    ],
    
    // NEW: JL Experience - 5-year work anniversary milestone reimbursement
    'jl.*experience|work.*anniversary|anniversary.*milestone|5.*year.*anniversary|five.*year': [
        '05_Company_Policies/JL Experience.pdf'
    ]
};

// =============================================================================
// 🔧 TEMPLATE CONFIG: DOCUMENT CATALOG
// Maps keywords to relevant PDFs in your GCS bucket
// CUSTOMIZE: Replace with your own keyword → document mappings
// See docs/TEMPLATE_SETUP.md for details
// =============================================================================
const DOCUMENT_CATALOG = {
    // Benefits - include both 2025 and 2026 (year-aware logic will filter)
    'benefits': [
        '01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf',
        '01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf'
    ],
    '2026 benefits': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    '2025 benefits': ['01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf'],
    // Medical plans (Cigna)
    'medical': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'cigna': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'ppo': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'pos': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'epo': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'hra': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'deductible': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'copay': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'coinsurance': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'out of pocket': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    // Dental & Vision
    'dental': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'vision': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'eye exam': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    // FSA
    'fsa': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'flexible spending': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'healthcare fsa': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'dependent care': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    // Commuter
    'commuter': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'transit': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'parking': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    // Life & Disability
    'life insurance': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'disability': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'short term disability': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'long term disability': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'ad&d': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    // Pet insurance
    'pet insurance': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    // Eligibility & enrollment
    'eligibility': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'qualifying life event': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'open enrollment': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'annual enrollment': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'dependents': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'domestic partner': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'spouse': ['01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf'],
    'retirement': ['01_Benefits/JL Retirement Plan Highlights.pdf'],
    '401k': ['01_Benefits/JL Retirement Plan Highlights.pdf'],
    'maternity': ['02_Leave_Policies/JL Maternity Policy 2025 (1).pdf'],
    'paternity': ['02_Leave_Policies/JL Paternity Policy 2025 (1).pdf'],
    'adoption': ['02_Leave_Policies/JL Adoption & Foster Child Leave Policy 2025.pdf'],
    'foster': ['02_Leave_Policies/JL Adoption & Foster Child Leave Policy 2025.pdf'],
    'parental': [
        '02_Leave_Policies/JL Maternity Policy 2025 (1).pdf',
        '02_Leave_Policies/JL Paternity Policy 2025 (1).pdf'
    ],
    'leave': [
        '02_Leave_Policies/JL Maternity Policy 2025 (1).pdf',
        '02_Leave_Policies/JL Paternity Policy 2025 (1).pdf',
        '02_Leave_Policies/JL Adoption & Foster Child Leave Policy 2025.pdf'
    ],
    'pto': ['05_Company_Policies/Johannes Leonardo PTO Process.pdf'],
    'vacation': ['05_Company_Policies/Johannes Leonardo PTO Process.pdf'],
    'time off': ['05_Company_Policies/Johannes Leonardo PTO Process.pdf'],
    // Holidays - include both 2025 and 2026 (NOT referral calendar - that's primarily referral doc)
    'holiday': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'holidays': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    '2026 holiday': ['06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf'],
    '2026 holidays': ['06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf'],
    '2025 holiday': ['06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'],
    '2025 holidays': ['06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'],
    // Specific holidays (route to both years, year filter will pick correct one)
    'mlk': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'martin luther king': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'presidents day': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'memorial day': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'juneteenth': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'independence day': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'july 4': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    '4th of july': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'labor day': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'indigenous peoples day': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'columbus day': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'thanksgiving': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'christmas': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'new year': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    // Shutdown periods
    'summer shutdown': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'winter shutdown': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'winter holiday': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'office closed': [
        '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',
        '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'
    ],
    'summer': ['06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'],
    'friday': ['06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf'],
    'referral': ['05_Company_Policies/employee referal and holiday Calendar.pdf'],
    'refer': ['05_Company_Policies/employee referal and holiday Calendar.pdf'],
    // Career & development (Dec 4, 2025)
    'career': ['05_Company_Policies/CAREER MAPPING 2025.pdf'],
    'career mapping': ['05_Company_Policies/CAREER MAPPING 2025.pdf'],
    'promotion': ['05_Company_Policies/CAREER MAPPING 2025.pdf'],
    'growth': ['05_Company_Policies/CAREER MAPPING 2025.pdf'],
    'development': ['05_Company_Policies/CAREER MAPPING 2025.pdf'],
    'dog': ['05_Company_Policies/Office Dog Policy_ Dos & Don\'ts.pdf'],
    'dogs': ['05_Company_Policies/Office Dog Policy_ Dos & Don\'ts.pdf'],
    'pet': ['05_Company_Policies/Office Dog Policy_ Dos & Don\'ts.pdf'],
    'pets': ['05_Company_Policies/Office Dog Policy_ Dos & Don\'ts.pdf'],
    'office dog': ['05_Company_Policies/Office Dog Policy_ Dos & Don\'ts.pdf'],
    // NEW DOCUMENTS - Dec 12, 2025 (2026 data)
    // EAP - Employee Assistance Program (Provider: BHS, Portal: portal.bhsonline.com)
    'eap': ['05_Company_Policies/EAP.pdf'],
    'employee assistance': ['05_Company_Policies/EAP.pdf'],
    'bhs': ['05_Company_Policies/EAP.pdf'],
    'counseling': ['05_Company_Policies/EAP.pdf'],
    'mental health': ['05_Company_Policies/EAP.pdf'],
    'therapist': ['05_Company_Policies/EAP.pdf'],
    'therapy': ['05_Company_Policies/EAP.pdf'],
    'stress': ['05_Company_Policies/EAP.pdf'],
    'anxiety': ['05_Company_Policies/EAP.pdf'],
    'crisis': ['05_Company_Policies/EAP.pdf'],
    'depression': ['05_Company_Policies/EAP.pdf'],
    'relationship': ['05_Company_Policies/EAP.pdf'],
    'relationships': ['05_Company_Policies/EAP.pdf'],
    'life transition': ['05_Company_Policies/EAP.pdf'],
    'childcare': ['05_Company_Policies/EAP.pdf'],
    'eldercare': ['05_Company_Policies/EAP.pdf'],
    'legal guidance': ['05_Company_Policies/EAP.pdf'],
    'financial assistance': ['05_Company_Policies/EAP.pdf'],
    'confidential support': ['05_Company_Policies/EAP.pdf'],
    'household member': ['05_Company_Policies/EAP.pdf'],
    // Performance Reviews (ADP system, March/September cycles, separate from salary reviews)
    'performance': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'performance review': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'review process': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'evaluation': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'annual review': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'feedback session': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'formal review': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'informal review': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'informal check-in': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'check-in': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'adp': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'self-assessment': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'self assessment': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'march cycle': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'september cycle': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'salary review': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'salary increase': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'pay increase': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'raise': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    'compensation review': ['05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf'],
    // Wellhub - Gym & Wellness (signup: wellhub.com, full-time + family eligible)
    'wellhub': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'gym': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'fitness': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'wellness': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'workout': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'exercise': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'gympass': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    // Specific activities
    'yoga': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'pilates': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'cycling': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'boxing': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'hiit': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'spin class': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    // Digital wellness
    'virtual class': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'on-demand': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'meditation': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'mindfulness': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    // Additional services
    'personal training': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'personal trainer': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'nutrition': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'massage': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    'physical therapy': ['01_Benefits/Wellhub Wellness Benefit.pdf'],
    // JL Experience - NOTE: This is for 5-year work anniversary milestones, NOT general team activities
    'jl experience': ['05_Company_Policies/JL Experience.pdf'],
    'work anniversary': ['05_Company_Policies/JL Experience.pdf'],
    'anniversary milestone': ['05_Company_Policies/JL Experience.pdf'],
    '5 year': ['05_Company_Policies/JL Experience.pdf'],
    'five year': ['05_Company_Policies/JL Experience.pdf'],
    'milestone': ['05_Company_Policies/JL Experience.pdf']
};

// =============================================================================
// 🔧 TEMPLATE CONFIG: ALL PDFs
// Complete list of PDF paths in your GCS bucket
// CUSTOMIZE: Replace with all your document paths
// See docs/TEMPLATE_SETUP.md for details
// =============================================================================
const ALL_PDFS = [
    // Benefits (2025 & 2026)
    '01_Benefits/JL Retirement Plan Highlights.pdf',
    '01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf',
    '01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf',          // Added Dec 12, 2025
    '01_Benefits/Wellhub Wellness Benefit.pdf',                       // Added Dec 12, 2025
    // Leave Policies
    '02_Leave_Policies/JL Adoption & Foster Child Leave Policy 2025.pdf',
    '02_Leave_Policies/JL Maternity Policy 2025 (1).pdf',
    '02_Leave_Policies/JL Paternity Policy 2025 (1).pdf',
    // Company Policies
    '05_Company_Policies/Johannes Leonardo PTO Process.pdf',
    '05_Company_Policies/employee referal and holiday Calendar.pdf',
    '05_Company_Policies/CAREER MAPPING 2025.pdf',                    // Added Dec 4, 2025
    '05_Company_Policies/Office Dog Policy_ Dos & Don\'ts.pdf',       // Added Dec 4, 2025
    '05_Company_Policies/EAP.pdf',                                    // Added Dec 12, 2025
    '05_Company_Policies/Performance Review Process_ Formal and Informal Reviews.pdf', // Added Dec 12, 2025
    '05_Company_Policies/JL Experience.pdf',                          // Added Dec 12, 2025
    // Time Off & Holidays (2025 & 2026)
    '06_Time_Off_and_Holidays/2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf',
    '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf',          // Added Dec 12, 2025
    // Misc
    '07_Misc_PandC_Additions/People & Culture: MIsc.pdf'
];

// =============================================================================
// RAG: Document Selection with Year-Aware Logic
// =============================================================================

// Detect which year the query is asking about
function detectQueryYear(query) {
    const queryLower = query.toLowerCase();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11
    
    // Check for range queries that span years ("until end of 2026", "through 2026", "rest of 2025 and 2026")
    const rangePatterns = /until.*2026|through.*2026|rest of.*2026|from now.*2026|between.*2025.*2026|2025.*and.*2026|2025.*through.*2026/i;
    if (rangePatterns.test(queryLower)) {
        console.log('📅 Date range query detected - including both years');
        return 'both';
    }
    
    // Explicit single year mentions take priority
    if (queryLower.includes('2026') && !queryLower.includes('2025')) return 2026;
    if (queryLower.includes('2025') && !queryLower.includes('2026')) return 2025;
    
    // Both years mentioned explicitly
    if (queryLower.includes('2025') && queryLower.includes('2026')) return 'both';
    
    // Forward-looking phrases suggest next year (especially in Q4)
    if (currentMonth >= 9) { // October onwards
        const forwardLookingPatterns = /next year|upcoming|plan|planning|will.*be|new year|after january/i;
        if (forwardLookingPatterns.test(queryLower)) {
            console.log('📅 Forward-looking query detected, prioritizing 2026');
            return 2026;
        }
    }
    
    // Default: include both years, let Gemini determine relevance
    return 'both';
}

// Filter documents by year preference
function filterDocsByYear(docs, yearPreference) {
    if (yearPreference === 'both') return docs;
    
    const yearStr = yearPreference.toString();
    
    // First, find docs that match the requested year
    const yearMatchedDocs = docs.filter(doc => doc.includes(yearStr));
    
    // If we found year-specific docs, prefer those exclusively
    if (yearMatchedDocs.length > 0) {
        console.log(`📅 Found ${yearMatchedDocs.length} docs matching year ${yearStr}`);
        return yearMatchedDocs;
    }
    
    // Fallback: filter out opposite year docs, keep non-year-specific docs
    const otherYear = yearPreference === 2026 ? '2025' : '2026';
    const filtered = docs.filter(doc => !doc.includes(otherYear));
    
    // If filtering removed everything, return original set
    return filtered.length > 0 ? filtered : docs;
}

function selectRelevantDocuments(query) {
    const queryLower = query.toLowerCase();
    const relevantDocs = new Set();
    const yearPreference = detectQueryYear(query);
    
    console.log(`📅 Year preference: ${yearPreference}`);
    
    // First, check process mappings (regex-based for complex patterns)
    for (const [pattern, docs] of Object.entries(PROCESS_MAPPINGS)) {
        try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(queryLower)) {
                console.log(`🎯 Process mapping matched: "${pattern}"`);
                docs.forEach(doc => relevantDocs.add(doc));
            }
        } catch (e) {
            // Invalid regex, skip
        }
    }
    
    // Then check standard keyword catalog
    for (const [keyword, docs] of Object.entries(DOCUMENT_CATALOG)) {
        if (queryLower.includes(keyword)) {
            docs.forEach(doc => relevantDocs.add(doc));
        }
    }
    
    // Default documents if nothing matched
    if (relevantDocs.size === 0) {
        console.log('📁 No specific match - using default docs');
        const defaults = [
            '01_Benefits/Johannes Leonardo 2026 Benefits Guide.pdf',  // Prioritize 2026
            '01_Benefits/Johannes Leonardo 2025 Benefits Guide.pdf',
            '05_Company_Policies/Johannes Leonardo PTO Process.pdf',
            '06_Time_Off_and_Holidays/2026 JL Holiday Calendar.pdf'
        ];
        return filterDocsByYear(defaults, yearPreference).slice(0, 4);
    }
    
    // Apply year filtering and return
    const docsArray = Array.from(relevantDocs);
    const filteredDocs = filterDocsByYear(docsArray, yearPreference);
    return filteredDocs.slice(0, 4);  // Allow up to 4 docs for better coverage
}

// =============================================================================
// RAG: Query P&C Documents via Gemini + GCS
// =============================================================================
// 🔧 TEMPLATE CONFIG: DOCUMENT INFO
// Display names and URL slugs for documents
// CUSTOMIZE: Replace with your document display names
// See docs/TEMPLATE_SETUP.md for details
// =============================================================================
const DOCUMENT_INFO = {
    // Company Policies
    'CAREER MAPPING 2025.pdf': { name: 'Career Mapping Guide 2025', slug: 'career-mapping' },
    'Office Dog Policy_ Dos & Don\'ts.pdf': { name: 'Office Dog Policy', slug: 'dog-policy' },
    'EAP.pdf': { name: 'Employee Assistance Program (EAP)', slug: 'eap' },
    'Performance Review Process_ Formal and Informal Reviews.pdf': { name: 'Performance Review Process', slug: 'performance-review' },
    'JL Experience.pdf': { name: 'JL Experience', slug: 'jl-experience' },
    // Benefits
    'Johannes Leonardo 2025 Benefits Guide.pdf': { name: 'Benefits Guide 2025', slug: 'benefits-2025' },
    'Johannes Leonardo 2026 Benefits Guide.pdf': { name: 'Benefits Guide 2026', slug: 'benefits-2026' },
    'JL Retirement Plan Highlights.pdf': { name: 'Retirement Plan Highlights', slug: 'retirement' },
    'Wellhub Wellness Benefit.pdf': { name: 'Wellhub Wellness Benefit', slug: 'wellhub' },
    // Leave Policies
    'JL Maternity Policy 2025 (1).pdf': { name: 'Maternity Policy 2025', slug: 'maternity' },
    'JL Paternity Policy 2025 (1).pdf': { name: 'Paternity Policy 2025', slug: 'paternity' },
    'JL Adoption & Foster Child Leave Policy 2025.pdf': { name: 'Adoption & Foster Leave Policy', slug: 'adoption' },
    // PTO & Referral
    'Johannes Leonardo PTO Process.pdf': { name: 'PTO Process Guide', slug: 'pto' },
    'employee referal and holiday Calendar.pdf': { name: 'Employee Referral & Holiday Calendar', slug: 'referral' },
    // Holidays
    '2025 JL HOLIDAYS and SUMMER SCHEDULE.pdf': { name: '2025 Holidays & Summer Schedule', slug: 'holidays-2025' },
    '2026 JL Holiday Calendar.pdf': { name: '2026 Holiday Calendar', slug: 'holidays-2026' }
};

const DOCUMENTS_BASE_URL = `${CONFIG.baseUrl}/documents`;

// =============================================================================
// HELPFUL FALLBACK: Guide users when exact answer isn't found
// =============================================================================
// These patterns detect when Gemini explicitly says it CANNOT answer
// Must be specific to avoid false positives on valid responses
const NO_INFO_PATTERNS = [
    /^i (?:don't|do not|cannot|can't) have (?:that |this |the )?(?:specific )?information/im,
    /^(?:i |the documents? |this )(?:doesn't|does not|don't|do not) (?:contain|include|have|cover)/im,
    /^(?:unfortunately|i'm sorry|sorry),? (?:i |the |this )/im,
    /^(?:i |)(?:couldn't|could not|can't|cannot) find (?:any |specific |that |this )?(?:information|details|answer)/im,
    /^no (?:specific |direct |relevant )?(?:information|details|guidance) (?:is |was |)(?:found|available|provided)/im,
    /^the (?:provided |attached )?documents? (?:do not|don't|doesn't|does not) (?:contain|include|address|cover)/im
];

function detectNoInfoResponse(response) {
    // Only check the first 500 chars - "no info" responses start with the disclaimer
    const checkText = response.substring(0, 500);
    return NO_INFO_PATTERNS.some(pattern => pattern.test(checkText));
}

// Maps query keywords to suggested documents for fallback
const FALLBACK_SUGGESTIONS = {
    // Health insurance & enrollment
    'insurance|coverage|enroll|enrollment|dependent|baby|child|medical|dental|vision': {
        doc: 'Benefits Guide 2025',
        slug: 'benefits',
        context: 'benefits enrollment and coverage changes'
    },
    // Retirement
    '401k|401\\(k\\)|retirement|matching|contribution': {
        doc: 'Retirement Plan Highlights',
        slug: 'retirement',
        context: '401(k) and retirement benefits'
    },
    // Leave policies
    'maternity|paternity|parental|baby|pregnant|expecting': {
        doc: 'Maternity/Paternity Policies',
        slug: 'maternity',
        context: 'parental leave policies'
    },
    // PTO
    'pto|vacation|time off|sick|personal day': {
        doc: 'PTO Process Guide',
        slug: 'pto',
        context: 'time off requests and policies'
    },
    // Career
    'career|promotion|growth|development|raise|review': {
        doc: 'Career Mapping Guide 2025',
        slug: 'career-mapping',
        context: 'career development and growth'
    }
};

function generateHelpfulFallback(query, relevantDocs) {
    const queryLower = query.toLowerCase();
    let suggestions = [];
    
    // Find relevant document suggestions based on query
    for (const [pattern, info] of Object.entries(FALLBACK_SUGGESTIONS)) {
        try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(queryLower)) {
                suggestions.push(info);
            }
        } catch (e) {
            // Invalid regex, skip
        }
    }
    
    // Build the helpful response
    let response = "I couldn't find a specific answer to your question in our P&C documents.\n\n";
    
    if (suggestions.length > 0) {
        response += "*This might be covered in:*\n";
        suggestions.slice(0, 3).forEach(s => {
            response += `• <${DOCUMENTS_BASE_URL}?doc=${s.slug}|📄 ${s.doc}> - ${s.context}\n`;
        });
        response += "\n";
    } else if (relevantDocs && relevantDocs.length > 0) {
        // Fall back to showing the documents we searched
        response += "*I searched these documents:*\n";
        relevantDocs.slice(0, 3).forEach(docPath => {
            const filename = docPath.split('/').pop();
            const docInfo = DOCUMENT_INFO[filename];
            if (docInfo) {
                response += `• <${DOCUMENTS_BASE_URL}?doc=${docInfo.slug}|📄 ${docInfo.name}>\n`;
            }
        });
        response += "\n";
    }
    
    response += "*For process-specific questions* (like \"how do I enroll\" or \"what forms do I need\"), please contact your HR team directly:\n";
    response += `📧 <mailto:${CONFIG.supportEmail}|${CONFIG.supportEmail}>\n\n`;
    response += "_Tip: Try rephrasing your question with specific policy terms (e.g., \"benefits enrollment\" or \"401k matching\")._";
    
    return response;
}

async function queryPnCDocuments(query) {
    console.log('\n📄 P&C Query:', query);
    
    const relevantDocs = selectRelevantDocuments(query);
    console.log('📚 Docs:', relevantDocs.map(d => d.split('/').pop()).join(', '));
    
    const parts = [];
    
    for (const docPath of relevantDocs) {
        parts.push({
            fileData: {
                mimeType: 'application/pdf',
                fileUri: `gs://${CONFIG.gcsBucket}/${docPath}`
            }
        });
    }
    
    parts.push({
        text: `You are a friendly, helpful assistant for ${CONFIG.organizationName}.
Your name is ${CONFIG.appName} and you're here to help users with their questions in a warm, conversational way.

Based on the attached company documents, please answer this question:

"${query}"

Tone & Style:
- Be warm, friendly, and conversational - like a helpful colleague, not a policy document
- Start with a VARIED, brief acknowledgment. IMPORTANT: Do NOT always say "Great question!" - mix it up with different openers like:
  • "Happy to help with that!" / "I can help with that!"
  • "Good timing asking about this!" / "Thanks for asking!"
  • "Here's what I found..." / "Let me share what I know..."
  • "Sure thing!" / "Of course!"
  • For celebrations: "Congratulations!" / "How exciting!" / "That's wonderful news!"
  • For benefits: "Important question!" / "Good to know about this..."
  • For sensitive topics (stress, mental health, personal struggles): Use caring, supportive openers like "I hear you.", "Support is available.", "I'm glad you reached out.", "Help is here." - NEVER use cheerful openers like "Absolutely!" or "Great question!" for these topics
- Use appropriate emoji to add warmth: 🎉 for celebrations (baby, promotion), 👍 for confirmations, ✨ for highlights
- For EAP/mental health queries: Use 💙 or no emoji - keep tone supportive, not overly cheerful
- For EAP, counseling, mental health, or other sensitive personal topics: At the END of your response, add this note: "_Feel free to send me a direct message if you'd like to continue this conversation privately. Just click on my name and select 'Message'._ 💬"
- Use "you" and "your" to speak directly to the person
- Keep it concise but helpful (2-4 short paragraphs max)

Formatting (Slack mrkdwn):
- Bold: *text* (single asterisks)
- Italic: _text_ (underscores)  
- Bullet points: • item (use bullet character)

Content Rules:
- Answer based ONLY on information in the provided documents
- If you find relevant information, share it helpfully
- For process questions ("how do I..."), explain what you found and warmly suggest contacting support for specific next steps
- End with a friendly offer to help more if needed

Links & URLs:
- If the document contains website URLs, portal links, or resources relevant to the question, INCLUDE them
- CRITICAL URL FORMATTING for rich previews:
  • Put URL as the VERY LAST thing in your response
  • URL must be on its own line with a blank line before it
  • NO text after the URL
  • Example:
    Here's how to sign up for the benefit...
    [rest of your answer]
    
    https://www.example.com
- If multiple URLs exist, choose the ONE most relevant to the question
- Prioritize: signup/enrollment > informational > general pages`
    });
    
    try {
        console.log('🚀 Querying Gemini 2.5 Flash...');
        const result = await geminiModel.generateContent({
            contents: [{ role: 'user', parts }]
        });
        
        let answer = result.response.candidates[0].content.parts[0].text;
        console.log('✅ Response received');
        
        // Check if this is a "no information" response
        if (detectNoInfoResponse(answer)) {
            console.log('🔄 Detected no-info response, generating helpful fallback');
            return generateHelpfulFallback(query, relevantDocs);
        }
        
        // Add document source links with URLs
        const docLinks = relevantDocs.map(docPath => {
            const filename = docPath.split('/').pop();
            const docInfo = DOCUMENT_INFO[filename];
            if (docInfo) {
                return `<${DOCUMENTS_BASE_URL}?doc=${docInfo.slug}|📄 ${docInfo.name}>`;
            }
            return `📄 ${filename.replace('.pdf', '')}`;
        });
        
        if (docLinks.length > 0) {
            answer += `\n\n_Source: ${docLinks.join(' | ')}_`;
        }
        
        return answer;
        
    } catch (error) {
        console.error('❌ Gemini error:', error.message);
        return `I encountered an error processing your request. Please try again or rephrase your question.`;
    }
}

// =============================================================================
// ROUTER: Determine query type
// =============================================================================
function isEmployeeQuery(text) {
    const lower = text.toLowerCase();
    
    // P&C document topics take priority - these are NEVER employee queries
    const pcTopics = ['holiday', 'vacation', 'pto', 'benefit', 'insurance', 'leave', 'policy', '401k', 'maternity', 'paternity', 'sick day', 'time off'];
    if (pcTopics.some(t => lower.includes(t))) return false;
    
    // Company-level queries that look like employee queries but aren't
    // These should route to P&C docs or get special handling, not employee directory
    const companyConceptQueries = [
        /founder/i, /co-founder/i,
        /who (started|founded|created|owns)/i,
        /history of (jl|johannes|the company)/i,
        /leadership team/i,
        /executive team/i,
        /company (history|story|background)/i
    ];
    if (companyConceptQueries.some(p => p.test(lower))) {
        console.log('📋 Company-concept query detected, routing to P&C docs');
        return false;
    }
    
    // Direct employee directory keywords - always trigger employee search
    const employeeKeywords = [
        'who is', 'who\'s', 'who are', 'who works', 'who\'s in',
        'works in', 'work in', 'working in',
        'email for', 'contact for', 'phone for', 'slack for',
        'email of', 'contact of',
        'employee', 'employees', 'staff',
        'manager of', 'lead of', 'head of', 'director of',
        'people in', 'team in', 'members of',
        'show me the', 'list the', 'find me'
    ];
    if (employeeKeywords.some(k => lower.includes(k))) return true;
    
    // Department + people context = employee query
    // Using word boundaries to avoid matching 'it' as a pronoun
    const deptPatterns = [
        /\bit\b/, /\bhr\b/, /\bp&c\b/, /\btech\b/,
        /creative/i, /design/i, /production/i, /finance/i, /accounting/i,
        /leadership/i, /operations/i, /strategy/i, /legal/i,
        /business affairs/i, /account management/i, /project management/i
    ];
    const peopleWords = ['who', 'team', 'people', 'works', 'work', 'staff', 'department', 'how many', 'count'];
    
    const hasDeptMention = deptPatterns.some(p => p.test(lower));
    const isPeopleContext = peopleWords.some(w => lower.includes(w));
    
    return hasDeptMention && isPeopleContext;
}

// =============================================================================
// EXPRESS SERVER
// =============================================================================
const app = express();
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString(); } }));
app.use(express.urlencoded({ extended: true, verify: (req, res, buf) => { req.rawBody = buf.toString(); } }));

// Serve static files (dashboard)
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

// Dashboard route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html'));
});

// Analytics endpoint (returns JSON)
app.get('/analytics', async (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const analytics = await getAnalytics(days);
    res.json(analytics);
});

// Analytics dashboard page
app.get('/analytics-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'analytics.html'));
});

// Documents library route
app.get('/documents', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'documents.html'));
});

// Employee Directory route
app.get('/directory', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'directory.html'));
});

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        release: 'AI Golden Master Template',
        architecture: 'Gemini 2.5 Flash + GCS Direct PDF + Firestore',
        layers: [
            'P&C RAG',
            'Slack Integration',
            'Employee Directory',
            'Feedback',
            'Pre-canned Responses',
            'PII Security',
            'Thread Continuity',
            'Monitoring Dashboard',
            'Smart Query Reasoning',
            'Year-Aware Docs (2025/2026)',
            'Process-Aware Routing',
            'Analytics Dashboard'
        ],
        model: CONFIG.model,
        analyticsEnabled: ENABLE_ANALYTICS
    });
});

// Test endpoint (for development)
app.get('/test', async (req, res) => {
    const query = req.query.q || 'What is the PTO policy?';
    const answer = await queryPnCDocuments(query);
    res.json({ success: true, query, answer });
});

// Test endpoint for Employee Directory
app.get('/test-employees', async (req, res) => {
    const query = req.query.q || 'IT';
    console.log('\n🧪 Testing Employee Directory...');
    console.log(`   Query: "${query}"`);
    console.log(`   isEmployeeQuery: ${isEmployeeQuery(query)}`);
    console.log(`   isAnalytical: ${isAnalyticalEmployeeQuery(query)}`);
    
    const searchTerm = extractEmployeeSearchTerms(query);
    console.log(`   Extracted term: "${searchTerm}"`);
    
    const employees = await searchEmployeeDirectory(searchTerm);
    res.json({ 
        success: true, 
        query,
        detected: {
            isEmployeeQuery: isEmployeeQuery(query),
            isAnalytical: isAnalyticalEmployeeQuery(query),
            extractedTerm: searchTerm
        },
        resultsCount: employees.length,
        results: employees.slice(0, 5)
    });
});

// API endpoint for fetching employees by department(s)
app.get('/api/employees-by-dept', async (req, res) => {
    try {
        const departments = req.query.depts ? req.query.depts.split(',') : [];
        
        if (departments.length === 0) {
            return res.json({ success: false, error: 'No departments specified' });
        }
        
        console.log(`📋 Fetching employees for departments: ${departments.join(', ')}`);
        
        const allEmployees = await getEmployees();
        const result = {};
        
        for (const dept of departments) {
            const deptLower = dept.toLowerCase().trim();
            const matches = allEmployees.filter(emp => {
                const empDept = (emp.Department || emp.department || '').toLowerCase();
                // Match on exact department or partial match for compound names
                return empDept === deptLower || 
                       empDept.includes(deptLower) || 
                       deptLower.includes(empDept);
            });
            
            // Sort by name
            matches.sort((a, b) => {
                const nameA = (a.Name || a.name || '').toLowerCase();
                const nameB = (b.Name || b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            
            result[dept] = matches.map(emp => ({
                name: emp.Name || emp.name || '',
                title: emp.Title || emp.title || '',
                email: emp.Email || emp.email || '',
                department: emp.Department || emp.department || ''
            }));
        }
        
        const totalCount = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`✅ Found ${totalCount} employees across ${departments.length} department(s)`);
        
        res.json({ 
            success: true, 
            departments: result,
            totalCount 
        });
    } catch (error) {
        console.error('❌ Error fetching employees:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch employees' });
    }
});

// API endpoint for searching employees (for web UI)
app.get('/api/search-employees', async (req, res) => {
    try {
        const query = req.query.q || '';
        
        if (!query || query.length < 2) {
            return res.json({ success: false, error: 'Query too short (min 2 characters)' });
        }
        
        console.log(`🔍 Web search for: "${query}"`);
        
        const allEmployees = await getEmployees();
        const queryLower = query.toLowerCase();
        
        // Score and filter employees
        const results = [];
        for (const emp of allEmployees) {
            const name = (emp.Name || emp.name || '').toLowerCase();
            const title = (emp.Title || emp.title || '').toLowerCase();
            const dept = (emp.Department || emp.department || '').toLowerCase();
            const email = (emp.Email || emp.email || '').toLowerCase();
            
            let score = 0;
            
            // Exact matches
            if (name === queryLower) score += 100;
            if (dept === queryLower) score += 80;
            
            // Partial matches
            if (name.includes(queryLower)) score += 50;
            if (title.includes(queryLower)) score += 30;
            if (dept.includes(queryLower)) score += 25;
            if (email.includes(queryLower)) score += 20;
            
            // First/last name match
            const nameParts = name.split(' ');
            for (const part of nameParts) {
                if (part === queryLower) score += 60;
                if (part.startsWith(queryLower)) score += 40;
            }
            
            if (score > 0) {
                results.push({
                    name: emp.Name || emp.name || '',
                    title: emp.Title || emp.title || '',
                    department: emp.Department || emp.department || '',
                    email: emp.Email || emp.email || '',
                    score
                });
            }
        }
        
        // Sort by score and limit
        results.sort((a, b) => b.score - a.score);
        const topResults = results.slice(0, 20);
        
        console.log(`✅ Found ${results.length} matches, returning top ${topResults.length}`);
        
        res.json({ 
            success: true, 
            query,
            count: results.length,
            results: topResults 
        });
    } catch (error) {
        console.error('❌ Search error:', error);
        res.status(500).json({ success: false, error: 'Search failed' });
    }
});

// Main Slack endpoint
app.post('/', async (req, res) => {
    // URL verification challenge
    if (req.body.type === 'url_verification') {
        return res.status(200).json({ challenge: req.body.challenge });
    }
    
    // Verify Slack signature
    const rawBody = req.rawBody?.toString() || JSON.stringify(req.body);
    if (CONFIG.slackSigningSecret && !verifySlackRequest(req, rawBody)) {
        console.log('⚠️ Invalid Slack signature');
        return res.status(401).send('Unauthorized');
    }
    
    // Acknowledge immediately (Slack requires <3s response)
    res.status(200).send();
    
    // Handle button clicks (feedback + pagination)
    if (req.body.payload) {
        const payload = JSON.parse(req.body.payload);
        
        if (payload.type === 'block_actions') {
            const action = payload.actions[0];
            const actionId = action.action_id;
            
            // Handle pagination buttons
            if (actionId === 'show_more_employees' || actionId === 'show_full_employee_list') {
                console.log('📄 Pagination button clicked:', actionId);
                const data = JSON.parse(action.value);
                const employees = await searchEmployeeDirectory(data.term);
                const { text, blocks } = formatEmployeeResults(employees, data.term, data.start);
                await sendSlackMessageWithBlocks(
                    payload.channel.id, 
                    text, 
                    blocks, 
                    payload.message.thread_ts || payload.message.ts,
                    true
                );
                return;
            }
            
            // Handle feedback buttons - only process if not already selected
            if (!actionId.includes('_selected') && !actionId.includes('_disabled')) {
                // Check for 'not_helpful' first since 'not_helpful' also contains 'helpful'
                const rating = actionId.includes('not_helpful') ? 'not_helpful' : 'helpful';
                const originalText = payload.message.blocks[0]?.text?.text || '';
                
                // Store feedback
                await storeFeedback(
                    new Date().toISOString(),
                    'User query',
                    rating,
                    originalText.substring(0, 500)
                );
                
                // Update button to show selection (color change only, no checkmark)
                const updatedBlocks = [
                    { type: 'section', text: { type: 'mrkdwn', text: originalText } },
                    { type: 'actions', elements: [
                        { 
                            type: 'button', 
                            text: { type: 'plain_text', text: '👍', emoji: true },
                            ...(rating === 'helpful' ? { style: 'primary' } : {}),
                            value: 'selected',
                            action_id: 'feedback_helpful_selected'
                        },
                        { 
                            type: 'button', 
                            text: { type: 'plain_text', text: '👎', emoji: true },
                            ...(rating === 'not_helpful' ? { style: 'danger' } : {}),
                            value: 'selected',
                            action_id: 'feedback_not_helpful_selected'
                        }
                    ]}
                ];
                
                // Get the thread_ts - could be from the message itself or its thread
                const threadTs = payload.message.thread_ts || payload.message.ts;
                
                try {
                    await axios.post('https://slack.com/api/chat.update', {
                        channel: payload.channel.id,
                        ts: payload.message.ts,
                        blocks: updatedBlocks
                    }, { headers: { 'Authorization': `Bearer ${CONFIG.slackBotToken}` }});
                    
                    // Send thank you message in thread
                    const thankYouMsg = rating === 'helpful' 
                        ? "Thanks for your feedback! Glad I could help. 😊"
                        : "Thanks for letting me know. I'll work on improving! 📝";
                    
                    await axios.post('https://slack.com/api/chat.postMessage', {
                        channel: payload.channel.id,
                        thread_ts: threadTs,
                        text: thankYouMsg
                    }, { headers: { 'Authorization': `Bearer ${CONFIG.slackBotToken}` }});
                    
                } catch (e) {
                    console.error('Button update error:', e.message);
                }
            }
        }
        return;
    }
    
    // Handle message events
    const event = req.body.event;
    
    // Debug: Log all incoming events
    if (event) {
        console.log(`📥 Event: type=${event.type}, channel_type=${event.channel_type || 'N/A'}, thread_ts=${event.thread_ts || 'none'}, bot=${!!event.bot_id}`);
    }
    
    if (event && !event.bot_id) {
        // Include event type in dedup key - message.groups and app_mention can have same msg id
        const eventId = `${event.type}-${event.client_msg_id || event.ts}-${event.channel}`;
        if (isEventProcessed(eventId)) return;
        
        // Respond to app mentions or DMs
        if (event.type === 'app_mention' || (event.type === 'message' && event.channel_type === 'im')) {
            const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();
            const channel = event.channel;
            const threadTs = event.thread_ts || event.ts;
            
            // Track this thread for conversation continuity
            activeThreads.set(threadTs, Date.now());
            
            console.log('\n' + '='.repeat(50));
            console.log('📨 Slack message:', text);
            console.log('='.repeat(50));
            
            // SECURITY: Check for PII requests first
            if (await checkAndBlockPII(text, channel, threadTs)) {
                return; // Query was blocked
            }
            
            // SECURITY: Redirect sensitive personal queries to DM
            if (await checkAndRedirectSensitive(text, channel, threadTs)) {
                return; // User redirected to DM
            }
            
            // META: Handle "about me" / version questions
            if (isMetaQuestion(text)) {
                await handleMetaQuestion(channel, threadTs);
                await logAnalytics('meta', ['version', 'about'], 50, event.user);
                return;
            }
            
            // CUSTOM: Handle custom query patterns (customize in isCustomQuery)
            if (isCustomQuery(text)) {
                await handleCustomQuery(channel, threadTs);
                await logAnalytics('custom_query', ['company_info'], 50, event.user);
                return;
            }
            
            if (isEmployeeQuery(text) || isYesNoEmployeeQuestion(text)) {
                // Layer 3: Employee Directory (Firestore)
                
                // Check for yes/no questions first (e.g., "Is Charley in Creative?")
                if (isYesNoEmployeeQuestion(text)) {
                    const handled = await handleYesNoEmployeeQuestion(text, channel, threadTs);
                    if (handled) return;
                }
                
                if (isAnalyticalEmployeeQuery(text)) {
                    // Analytical query: "how many people in IT?", "list all designers"
                    console.log('📊 Analytical employee query');
                    const employees = await searchEmployeeDirectory('');
                    if (employees.length > 0) {
                        const response = await generateEmployeeAnalysisResponse(text, employees);
                        await sendSlackMessage(channel, response, threadTs, true);
                    } else {
                        await sendSlackMessage(channel, "I couldn't access the employee directory. Please try again.", threadTs);
                    }
                } else {
                    // Direct search: "who is John Smith?", "email for Sarah"
                    const searchTerm = extractEmployeeSearchTerms(text);
                    console.log('🔍 Employee search term:', searchTerm);
                    const startTime = Date.now();
                    const employees = await searchEmployeeDirectory(searchTerm);
                    const responseTime = Date.now() - startTime;
                    
                    if (employees.length > 0) {
                        const { text: responseText, blocks } = formatEmployeeResults(employees, searchTerm);
                        await sendSlackMessageWithBlocks(channel, responseText, blocks, threadTs, true);
                    } else {
                        await sendSlackMessage(channel, formatNoEmployeeResultsMessage(searchTerm), threadTs);
                    }
                    
                    // Log employee directory analytics
                    await logAnalytics('employee_directory', [searchTerm], responseTime, event.user);
                }
            } else {
                // Check pre-canned responses first (faster than RAG)
                const preCannedMatches = await searchPreCannedResponses(text);
                
                if (preCannedMatches && preCannedMatches.length > 0) {
                    // Use pre-canned response (Column B is typically the answer)
                    console.log('📋 Using pre-canned response');
                    const answer = preCannedMatches[0][1] || preCannedMatches[0].join(' ');
                    await sendSlackMessage(channel, answer, threadTs, true);
                } else {
                    // P&C Document RAG Query
                    const startTime = Date.now();
                    const answer = await queryPnCDocuments(text);
                    const responseTime = Date.now() - startTime;
                    const slackFormatted = convertMarkdownToSlack(answer);
                    await sendSlackMessage(channel, slackFormatted, threadTs, true);
                    
                    // Log analytics
                    const keywords = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                    await logAnalytics('pnc_rag', keywords.slice(0, 5), responseTime, event.user);
                }
            }
        }
        
        // Handle follow-up messages in active threads (conversation continuity)
        else if (event.type === 'message' && event.thread_ts && !event.subtype && !event.bot_id) {
            if (activeThreads.has(event.thread_ts)) {
                const text = event.text.trim();
                const channel = event.channel;
                const threadTs = event.thread_ts;
                
                console.log('💬 Thread follow-up:', text);
                activeThreads.set(threadTs, Date.now()); // Refresh thread activity
                
                // Security check
                if (await checkAndBlockPII(text, channel, threadTs)) return;
                
                // SECURITY: Redirect sensitive personal queries to DM
                if (await checkAndRedirectSensitive(text, channel, threadTs)) return;
                
                // META: Handle "about me" / version questions
                if (isMetaQuestion(text)) {
                    await handleMetaQuestion(channel, threadTs);
                    return;
                }
                
                // CUSTOM: Handle custom query patterns
                if (isCustomQuery(text)) {
                    await handleCustomQuery(channel, threadTs);
                    return;
                }
                
                // Process as normal query
                if (isEmployeeQuery(text) || isYesNoEmployeeQuestion(text)) {
                    // Check for yes/no questions first
                    if (isYesNoEmployeeQuestion(text)) {
                        const handled = await handleYesNoEmployeeQuestion(text, channel, threadTs);
                        if (handled) return;
                    }
                    
                    const searchTerm = extractEmployeeSearchTerms(text);
                    const employees = await searchEmployeeDirectory(searchTerm);
                    if (employees.length > 0) {
                        const { text: responseText, blocks } = formatEmployeeResults(employees, searchTerm);
                        await sendSlackMessageWithBlocks(channel, responseText, blocks, threadTs, true);
                    } else {
                        await sendSlackMessage(channel, formatNoEmployeeResultsMessage(searchTerm), threadTs);
                    }
                } else {
                    const answer = await queryPnCDocuments(text);
                    const slackFormatted = convertMarkdownToSlack(answer);
                    await sendSlackMessage(channel, slackFormatted, threadTs, true);
                }
            }
        }
    }
});

// =============================================================================
// START SERVER
// =============================================================================
app.listen(CONFIG.port, async () => {
    console.log('\n' + '='.repeat(60));
    console.log(`🚀 ${CONFIG.appName} v${CONFIG.appVersion} (${CONFIG.model})`);
    console.log('='.repeat(60));
    console.log('Layers Active:');
    console.log('  ✅ Layer 1: P&C RAG (Gemini 2.5 Flash + GCS)');
    console.log('  ✅ Layer 2: Slack Integration');
    console.log('  ✅ Layer 3: Employee Directory (Firestore + Cache)');
    console.log('  ✅ Layer 4: Feedback (👍/👎 → Sheets)');
    console.log('  ✅ Layer 5: Pre-canned Responses (Sheet1)');
    console.log('  ✅ Layer 6: PII Security Check');
    console.log('  ✅ Layer 7: Thread Continuity');
    console.log('  ✅ Layer 8: Monitoring Dashboard');
    console.log('  ✅ Layer 9: Smart Query Reasoning');
    console.log('  ✅ Layer 10: Process-Aware Routing + Helpful Fallbacks');
    console.log('─'.repeat(60));
    console.log('Server:    http://localhost:' + CONFIG.port);
    console.log('Dashboard: http://localhost:' + CONFIG.port + '/dashboard');
    console.log('Model:     ' + CONFIG.model);
    console.log('Docs:      ' + ALL_PDFS.length + ' PDFs in gs://' + CONFIG.gcsBucket);
    console.log('='.repeat(60));
    
    // Warm up employee cache on startup
    console.log('\n🔥 Warming up employee cache...');
    try {
        await getEmployees();
        console.log('✅ Employee cache ready!');
    } catch (err) {
        console.error('⚠️ Cache warmup failed:', err.message);
    }
});
