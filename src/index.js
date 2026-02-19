/**
 * @file index.js
 * @description CatchFire Influencer Matching Engine - Main Express Server
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-01-28
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Firestore } = require('@google-cloud/firestore');

// Local modules
const { validateCreator, validateBatchCreator, validateMatchRequest, validateCategorizeRequest, PLATFORMS, CRAFT_TYPES } = require('./schemas');
const { rankCreators, extractBriefKeywords } = require('./scoring');
const { appendFeedbackRow } = require('./feedback-sheet');
const { 
    categorizeCreator, 
    generateStyleSignature, 
    testLLMConnection,
    testEmbeddings,
    generateEmbedding,
    generateEmbeddings,
    buildCreatorEmbeddingText,
    findSimilar,
    cosineSimilarity,
    getEmbeddingConfig,
    getClientType,
    // Golden Record Lookalike Model
    buildGoldenRecordModel,
    findLookalikes,
    scoreAgainstGoldenRecords,
    buildCraftSpecificModels
} = require('./llm');

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
    orgName: process.env.ORG_NAME || 'CF - Influencer Matching Engine',
    supportEmail: process.env.SUPPORT_EMAIL || '',
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

// -----------------------------------------------------------------------------
// 🔒 SECURITY MIDDLEWARE (helmet, cors, rate-limit)
// -----------------------------------------------------------------------------
app.use(helmet({
    contentSecurityPolicy: false, // allow inline scripts for dashboard; tighten for production if needed
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || true, // true = reflect request origin; set to comma-separated origins in production
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    message: { success: false, error: 'Too many requests; try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));

// Legacy public/ assets at root (Beta Control Center, dashboard, testing pages)
const fs = require('fs');
app.use(express.static(path.join(__dirname, '../public')));

// Explicit routes for legacy HTML pages (without .html extension)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});
app.get('/testing', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/testing.html'));
});

// Serve React SPA from web/dist/ under /app prefix
const webDistPath = path.join(__dirname, '../web/dist');
if (fs.existsSync(webDistPath)) {
    app.use('/app', express.static(webDistPath));
}

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

// Legacy HTML pages served at root via express.static + explicit routes above

// =============================================================================
// 🎬 CREATOR API (v1)
// =============================================================================

/**
 * GET /api/v1/creators - List/search creators
 * Query params: craft, location, tags, subjectMatter, subjectSubcategory, primaryMedium, budgetTier, limit
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
        
        // Filter by platform
        if (req.query.platform) {
            const platform = req.query.platform.toLowerCase();
            creators = creators.filter(c =>
                c.platform?.toLowerCase() === platform
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
        
        // Filter by subject matter (comma-separated or single)
        if (req.query.subjectMatter) {
            const subjects = (Array.isArray(req.query.subjectMatter) ? req.query.subjectMatter : String(req.query.subjectMatter).split(',')).map(s => s.trim().toLowerCase());
            creators = creators.filter(c => {
                const creatorSubjects = (c.craft?.subjectMatterTags ?? []).map(t => t.toLowerCase());
                return subjects.some(s => creatorSubjects.includes(s));
            });
        }
        
        // Filter by subject subcategory
        if (req.query.subjectSubcategory) {
            const subcats = (Array.isArray(req.query.subjectSubcategory) ? req.query.subjectSubcategory : String(req.query.subjectSubcategory).split(',')).map(s => s.trim().toLowerCase());
            creators = creators.filter(c => {
                const creatorSubcats = (c.craft?.subjectSubcategoryTags ?? []).map(t => t.toLowerCase());
                return subcats.some(s => creatorSubcats.includes(s));
            });
        }
        
        // Filter by primary medium (still | video | audio)
        if (req.query.primaryMedium) {
            const medium = String(req.query.primaryMedium).toLowerCase();
            creators = creators.filter(c => c.craft?.primaryMedium?.toLowerCase() === medium);
        }
        
        // Filter by budget tier
        if (req.query.budgetTier) {
            const tier = String(req.query.budgetTier).toLowerCase();
            creators = creators.filter(c => c.contact?.budgetTier?.toLowerCase() === tier);
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
 * PATCH /api/v1/creators/:id - Partial update a creator (admin)
 */
app.patch('/api/v1/creators/:id', async (req, res) => {
    console.log('PATCH /api/v1/creators/' + req.params.id);
    
    try {
        if (!firestore) {
            return res.status(503).json({ success: false, error: 'Firestore not available' });
        }
        
        const docRef = firestore.collection(CONFIG.creatorsCollection).doc(req.params.id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Creator not found' });
        }
        
        const updates = req.body;
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, error: 'No update fields provided' });
        }
        
        // Flatten nested objects for Firestore partial update
        const flatUpdates = {};
        for (const [key, value] of Object.entries(updates)) {
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                for (const [subKey, subValue] of Object.entries(value)) {
                    flatUpdates[`${key}.${subKey}`] = subValue;
                }
            } else {
                flatUpdates[key] = value;
            }
        }
        flatUpdates['updatedAt'] = new Date().toISOString();
        
        await docRef.update(flatUpdates);
        clearCreatorCache();
        
        const updated = await docRef.get();
        res.json({ success: true, creator: { id: updated.id, ...updated.data() } });
    } catch (error) {
        console.error('Error updating creator:', error.message);
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
        
        // Generate embedding asynchronously (non-blocking)
        const creatorWithId = { id: docRef.id, ...creator };
        generateEmbeddingForCreator(creatorWithId).catch(err => {
            console.error(`⚠️ Failed to generate embedding for ${docRef.id}:`, err.message);
        });
        
        res.status(201).json({
            success: true,
            id: docRef.id,
            creator: creatorWithId,
            embeddingStatus: 'generating'
        });
    } catch (error) {
        console.error('❌ Error adding creator:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Helper: Generate embedding for a creator and update Firestore
 */
async function generateEmbeddingForCreator(creator) {
    try {
        const embeddingText = buildCreatorEmbeddingText(creator);
        const embedding = await generateEmbedding(embeddingText, 'RETRIEVAL_DOCUMENT');
        
        await firestore.collection(CONFIG.creatorsCollection).doc(creator.id).update({
            embedding: embedding.values,
            embeddingText: embeddingText,
            embeddingModel: embedding.model,
            embeddingGeneratedAt: new Date().toISOString()
        });
        
        console.log(`✅ Embedding generated for ${creator.name} (${creator.id})`);
        clearCreatorCache();
    } catch (error) {
        console.error(`❌ Embedding generation failed for ${creator.id}:`, error.message);
        throw error;
    }
}

/**
 * Normalize a name for dedup matching: lowercase, strip punctuation, collapse whitespace.
 */
function normalizeName(name) {
    return (name || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Merge incoming creator data into an existing record.
 * Union tags/keywords, fill empty fields, keep higher qualityScore.
 */
function mergeCreatorData(existing, incoming) {
    const merged = JSON.parse(JSON.stringify(existing));

    const unionArrayFields = [
        ['craft', 'secondary'], ['craft', 'technicalTags'],
        ['matching', 'positiveKeywords'], ['matching', 'negativeKeywords'],
    ];
    for (const [parent, child] of unionArrayFields) {
        const existArr = (existing[parent] || {})[child] || [];
        const newArr = (incoming[parent] || {})[child] || [];
        if (!merged[parent]) merged[parent] = {};
        merged[parent][child] = [...new Set([...existArr, ...newArr])];
    }

    if (!existing.contact?.portfolio_url && incoming.contact?.portfolio_url) {
        if (!merged.contact) merged.contact = {};
        merged.contact.portfolio_url = incoming.contact.portfolio_url;
    }
    if (!existing.contact?.location && incoming.contact?.location) {
        if (!merged.contact) merged.contact = {};
        merged.contact.location = incoming.contact.location;
    }
    if (!existing.contact?.email && incoming.contact?.email) {
        if (!merged.contact) merged.contact = {};
        merged.contact.email = incoming.contact.email;
    }

    const existScore = (existing.matching || {}).qualityScore || 0;
    const newScore = (incoming.matching || {}).qualityScore || 0;
    if (newScore > existScore) {
        if (!merged.matching) merged.matching = {};
        merged.matching.qualityScore = newScore;
    }

    if (incoming.source?.url) {
        merged.additionalSources = [...(existing.additionalSources || []), incoming.source];
    }

    merged.updatedAt = new Date().toISOString();
    return merged;
}

/**
 * POST /api/v1/creators/batch - Bulk import creators with deduplication
 */
app.post('/api/v1/creators/batch', async (req, res) => {
    console.log('\u{1F4E5} POST /api/v1/creators/batch');
    
    try {
        if (!firestore) {
            return res.status(503).json({ success: false, error: 'Firestore not available' });
        }
        
        const { creators, skipDedup } = req.body;
        
        if (!Array.isArray(creators) || creators.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Request body must contain a non-empty "creators" array' 
            });
        }
        
        console.log(`\u{1F3AC} Batch importing ${creators.length} creators...`);

        let existingByName = {};
        if (!skipDedup) {
            const snapshot = await firestore.collection(CONFIG.creatorsCollection).get();
            snapshot.forEach(doc => {
                const data = doc.data();
                const norm = normalizeName(data.name);
                if (norm) existingByName[norm] = { id: doc.id, data };
            });
            console.log(`\u{1F50D} Dedup: loaded ${Object.keys(existingByName).length} existing creators`);
        }

        const batch = firestore.batch();
        const results = [];
        const timestamp = new Date().toISOString();
        let newCount = 0;
        let mergedCount = 0;
        
        for (const rawCreator of creators) {
            const validation = validateBatchCreator(rawCreator);
            if (!validation.success) {
                results.push({ error: validation.error, name: rawCreator.name || 'unknown' });
                continue;
            }
            
            const creator = validation.data;
            const norm = normalizeName(creator.name);

            if (!skipDedup && existingByName[norm]) {
                const existing = existingByName[norm];
                const merged = mergeCreatorData(existing.data, creator);
                const docRef = firestore.collection(CONFIG.creatorsCollection).doc(existing.id);
                batch.update(docRef, merged);
                results.push({ id: existing.id, name: creator.name, action: 'merged' });
                mergedCount++;
            } else {
                const docRef = firestore.collection(CONFIG.creatorsCollection).doc();
                creator.createdAt = timestamp;
                creator.updatedAt = timestamp;
                batch.set(docRef, creator);
                results.push({ id: docRef.id, name: creator.name, action: 'created' });
                existingByName[norm] = { id: docRef.id, data: creator };
                newCount++;
            }
        }
        
        await batch.commit();
        clearCreatorCache();
        
        const successCount = results.filter(r => r.id).length;
        console.log(`\u2705 Batch import: ${newCount} new, ${mergedCount} merged, ${results.length - successCount} failed`);
        
        res.status(201).json({
            success: true,
            imported: successCount,
            total: creators.length,
            new: newCount,
            merged: mergedCount,
            results
        });
    } catch (error) {
        console.error('\u274C Error in batch import:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =============================================================================
// 🤖 APIFY SCRAPER IMPORT (Phase 2)
// =============================================================================

/**
 * Transform raw Apify scraper data to CatchFire schema
 * Handles various field naming conventions from different scrapers
 */
function transformScraperData(raw) {
    // Normalize platform names
    const platformMap = {
        'vimeo.com': 'vimeo',
        'behance.net': 'behance',
        'artstation.com': 'artstation',
        'instagram.com': 'instagram',
        'youtube.com': 'youtube',
        'tiktok.com': 'tiktok',
        'dribbble.com': 'dribbble',
        'linkedin.com': 'linkedin'
    };
    
    // Extract platform from URL if available
    let platform = raw.platform || 'other';
    const profileUrl = raw.profileUrl || raw.url || raw.profile_url || '';
    for (const [domain, plat] of Object.entries(platformMap)) {
        if (profileUrl.includes(domain)) {
            platform = plat;
            break;
        }
    }
    
    // Validate platform against schema
    if (!PLATFORMS.includes(platform)) {
        platform = 'other';
    }
    
    return {
        name: raw.name || raw.displayName || raw.fullName || raw.username || 'Unknown',
        handle: raw.handle || raw.username || (raw.name ? `@${raw.name.toLowerCase().replace(/\s+/g, '')}` : ''),
        platform,
        source: {
            type: raw.sourceType || 'platform',
            name: raw.sourceName || raw.source || platform,
            url: profileUrl,
            discoveredAt: new Date().toISOString()
        },
        craft: {
            primary: 'other', // Will be set by LLM categorization
            secondary: [],
            styleSignature: '',
            technicalTags: raw.tags || raw.hashtags || []
        },
        matching: {
            positiveKeywords: [],
            negativeKeywords: [],
            qualityScore: raw.qualityScore || raw.score || 50,
            isGoldenRecord: false
        },
        contact: {
            email: raw.email || '',
            portfolio_url: profileUrl,
            location: raw.location || raw.city || raw.country || '',
            locationConstraints: 'flexible',
            isHireable: raw.isHireable !== false
        },
        // Preserve raw bio for categorization
        _rawBio: raw.bio || raw.description || raw.about || ''
    };
}

/**
 * POST /api/v1/import/apify - Import from Apify scraper with auto-categorization
 * Body: { 
 *   data: [...], 
 *   source: { type, name },
 *   autoCategorize: boolean (default: true),
 *   dryRun: boolean (default: false)
 * }
 */
app.post('/api/v1/import/apify', async (req, res) => {
    console.log('📥 POST /api/v1/import/apify');
    
    try {
        if (!firestore) {
            return res.status(503).json({ success: false, error: 'Firestore not available' });
        }
        
        const { data, source, autoCategorize = true, dryRun = false } = req.body;
        
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Request body must contain a non-empty "data" array' 
            });
        }
        
        console.log(`🕷️ Processing ${data.length} scraped records...`);
        console.log(`   Auto-categorize: ${autoCategorize}`);
        console.log(`   Dry run: ${dryRun}`);
        
        const results = [];
        const timestamp = new Date().toISOString();
        const batch = dryRun ? null : firestore.batch();
        
        for (let i = 0; i < data.length; i++) {
            const raw = data[i];
            
            try {
                // Transform to our schema
                const creator = transformScraperData(raw);
                
                // Apply source override if provided
                if (source) {
                    creator.source.type = source.type || creator.source.type;
                    creator.source.name = source.name || creator.source.name;
                }
                
                // Auto-categorize with LLM if bio available and enabled
                if (autoCategorize && creator._rawBio) {
                    try {
                        console.log(`   🤖 Categorizing: ${creator.name}...`);
                        const categorization = await categorizeCreator(creator._rawBio);
                        creator.craft.primary = categorization.craft.primary;
                        creator.craft.secondary = categorization.craft.secondary;
                        creator.craft.styleSignature = categorization.styleSignature;
                        creator.craft.technicalTags = categorization.technicalTags;
                        creator.craft.subjectMatterTags = categorization.craft.subjectMatterTags || [];
                        creator.craft.subjectSubcategoryTags = categorization.craft.subjectSubcategoryTags || [];
                        creator.craft.primaryMedium = categorization.craft.primaryMedium;
                        creator.craft.classification = categorization.craft.classification;
                        creator.matching.positiveKeywords = categorization.positiveKeywords;
                        creator.matching.negativeKeywords = categorization.negativeKeywords;
                    } catch (llmError) {
                        console.log(`   ⚠️ LLM categorization failed for ${creator.name}, using defaults`);
                    }
                }
                
                // Remove internal fields
                delete creator._rawBio;
                
                // Add timestamps
                creator.createdAt = timestamp;
                creator.updatedAt = timestamp;
                
                if (!dryRun) {
                    const docRef = firestore.collection(CONFIG.creatorsCollection).doc();
                    batch.set(docRef, creator);
                    results.push({ 
                        id: docRef.id, 
                        name: creator.name, 
                        craft: creator.craft.primary,
                        status: 'imported'
                    });
                } else {
                    results.push({ 
                        name: creator.name, 
                        craft: creator.craft.primary,
                        status: 'dry_run',
                        preview: creator
                    });
                }
                
            } catch (error) {
                results.push({ 
                    error: error.message, 
                    name: raw.name || 'unknown',
                    status: 'failed'
                });
            }
            
            // Progress logging for large batches
            if ((i + 1) % 10 === 0) {
                console.log(`   📊 Processed ${i + 1}/${data.length}`);
            }
        }
        
        // Commit batch if not dry run
        if (!dryRun && batch) {
            console.log('💾 Committing batch write...');
            await batch.commit();
            clearCreatorCache();
        }
        
        const successCount = results.filter(r => r.status === 'imported' || r.status === 'dry_run').length;
        const failedCount = results.filter(r => r.status === 'failed').length;
        
        console.log(`✅ Import complete: ${successCount} succeeded, ${failedCount} failed`);
        
        res.status(dryRun ? 200 : 201).json({
            success: true,
            dryRun,
            imported: dryRun ? 0 : successCount,
            previewed: dryRun ? successCount : 0,
            failed: failedCount,
            total: data.length,
            results
        });
    } catch (error) {
        console.error('❌ Error in Apify import:', error.message);
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
        
        if (filters.subjectMatter) {
            const subjects = Array.isArray(filters.subjectMatter) ? filters.subjectMatter : [filters.subjectMatter];
            const lower = subjects.map(s => String(s).toLowerCase());
            creators = creators.filter(c => {
                const creatorSubjects = (c.craft?.subjectMatterTags ?? []).map(t => t.toLowerCase());
                return lower.some(s => creatorSubjects.includes(s));
            });
        }
        
        if (filters.subjectSubcategory) {
            const subcats = Array.isArray(filters.subjectSubcategory) ? filters.subjectSubcategory : [filters.subjectSubcategory];
            const lower = subcats.map(s => String(s).toLowerCase());
            creators = creators.filter(c => {
                const creatorSubcats = (c.craft?.subjectSubcategoryTags ?? []).map(t => t.toLowerCase());
                return lower.some(s => creatorSubcats.includes(s));
            });
        }
        
        if (filters.primaryMedium) {
            const medium = String(filters.primaryMedium).toLowerCase();
            creators = creators.filter(c => c.craft?.primaryMedium?.toLowerCase() === medium);
        }
        
        if (filters.budgetTier) {
            const tier = String(filters.budgetTier).toLowerCase();
            creators = creators.filter(c => c.contact?.budgetTier?.toLowerCase() === tier);
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
                styles: keywords.styles,
                subjects: keywords.subjects,
                primaryMediumHint: keywords.primaryMediumHint
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
// 📋 FEEDBACK API (thumbs up/down → monitored sheet, location TBD)
// =============================================================================
/**
 * POST /api/v1/feedback - Record thumbs up/down (or rating) for testing; appends to Google Sheet when FEEDBACK_SHEET_ID set.
 * Body: { event: 'match'|'semantic', briefOrQuery: string, sessionId?: string, resultId?: string, creatorId?: string, rating: 'up'|'down', comment?: string }
 */
app.post('/api/v1/feedback', async (req, res) => {
    const { event, briefOrQuery, sessionId, resultId, creatorId, rating, comment } = req.body || {};
    if (!rating || !['up', 'down'].includes(rating)) {
        return res.status(400).json({ success: false, error: 'rating is required and must be "up" or "down"' });
    }
    try {
        const appended = await appendFeedbackRow({
            event: event || 'match',
            briefOrQuery: briefOrQuery || '',
            sessionId: sessionId || '',
            resultId: resultId || '',
            creatorId: creatorId || '',
            rating,
            comment: comment || ''
        });
        res.json({ success: true, recorded: true, sheetAppended: appended });
    } catch (error) {
        console.error('❌ Feedback recording failed:', error.message);
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
        
        // Use LLM-powered categorization
        const categorization = await categorizeCreator(bio, portfolio_url, recentWork);
        
        console.log('✅ LLM categorization complete');
        
        res.json({
            success: true,
            input: { bio: bio.substring(0, 200), portfolio_url },
            categorization,
            model: CONFIG.model
        });
    } catch (error) {
        console.error('❌ Error categorizing:', error.message);
        
        // Fallback to keyword extraction if LLM fails
        console.log('⚠️ Falling back to keyword extraction...');
        const inputBio = req.body.bio || '';
        const keywords = extractBriefKeywords(inputBio);
        const detectedCraft = keywords.crafts[0] || 'other';
        const fallbackCategorization = {
            craft: {
                primary: detectedCraft,
                secondary: keywords.crafts.slice(1, 3),
                confidence: keywords.crafts.length > 0 ? 0.5 : 0.2,
                subjectMatterTags: keywords.subjects || [],
                subjectSubcategoryTags: [],
                primaryMedium: keywords.primaryMediumHint || undefined
            },
            technicalTags: keywords.technical.map(t => `#${t.replace(/\s+/g, '')}`),
            styleSignature: `Creator with focus on ${keywords.styles.slice(0, 3).join(', ') || 'visual storytelling'}.`,
            positiveKeywords: [...keywords.crafts, ...keywords.technical].slice(0, 10),
            negativeKeywords: [],
            reasoning: 'Fallback: LLM unavailable, used keyword extraction'
        };
        
        res.json({
            success: true,
            input: { bio: inputBio.substring(0, 200), portfolio_url: req.body.portfolio_url },
            categorization: fallbackCategorization,
            fallback: true,
            llmError: error.message
        });
    }
});

// =============================================================================
// 🎨 STYLE SIGNATURE API
// =============================================================================

/**
 * POST /api/v1/style-signature - Generate a style signature for a creator
 * Body: { name: string, craft: string, bio: string, technicalTags?: string[] }
 */
app.post('/api/v1/style-signature', async (req, res) => {
    console.log('📥 POST /api/v1/style-signature');
    
    try {
        const { name, craft, bio, technicalTags } = req.body;
        
        if (!name || !craft || !bio) {
            return res.status(400).json({
                success: false,
                error: 'name, craft, and bio are required'
            });
        }
        
        const styleSignature = await generateStyleSignature(name, craft, bio, technicalTags || []);
        
        console.log('✅ Style signature generated');
        
        res.json({
            success: true,
            name,
            craft,
            styleSignature,
            model: CONFIG.model
        });
    } catch (error) {
        console.error('❌ Error generating style signature:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/llm/test - Test LLM connection
 */
app.get('/api/v1/llm/test', async (req, res) => {
    console.log('📥 GET /api/v1/llm/test');
    
    try {
        const connected = await testLLMConnection();
        
        res.json({
            success: true,
            connected,
            model: CONFIG.model,
            message: connected ? 'LLM connection successful' : 'LLM connection failed'
        });
    } catch (error) {
        console.error('❌ LLM test failed:', error.message);
        res.status(500).json({
            success: false,
            connected: false,
            error: error.message
        });
    }
});

// =============================================================================
// 🔢 EMBEDDINGS API (Phase 3)
// =============================================================================

/**
 * GET /api/v1/embeddings/test - Test embedding generation
 */
app.get('/api/v1/embeddings/test', async (req, res) => {
    console.log('📥 GET /api/v1/embeddings/test');
    
    try {
        const embeddingResult = await testEmbeddings();
        const config = getEmbeddingConfig();
        
        res.json({
            success: embeddingResult.success,
            model: config.model,
            dimensions: embeddingResult.dimensions || config.dimensions,
            clientType: getClientType(),
            error: embeddingResult.error || null
        });
    } catch (error) {
        console.error('❌ Embedding test failed:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/v1/embeddings/generate/:id - Generate embedding for a specific creator
 */
app.post('/api/v1/embeddings/generate/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`📥 POST /api/v1/embeddings/generate/${id}`);
    
    try {
        // Get the creator
        const creatorDoc = await firestore.collection(CONFIG.creatorsCollection).doc(id).get();
        if (!creatorDoc.exists) {
            return res.status(404).json({ success: false, error: 'Creator not found' });
        }
        
        const creator = { id: creatorDoc.id, ...creatorDoc.data() };
        
        // Build embedding text from creator data
        const embeddingText = buildCreatorEmbeddingText(creator);
        console.log(`📝 Embedding text (${embeddingText.length} chars): ${embeddingText.substring(0, 100)}...`);
        
        // Generate embedding
        const embedding = await generateEmbedding(embeddingText, 'RETRIEVAL_DOCUMENT');
        
        // Store embedding in the creator document
        await firestore.collection(CONFIG.creatorsCollection).doc(id).update({
            embedding: embedding.values,
            embeddingText: embeddingText,
            embeddingModel: embedding.model,
            embeddingGeneratedAt: new Date().toISOString()
        });
        
        // Invalidate cache
        clearCreatorCache();
        
        res.json({
            success: true,
            creatorId: id,
            creatorName: creator.name,
            dimensions: embedding.dimensions,
            model: embedding.model,
            textLength: embeddingText.length
        });
    } catch (error) {
        console.error('❌ Embedding generation failed:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/embeddings/batch - Generate embeddings for all creators (or subset)
 */
app.post('/api/v1/embeddings/batch', async (req, res) => {
    console.log('📥 POST /api/v1/embeddings/batch');
    
    const { 
        onlyMissing = true,  // Only generate for creators without embeddings
        limit = 50,          // Max creators to process
        dryRun = false       // Preview without saving
    } = req.body;
    
    try {
        // Get creators
        let creators = await getCreators();
        
        // Filter to only those missing embeddings if requested
        if (onlyMissing) {
            creators = creators.filter(c => !c.embedding);
        }
        
        // Apply limit
        creators = creators.slice(0, limit);
        
        if (creators.length === 0) {
            return res.json({
                success: true,
                message: 'No creators need embeddings',
                processed: 0
            });
        }
        
        console.log(`🔢 Processing ${creators.length} creators...`);
        
        // Build embedding texts
        const embeddingTexts = creators.map(c => buildCreatorEmbeddingText(c));
        
        if (dryRun) {
            return res.json({
                success: true,
                dryRun: true,
                wouldProcess: creators.length,
                preview: creators.slice(0, 3).map((c, i) => ({
                    id: c.id,
                    name: c.name,
                    embeddingText: embeddingTexts[i].substring(0, 200) + '...'
                }))
            });
        }
        
        // Generate embeddings in batch
        const embeddings = await generateEmbeddings(embeddingTexts, 'RETRIEVAL_DOCUMENT');
        
        // Update each creator with their embedding
        const batch = firestore.batch();
        const results = [];
        
        for (let i = 0; i < creators.length; i++) {
            const creator = creators[i];
            const embedding = embeddings[i];
            
            batch.update(firestore.collection(CONFIG.creatorsCollection).doc(creator.id), {
                embedding: embedding.values,
                embeddingText: embeddingTexts[i],
                embeddingModel: embedding.model,
                embeddingGeneratedAt: new Date().toISOString()
            });
            
            results.push({
                id: creator.id,
                name: creator.name,
                dimensions: embedding.dimensions
            });
        }
        
        await batch.commit();
        
        // Invalidate cache
        clearCreatorCache();
        
        console.log(`✅ Generated embeddings for ${results.length} creators`);
        
        res.json({
            success: true,
            processed: results.length,
            model: embeddings[0]?.model,
            dimensions: embeddings[0]?.dimensions,
            creators: results
        });
    } catch (error) {
        console.error('❌ Batch embedding failed:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/similar/:id - Find creators similar to a given creator
 */
app.get('/api/v1/similar/:id', async (req, res) => {
    const { id } = req.params;
    const { limit = 5, minSimilarity = 0.5 } = req.query;
    
    console.log(`📥 GET /api/v1/similar/${id}?limit=${limit}&minSimilarity=${minSimilarity}`);
    
    try {
        // Get the target creator
        const creatorDoc = await firestore.collection(CONFIG.creatorsCollection).doc(id).get();
        if (!creatorDoc.exists) {
            return res.status(404).json({ success: false, error: 'Creator not found' });
        }
        
        const targetCreator = { id: creatorDoc.id, ...creatorDoc.data() };
        
        // Check if target has embedding
        if (!targetCreator.embedding) {
            return res.status(400).json({ 
                success: false, 
                error: 'Creator does not have an embedding. Generate one first with POST /api/v1/embeddings/generate/:id'
            });
        }
        
        // Get all creators with embeddings
        const allCreators = await getCreators();
        const creatorsWithEmbeddings = allCreators.filter(c => 
            c.embedding && c.id !== id
        );
        
        if (creatorsWithEmbeddings.length === 0) {
            return res.json({
                success: true,
                target: { id: targetCreator.id, name: targetCreator.name },
                similar: [],
                message: 'No other creators have embeddings yet'
            });
        }
        
        // Find similar creators
        const similar = findSimilar(
            targetCreator.embedding,
            creatorsWithEmbeddings,
            { 
                limit: parseInt(limit), 
                minSimilarity: parseFloat(minSimilarity) 
            }
        );
        
        res.json({
            success: true,
            target: {
                id: targetCreator.id,
                name: targetCreator.name,
                craft: targetCreator.craft?.primary
            },
            similar: similar.map(c => ({
                id: c.id,
                name: c.name,
                craft: c.craft?.primary,
                platform: c.platform,
                similarity: Math.round(c.similarity * 1000) / 1000,  // 3 decimal places
                isGoldenRecord: c.matching?.isGoldenRecord || false
            })),
            searchedCreators: creatorsWithEmbeddings.length
        });
    } catch (error) {
        console.error('❌ Similar search failed:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/search/semantic - Semantic search with a text query
 */
app.post('/api/v1/search/semantic', async (req, res) => {
    console.log('📥 POST /api/v1/search/semantic');
    
    const { query, limit = 10, minSimilarity = 0.3 } = req.body;
    
    if (!query) {
        return res.status(400).json({ success: false, error: 'Query is required' });
    }
    
    try {
        // Generate embedding for the search query
        const queryEmbedding = await generateEmbedding(query, 'RETRIEVAL_QUERY');
        
        // Get all creators with embeddings
        const allCreators = await getCreators();
        const creatorsWithEmbeddings = allCreators.filter(c => c.embedding);
        
        if (creatorsWithEmbeddings.length === 0) {
            return res.json({
                success: true,
                query,
                results: [],
                message: 'No creators have embeddings yet. Run POST /api/v1/embeddings/batch first.'
            });
        }
        
        // Find similar creators
        const results = findSimilar(
            queryEmbedding.values,
            creatorsWithEmbeddings,
            { limit, minSimilarity }
        );
        
        res.json({
            success: true,
            query,
            results: results.map(c => ({
                id: c.id,
                name: c.name,
                handle: c.handle,
                craft: c.craft?.primary,
                platform: c.platform,
                location: c.contact?.location,
                similarity: Math.round(c.similarity * 1000) / 1000,
                styleSignature: c.craft?.styleSignature,
                isGoldenRecord: c.matching?.isGoldenRecord || false
            })),
            totalSearched: creatorsWithEmbeddings.length,
            embeddingModel: queryEmbedding.model
        });
    } catch (error) {
        console.error('❌ Semantic search failed:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// =============================================================================
// 🌟 GOLDEN RECORD LOOKALIKE API (Phase 3.3)
// =============================================================================

// Cache for the Golden Record model
let goldenRecordModel = null;
let goldenRecordModelTime = null;
const GOLDEN_RECORD_MODEL_TTL = 5 * 60 * 1000; // 5 minute cache

/**
 * Build or retrieve cached Golden Record model
 */
async function getGoldenRecordModel(forceRefresh = false) {
    if (!forceRefresh && goldenRecordModel && goldenRecordModelTime && 
        (Date.now() - goldenRecordModelTime) < GOLDEN_RECORD_MODEL_TTL) {
        return goldenRecordModel;
    }
    
    const allCreators = await getCreators();
    const goldenRecords = allCreators.filter(c => 
        c.matching?.isGoldenRecord && c.embedding
    );
    
    if (goldenRecords.length === 0) {
        return null;
    }
    
    goldenRecordModel = buildGoldenRecordModel(goldenRecords);
    goldenRecordModelTime = Date.now();
    
    console.log(`🌟 Golden Record model built from ${goldenRecords.length} creators`);
    return goldenRecordModel;
}

/**
 * GET /api/v1/lookalikes/model - Get Golden Record model info
 */
app.get('/api/v1/lookalikes/model', async (req, res) => {
    console.log('📥 GET /api/v1/lookalikes/model');
    
    try {
        const model = await getGoldenRecordModel();
        
        if (!model) {
            return res.json({
                success: true,
                model: null,
                message: 'No Golden Records with embeddings found. Import Golden Records first.'
            });
        }
        
        // Get names of Golden Records
        const allCreators = await getCreators();
        const goldenRecordNames = model.goldenRecordIds.map(id => {
            const creator = allCreators.find(c => c.id === id);
            return creator ? { id, name: creator.name, craft: creator.craft?.primary } : { id };
        });
        
        res.json({
            success: true,
            model: {
                goldenRecordCount: model.goldenRecordCount,
                dimensions: model.dimensions,
                goldenRecords: goldenRecordNames,
                createdAt: model.createdAt,
                cacheAge: goldenRecordModelTime ? Math.floor((Date.now() - goldenRecordModelTime) / 1000) + 's' : null
            }
        });
    } catch (error) {
        console.error('❌ Golden Record model fetch failed:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/lookalikes - Find creators most similar to Golden Records
 */
app.get('/api/v1/lookalikes', async (req, res) => {
    const { limit = 10, minSimilarity = 0.5, includeGoldenRecords = false } = req.query;
    console.log(`📥 GET /api/v1/lookalikes?limit=${limit}&minSimilarity=${minSimilarity}`);
    
    try {
        const model = await getGoldenRecordModel();
        
        if (!model) {
            return res.json({
                success: true,
                results: [],
                message: 'No Golden Records with embeddings found. Import Golden Records first.'
            });
        }
        
        // Get all creators with embeddings
        const allCreators = await getCreators();
        const creatorsWithEmbeddings = allCreators.filter(c => c.embedding);
        
        // Find lookalikes
        const lookalikes = findLookalikes(
            model,
            creatorsWithEmbeddings,
            {
                limit: parseInt(limit),
                minSimilarity: parseFloat(minSimilarity),
                excludeGoldenRecords: includeGoldenRecords !== 'true'
            }
        );
        
        res.json({
            success: true,
            goldenRecordCount: model.goldenRecordCount,
            results: lookalikes.map(c => ({
                id: c.id,
                name: c.name,
                handle: c.handle,
                craft: c.craft?.primary,
                platform: c.platform,
                location: c.contact?.location,
                goldenRecordSimilarity: Math.round(c.goldenRecordSimilarity * 1000) / 1000,
                styleSignature: c.craft?.styleSignature,
                isGoldenRecord: c.matching?.isGoldenRecord || false
            })),
            totalSearched: creatorsWithEmbeddings.length,
            excludedGoldenRecords: includeGoldenRecords !== 'true'
        });
    } catch (error) {
        console.error('❌ Lookalike search failed:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/v1/lookalikes/score/:id - Get a specific creator's Golden Record similarity score
 */
app.get('/api/v1/lookalikes/score/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`📥 GET /api/v1/lookalikes/score/${id}`);
    
    try {
        const model = await getGoldenRecordModel();
        
        if (!model) {
            return res.status(400).json({
                success: false,
                error: 'No Golden Records with embeddings found'
            });
        }
        
        // Get the creator
        const creatorDoc = await firestore.collection(CONFIG.creatorsCollection).doc(id).get();
        if (!creatorDoc.exists) {
            return res.status(404).json({ success: false, error: 'Creator not found' });
        }
        
        const creator = { id: creatorDoc.id, ...creatorDoc.data() };
        
        if (!creator.embedding) {
            return res.status(400).json({
                success: false,
                error: 'Creator does not have an embedding'
            });
        }
        
        const score = scoreAgainstGoldenRecords(creator.embedding, model);
        
        // Also get similarity to each individual Golden Record
        const allCreators = await getCreators();
        const goldenRecords = allCreators.filter(c => 
            c.matching?.isGoldenRecord && c.embedding
        );
        
        const individualScores = goldenRecords.map(gr => ({
            id: gr.id,
            name: gr.name,
            craft: gr.craft?.primary,
            similarity: Math.round(cosineSimilarity(creator.embedding, gr.embedding) * 1000) / 1000
        })).sort((a, b) => b.similarity - a.similarity);
        
        res.json({
            success: true,
            creator: {
                id: creator.id,
                name: creator.name,
                craft: creator.craft?.primary,
                isGoldenRecord: creator.matching?.isGoldenRecord || false
            },
            goldenRecordSimilarity: Math.round(score * 1000) / 1000,
            comparedAgainst: model.goldenRecordCount,
            individualScores: individualScores.slice(0, 5)  // Top 5 most similar Golden Records
        });
    } catch (error) {
        console.error('❌ Lookalike score failed:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/v1/lookalikes/refresh - Force refresh the Golden Record model
 */
app.post('/api/v1/lookalikes/refresh', async (req, res) => {
    console.log('📥 POST /api/v1/lookalikes/refresh');
    
    try {
        goldenRecordModel = null;
        goldenRecordModelTime = null;
        
        const model = await getGoldenRecordModel(true);
        
        if (!model) {
            return res.json({
                success: true,
                message: 'No Golden Records with embeddings found'
            });
        }
        
        res.json({
            success: true,
            message: 'Golden Record model refreshed',
            goldenRecordCount: model.goldenRecordCount,
            dimensions: model.dimensions
        });
    } catch (error) {
        console.error('❌ Model refresh failed:', error.message);
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
// =============================================================================
// SPA FALLBACK (must be LAST route before server start)
// =============================================================================
// Any non-API route that doesn't match a static file falls through to index.html
// so React Router can handle client-side routing.
if (fs.existsSync(webDistPath)) {
    app.get('/app', (req, res) => {
        res.sendFile(path.join(webDistPath, 'index.html'));
    });
    app.get('/app/{*path}', (req, res) => {
        res.sendFile(path.join(webDistPath, 'index.html'));
    });
}

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
  GET  /health                      - Health check
  GET  /dashboard                   - Monitoring dashboard
  GET  /testing                     - Temp testing UI (match + thumbs up/down feedback)
  POST /api/v1/feedback             - Thumbs up/down → monitored sheet (FEEDBACK_SHEET_ID)
  GET  /api/v1/creators             - List/search creators
  GET  /api/v1/creators/:id         - Get creator by ID
  POST /api/v1/creators             - Add creator
  POST /api/v1/creators/batch       - Bulk import
  POST /api/v1/import/apify         - Apify scraper import
  POST /api/v1/match                - Match creators to brief
  POST /api/v1/categorize           - LLM auto-categorize
  POST /api/v1/style-signature      - Generate style signature
  GET  /api/v1/llm/test             - Test LLM connection
  GET  /api/v1/embeddings/test      - Test embeddings
  POST /api/v1/embeddings/generate/:id - Generate creator embedding
  POST /api/v1/embeddings/batch     - Batch generate embeddings
  GET  /api/v1/similar/:id          - Find similar creators
  POST /api/v1/search/semantic      - Semantic search
  GET  /api/v1/lookalikes           - Find Golden Record lookalikes
  GET  /api/v1/lookalikes/model     - Get model info
  GET  /api/v1/lookalikes/score/:id - Score creator vs Golden Records
  POST /api/v1/lookalikes/refresh   - Refresh model cache
  GET  /api/v1/stats                - Database statistics
============================================================
`);
});

module.exports = app;
