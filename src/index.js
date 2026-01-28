/**
 * @file index.js
 * @description CatchFire Influencer Matching Engine - Main Express Server
 * @author Charley Scholz, JLIT
 * @coauthor Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-01-28
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const { Firestore } = require('@google-cloud/firestore');

// Local modules
const { validateCreator, validateBatchCreator, validateMatchRequest, validateCategorizeRequest } = require('./schemas');
const { rankCreators, extractBriefKeywords } = require('./scoring');

// =============================================================================
// 🔧 CONFIGURATION
// =============================================================================
const CONFIG = {
    // GCP Project
    projectId: process.env.GCP_PROJECT_ID || 'catchfire-app-2026',
    region: process.env.GCP_REGION || 'us-central1',
    
    // Gemini Model
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    
    // Firestore Collection
    creatorsCollection: process.env.FIRESTORE_COLLECTION || 'creators',
    
    // Server
    port: process.env.PORT || 8090,
    
    // App Identity
    appName: process.env.APP_NAME || 'CatchFire Matching Engine',
    appVersion: process.env.APP_VERSION || '0.1.0',
    orgName: process.env.ORG_NAME || 'CatchFire / Johannes Leonardo',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@johannesleonardo.com',
    baseUrl: process.env.BASE_URL || 'http://localhost:8090',
    
    // Analytics
    analyticsEnabled: process.env.ENABLE_ANALYTICS !== 'false'
};

// =============================================================================
// 🔌 CLIENTS
// =============================================================================
let firestore;
try {
    firestore = new Firestore({ projectId: CONFIG.projectId });
    console.log('✅ Firestore client initialized');
} catch (error) {
    console.error('⚠️ Firestore initialization deferred:', error.message);
    firestore = null;
}

// =============================================================================
// 🗄️ CREATOR CACHE
// =============================================================================
let creatorCache = null;
let creatorCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all creators from Firestore with caching
 * @returns {Promise<Array>} Array of creator objects
 */
async function getCreators() {
    const now = Date.now();
    if (creatorCache && (now - creatorCacheTime) < CACHE_TTL) {
        console.log('📦 Using cached creator data');
        return creatorCache;
    }
    
    if (!firestore) {
        console.log('⚠️ Firestore not available, returning empty array');
        return [];
    }
    
    console.log('🔄 Fetching creators from Firestore...');
    const startTime = Date.now();
    
    try {
        const snapshot = await firestore.collection(CONFIG.creatorsCollection).get();
        const fetchTime = Date.now() - startTime;
        console.log(`⏱️ Firestore fetch took ${fetchTime}ms`);
        
        creatorCache = [];
        snapshot.forEach(doc => {
            creatorCache.push({ id: doc.id, ...doc.data() });
        });
        creatorCacheTime = now;
        
        console.log(`📊 Cached ${creatorCache.length} creators`);
        return creatorCache;
    } catch (error) {
        console.error('❌ Error fetching creators:', error.message);
        return creatorCache || [];
    }
}

/**
 * Clear the creator cache (call after writes)
 */
function clearCreatorCache() {
    creatorCache = null;
    creatorCacheTime = 0;
    console.log('🗑️ Creator cache cleared');
}

// =============================================================================
// 🚀 EXPRESS APP
// =============================================================================
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// =============================================================================
// 📊 HEALTH CHECK
// =============================================================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        app: CONFIG.appName,
        version: CONFIG.appVersion,
        timestamp: new Date().toISOString(),
        config: {
            projectId: CONFIG.projectId,
            region: CONFIG.region,
            model: CONFIG.model,
            collection: CONFIG.creatorsCollection
        }
    });
});

// Legacy health check at root
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        app: CONFIG.appName,
        version: CONFIG.appVersion,
        description: 'AI-powered creator matching based on craft storytelling skills',
        endpoints: {
            health: 'GET /health',
            dashboard: 'GET /dashboard',
            creators: 'GET /api/v1/creators',
            match: 'POST /api/v1/match',
            categorize: 'POST /api/v1/categorize'
        }
    });
});

// =============================================================================
// 📈 DASHBOARD
// =============================================================================
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// =============================================================================
// 🎬 CREATOR API (v1)
// =============================================================================

/**
 * GET /api/v1/creators - List/search creators
 * Query params: craft, location, tags, limit
 */
app.get('/api/v1/creators', async (req, res) => {
    console.log('📥 GET /api/v1/creators', req.query);
    
    try {
        let creators = await getCreators();
        
        // Filter by craft
        if (req.query.craft) {
            const craft = req.query.craft.toLowerCase();
            creators = creators.filter(c => 
                c.craft?.primary?.toLowerCase().includes(craft) ||
                c.craft?.secondary?.some(s => s.toLowerCase().includes(craft))
            );
        }
        
        // Filter by location
        if (req.query.location) {
            const location = req.query.location.toLowerCase();
            creators = creators.filter(c => 
                c.contact?.location?.toLowerCase().includes(location)
            );
        }
        
        // Filter by tags
        if (req.query.tags) {
            const tags = req.query.tags.split(',').map(t => t.trim().toLowerCase());
            creators = creators.filter(c => 
                c.craft?.technicalTags?.some(t => tags.includes(t.toLowerCase()))
            );
        }
        
        // Limit results
        const limit = parseInt(req.query.limit) || 50;
        creators = creators.slice(0, limit);
        
        res.json({
            success: true,
            count: creators.length,
            creators
        });
    } catch (error) {
        console.error('❌ Error listing creators:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/creators/:id - Get creator by ID
 */
app.get('/api/v1/creators/:id', async (req, res) => {
    console.log('📥 GET /api/v1/creators/:id', req.params.id);
    
    try {
        if (!firestore) {
            return res.status(503).json({ success: false, error: 'Firestore not available' });
        }
        
        const doc = await firestore.collection(CONFIG.creatorsCollection).doc(req.params.id).get();
        
        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Creator not found' });
        }
        
        res.json({
            success: true,
            creator: { id: doc.id, ...doc.data() }
        });
    } catch (error) {
        console.error('❌ Error getting creator:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/creators - Add a single creator
 */
app.post('/api/v1/creators', async (req, res) => {
    console.log('📥 POST /api/v1/creators');
    
    try {
        if (!firestore) {
            return res.status(503).json({ success: false, error: 'Firestore not available' });
        }
        
        // Validate with zod schema
        const validation = validateCreator(req.body);
        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                error: validation.error 
            });
        }
        
        const creator = validation.data;
        
        // Add metadata
        creator.createdAt = new Date().toISOString();
        creator.updatedAt = new Date().toISOString();
        
        const docRef = await firestore.collection(CONFIG.creatorsCollection).add(creator);
        clearCreatorCache();
        
        console.log('✅ Creator added:', docRef.id);
        
        res.status(201).json({
            success: true,
            id: docRef.id,
            creator: { id: docRef.id, ...creator }
        });
    } catch (error) {
        console.error('❌ Error adding creator:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/creators/batch - Bulk import creators
 */
app.post('/api/v1/creators/batch', async (req, res) => {
    console.log('📥 POST /api/v1/creators/batch');
    
    try {
        if (!firestore) {
            return res.status(503).json({ success: false, error: 'Firestore not available' });
        }
        
        const { creators } = req.body;
        
        if (!Array.isArray(creators) || creators.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Request body must contain a non-empty "creators" array' 
            });
        }
        
        console.log(`🎬 Batch importing ${creators.length} creators...`);
        
        const batch = firestore.batch();
        const results = [];
        const timestamp = new Date().toISOString();
        
        for (const rawCreator of creators) {
            // Validate each creator
            const validation = validateBatchCreator(rawCreator);
            if (!validation.success) {
                results.push({ error: validation.error, name: rawCreator.name || 'unknown' });
                continue;
            }
            
            const creator = validation.data;
            const docRef = firestore.collection(CONFIG.creatorsCollection).doc();
            creator.createdAt = timestamp;
            creator.updatedAt = timestamp;
            batch.set(docRef, creator);
            results.push({ id: docRef.id, name: creator.name });
        }
        
        await batch.commit();
        clearCreatorCache();
        
        const successCount = results.filter(r => r.id).length;
        console.log(`✅ Batch import complete: ${successCount}/${creators.length} succeeded`);
        
        res.status(201).json({
            success: true,
            imported: successCount,
            total: creators.length,
            results
        });
    } catch (error) {
        console.error('❌ Error in batch import:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =============================================================================
// 🎯 MATCHING API
// =============================================================================

/**
 * POST /api/v1/match - Match creators to a brief
 * Body: { brief: string, filters?: { craft?, location?, tags?, minQualityScore?, goldenRecordsOnly?, limit? } }
 */
app.post('/api/v1/match', async (req, res) => {
    console.log('📥 POST /api/v1/match');
    
    try {
        // Validate request
        const validation = validateMatchRequest(req.body);
        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                error: validation.error 
            });
        }
        
        const { brief, filters } = validation.data;
        console.log(`🎯 Matching creators for brief: "${brief.substring(0, 100)}..."`);
        
        // Get all creators
        let creators = await getCreators();
        
        // Apply pre-filters before scoring
        if (filters.craft) {
            const craft = filters.craft.toLowerCase();
            creators = creators.filter(c => 
                c.craft?.primary?.toLowerCase().includes(craft) ||
                c.craft?.secondary?.some(s => s.toLowerCase().includes(craft))
            );
        }
        
        if (filters.location) {
            const location = filters.location.toLowerCase();
            creators = creators.filter(c => 
                c.contact?.location?.toLowerCase().includes(location)
            );
        }
        
        if (filters.goldenRecordsOnly) {
            creators = creators.filter(c => c.matching?.isGoldenRecord === true);
        }
        
        if (filters.minQualityScore) {
            creators = creators.filter(c => 
                (c.matching?.qualityScore || 0) >= filters.minQualityScore
            );
        }
        
        // Use scoring algorithm to rank creators
        const matches = rankCreators(creators, brief, {
            minScore: 0,
            limit: filters.limit || 10
        });
        
        console.log(`✅ Found ${matches.length} matches`);
        
        // Extract keywords for response metadata
        const keywords = extractBriefKeywords(brief);
        
        res.json({
            success: true,
            brief: brief.substring(0, 200),
            extractedKeywords: {
                crafts: keywords.crafts,
                technical: keywords.technical,
                locations: keywords.locations,
                styles: keywords.styles
            },
            matchCount: matches.length,
            matches
        });
    } catch (error) {
        console.error('❌ Error matching creators:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =============================================================================
// 🤖 CATEGORIZATION API
// =============================================================================

/**
 * POST /api/v1/categorize - Auto-categorize a creator from bio/portfolio
 * Body: { bio: string, portfolio_url?: string, recentWork?: string[] }
 */
app.post('/api/v1/categorize', async (req, res) => {
    console.log('📥 POST /api/v1/categorize');
    
    try {
        // Validate request
        const validation = validateCategorizeRequest(req.body);
        if (!validation.success) {
            return res.status(400).json({ 
                success: false, 
                error: validation.error 
            });
        }
        
        const { bio, portfolio_url, recentWork } = validation.data;
        console.log(`🤖 Categorizing bio: "${bio.substring(0, 100)}..."`);
        
        // Extract keywords from bio for basic categorization
        const keywords = extractBriefKeywords(bio);
        
        // TODO: Phase 2 - Implement LLM-based categorization with @google/genai
        // For now, use keyword extraction for basic categorization
        const detectedCraft = keywords.crafts[0] || 'other';
        const categorization = {
            craft: {
                primary: detectedCraft,
                secondary: keywords.crafts.slice(1, 3),
                confidence: keywords.crafts.length > 0 ? 0.7 : 0.3
            },
            technicalTags: keywords.technical.map(t => `#${t.replace(/\s+/g, '')}`),
            styleSignature: `Creator with focus on ${keywords.styles.slice(0, 3).join(', ') || 'visual storytelling'}.`,
            positiveKeywords: [...keywords.crafts, ...keywords.technical].slice(0, 10),
            negativeKeywords: [],
            note: 'Basic keyword extraction - LLM categorization coming in Phase 2'
        };
        
        console.log('✅ Categorization complete');
        
        res.json({
            success: true,
            input: { bio: bio.substring(0, 200), portfolio_url },
            categorization
        });
    } catch (error) {
        console.error('❌ Error categorizing:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =============================================================================
// 📊 STATS API
// =============================================================================

/**
 * GET /api/v1/stats - Get database statistics
 */
app.get('/api/v1/stats', async (req, res) => {
    console.log('📥 GET /api/v1/stats');
    
    try {
        const creators = await getCreators();
        
        // Count by craft
        const craftCounts = {};
        creators.forEach(c => {
            const craft = c.craft?.primary || 'unknown';
            craftCounts[craft] = (craftCounts[craft] || 0) + 1;
        });
        
        // Count by platform
        const platformCounts = {};
        creators.forEach(c => {
            const platform = c.platform || 'unknown';
            platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });
        
        // Count Golden Records
        const goldenRecords = creators.filter(c => c.matching?.isGoldenRecord).length;
        
        res.json({
            success: true,
            stats: {
                totalCreators: creators.length,
                goldenRecords,
                byCraft: craftCounts,
                byPlatform: platformCounts,
                cacheAge: creatorCacheTime ? Math.floor((Date.now() - creatorCacheTime) / 1000) + 's' : 'not cached'
            }
        });
    } catch (error) {
        console.error('❌ Error getting stats:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =============================================================================
// 🚀 START SERVER
// =============================================================================
app.listen(CONFIG.port, () => {
    console.log(`
============================================================
🎬 ${CONFIG.appName} v${CONFIG.appVersion}
============================================================
Server:     ${CONFIG.baseUrl}
Project:    ${CONFIG.projectId}
Region:     ${CONFIG.region}
Model:      ${CONFIG.model}
Collection: ${CONFIG.creatorsCollection}
────────────────────────────────────────────────────────────
Endpoints:
  GET  /health              - Health check
  GET  /dashboard           - Monitoring dashboard
  GET  /api/v1/creators     - List/search creators
  GET  /api/v1/creators/:id - Get creator by ID
  POST /api/v1/creators     - Add creator
  POST /api/v1/creators/batch - Bulk import
  POST /api/v1/match        - Match creators to brief
  POST /api/v1/categorize   - Auto-categorize from bio
  GET  /api/v1/stats        - Database statistics
============================================================
`);
});

module.exports = app;
