/**
 * @file llm.ts
 * @description Gemini LLM integration for creator categorization and style analysis
 *              Supports both Google AI API (with API key) and Vertex AI (with ADC)
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-01-28
 */

import { GoogleGenAI } from '@google/genai';
import { VertexAI } from '@google-cloud/vertexai';
import { CRAFT_TYPES, CraftType } from './schemas';

// =============================================================================
// ðŸ”§ CONFIGURATION
// =============================================================================

const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'catchfire-app-2026';
const GCP_REGION = process.env.GCP_REGION || 'us-central1';

// Client instances
let genAI: GoogleGenAI | null = null;
let vertexAI: VertexAI | null = null;
let useVertexAI = false;

/**
 * Initialize the appropriate AI client based on available credentials
 * Prefers API key (Google AI), falls back to Vertex AI with ADC
 */
function initializeClient(): void {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (apiKey) {
        // Use Google AI API with API key
        genAI = new GoogleGenAI({ apiKey });
        useVertexAI = false;
        console.log('âœ… Gemini AI client initialized (Google AI API)');
    } else {
        // Fall back to Vertex AI with ADC
        vertexAI = new VertexAI({
            project: GCP_PROJECT_ID,
            location: GCP_REGION
        });
        useVertexAI = true;
        console.log(`âœ… Gemini AI client initialized (Vertex AI: ${GCP_PROJECT_ID}/${GCP_REGION})`);
    }
}

/**
 * Generate content using whichever client is available
 */
async function generateContent(prompt: string, options: { temperature?: number; maxOutputTokens?: number } = {}): Promise<string> {
    // Initialize on first use
    if (!genAI && !vertexAI) {
        initializeClient();
    }
    
    const { temperature = 0.3, maxOutputTokens = 1024 } = options;
    
    if (useVertexAI && vertexAI) {
        // Use Vertex AI
        const model = vertexAI.getGenerativeModel({ model: MODEL_ID });
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature,
                maxOutputTokens
            }
        });
        const response = result.response;
        return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (genAI) {
        // Use Google AI API
        const response = await genAI.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
                temperature,
                maxOutputTokens
            }
        });
        return response.text || '';
    } else {
        throw new Error('No AI client available');
    }
}

// =============================================================================
// ðŸŽ¬ CRAFT CATEGORIZATION
// =============================================================================

export interface CategorizationResult {
    craft: {
        primary: CraftType;
        secondary: string[];
        confidence: number;
    };
    technicalTags: string[];
    styleSignature: string;
    positiveKeywords: string[];
    negativeKeywords: string[];
    reasoning: string;
}

const CATEGORIZATION_PROMPT = `You are an expert at categorizing creative professionals in the film, video, and digital arts industry. 

Analyze the following creator bio/description and extract structured information about their craft.

AVAILABLE CRAFT TYPES (use exactly one for primary):
${CRAFT_TYPES.join(', ')}

IMPORTANT CONTEXT:
- This is for CatchFire, a system that values CRAFT over CLOUT
- We want professionals with technical skill, not social media influencers
- Positive indicators: professional equipment mentions, festival awards, specific techniques
- Negative indicators: #fyp, #viral, #trending, lifestyle content, influencer language

Given this bio, return ONLY valid JSON (no markdown, no explanation):

{
  "craft": {
    "primary": "the most relevant CRAFT_TYPE from the list above",
    "secondary": ["up to 3 secondary crafts from the list"],
    "confidence": 0.0 to 1.0
  },
  "technicalTags": ["#EquipmentOrTechnique", "max 10 tags"],
  "styleSignature": "A 1-2 sentence description of their unique visual/creative style",
  "positiveKeywords": ["professional indicators found in bio"],
  "negativeKeywords": ["influencer/lifestyle indicators found, if any"],
  "reasoning": "Brief explanation of why you categorized them this way"
}

BIO TO ANALYZE:
`;

/**
 * Use LLM to categorize a creator based on their bio
 */
export async function categorizeCreator(
    bio: string,
    portfolioUrl?: string,
    recentWork?: string[]
): Promise<CategorizationResult> {
    // Build context
    let context = bio;
    if (portfolioUrl) {
        context += `\n\nPortfolio URL: ${portfolioUrl}`;
    }
    if (recentWork && recentWork.length > 0) {
        context += `\n\nRecent work: ${recentWork.join(', ')}`;
    }
    
    const prompt = CATEGORIZATION_PROMPT + context;
    
    console.log(`ðŸ¤– Categorizing with ${MODEL_ID}...`);
    const startTime = Date.now();
    
    try {
        const text = await generateContent(prompt, { temperature: 0.3, maxOutputTokens: 1024 });
        
        const elapsed = Date.now() - startTime;
        console.log(`â±ï¸ LLM response in ${elapsed}ms`);
        
        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in LLM response');
        }
        
        const result = JSON.parse(jsonMatch[0]) as CategorizationResult;
        
        // Validate and normalize the craft type
        if (!CRAFT_TYPES.includes(result.craft.primary as CraftType)) {
            result.craft.primary = 'other';
        }
        
        // Ensure arrays exist
        result.craft.secondary = result.craft.secondary || [];
        result.technicalTags = result.technicalTags || [];
        result.positiveKeywords = result.positiveKeywords || [];
        result.negativeKeywords = result.negativeKeywords || [];
        
        return result;
    } catch (error) {
        console.error('âŒ LLM categorization failed:', error);
        throw error;
    }
}

// =============================================================================
// ðŸŽ¨ STYLE SIGNATURE GENERATION
// =============================================================================

const STYLE_SIGNATURE_PROMPT = `You are an expert at describing creative professionals' unique visual and storytelling styles.

Given the following information about a creator, write a compelling 2-3 sentence "style signature" that captures their unique aesthetic and creative approach. This should read like a professional talent agency description.

Focus on:
- Visual aesthetic (cinematic, minimalist, vibrant, moody, etc.)
- Technical approach (practical effects, digital, hybrid, etc.)
- Storytelling style (documentary, narrative, experimental, etc.)
- Emotional tone (intimate, epic, playful, intense, etc.)

Creator Information:
- Name: {name}
- Primary Craft: {craft}
- Bio: {bio}
- Technical Tags: {tags}

Return ONLY the style signature text, no quotes or explanation:`;

/**
 * Generate a style signature for a creator
 */
export async function generateStyleSignature(
    name: string,
    craft: string,
    bio: string,
    technicalTags: string[] = []
): Promise<string> {
    const prompt = STYLE_SIGNATURE_PROMPT
        .replace('{name}', name)
        .replace('{craft}', craft)
        .replace('{bio}', bio)
        .replace('{tags}', technicalTags.join(', ') || 'none specified');
    
    console.log(`ðŸŽ¨ Generating style signature for ${name}...`);
    const startTime = Date.now();
    
    try {
        const text = await generateContent(prompt, { temperature: 0.7, maxOutputTokens: 256 });
        
        const elapsed = Date.now() - startTime;
        console.log(`â±ï¸ Style signature generated in ${elapsed}ms`);
        
        const signature = text.trim();
        return signature || `${name} is a talented ${craft} with a distinctive creative vision.`;
    } catch (error) {
        console.error('âŒ Style signature generation failed:', error);
        return `${name} is a talented ${craft} with a distinctive creative vision.`;
    }
}

// =============================================================================
// ðŸ” BRIEF ANALYSIS
// =============================================================================

const BRIEF_ANALYSIS_PROMPT = `You are an expert at analyzing creative project briefs for talent matching.

Analyze the following client brief and extract the key requirements for matching with creative professionals.

Return ONLY valid JSON (no markdown, no explanation):

{
  "craftsNeeded": ["list of craft types needed, from: ${CRAFT_TYPES.join(', ')}"],
  "technicalRequirements": ["specific equipment, software, or techniques mentioned"],
  "styleKeywords": ["aesthetic/style terms that describe the desired look"],
  "locationRequirements": ["any geographic requirements or constraints"],
  "budgetIndicators": ["any budget-related mentions"],
  "urgencyLevel": "low" | "medium" | "high",
  "projectType": "commercial" | "film" | "music_video" | "documentary" | "branded_content" | "other",
  "summary": "One sentence summary of what they're looking for"
}

BRIEF:
`;

export interface BriefAnalysis {
    craftsNeeded: string[];
    technicalRequirements: string[];
    styleKeywords: string[];
    locationRequirements: string[];
    budgetIndicators: string[];
    urgencyLevel: 'low' | 'medium' | 'high';
    projectType: string;
    summary: string;
}

/**
 * Analyze a client brief using LLM for better matching
 */
export async function analyzeBrief(brief: string): Promise<BriefAnalysis> {
    const prompt = BRIEF_ANALYSIS_PROMPT + brief;
    
    console.log('ðŸ“‹ Analyzing brief with LLM...');
    const startTime = Date.now();
    
    try {
        const text = await generateContent(prompt, { temperature: 0.2, maxOutputTokens: 512 });
        
        const elapsed = Date.now() - startTime;
        console.log(`â±ï¸ Brief analysis in ${elapsed}ms`);
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in LLM response');
        }
        
        return JSON.parse(jsonMatch[0]) as BriefAnalysis;
    } catch (error) {
        console.error('âŒ Brief analysis failed:', error);
        // Return a basic analysis on failure
        return {
            craftsNeeded: [],
            technicalRequirements: [],
            styleKeywords: [],
            locationRequirements: [],
            budgetIndicators: [],
            urgencyLevel: 'medium',
            projectType: 'other',
            summary: brief.substring(0, 100)
        };
    }
}

// =============================================================================
// ðŸ”¢ EMBEDDINGS
// =============================================================================

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 768; // Good balance of quality and storage

/**
 * Task types for embeddings - affects how the model optimizes the vectors
 */
export type EmbeddingTaskType = 
    | 'RETRIEVAL_DOCUMENT'    // For indexing documents/creators
    | 'RETRIEVAL_QUERY'       // For search queries
    | 'SEMANTIC_SIMILARITY'   // For finding similar items
    | 'CLASSIFICATION'        // For categorization
    | 'CLUSTERING';           // For grouping similar items

export interface EmbeddingResult {
    values: number[];
    dimensions: number;
    model: string;
}

export interface CreatorEmbeddingData {
    id: string;
    name: string;
    embedding: number[];
    embeddingText: string;  // The text that was embedded
    generatedAt: Date;
}

/**
 * Build the text to embed for a creator profile
 * Combines relevant fields for semantic search
 */
export function buildCreatorEmbeddingText(creator: {
    name: string;
    handle?: string;
    craft?: { primary?: string; secondary?: string[]; styleSignature?: string };
    matching?: { positiveKeywords?: string[]; technicalTags?: string[] };
    contact?: { location?: string };
    bio?: string;
}): string {
    const parts: string[] = [];
    
    // Name and handle
    parts.push(`Creator: ${creator.name}`);
    if (creator.handle) parts.push(`Handle: ${creator.handle}`);
    
    // Craft info
    if (creator.craft?.primary) {
        parts.push(`Primary craft: ${creator.craft.primary}`);
    }
    if (creator.craft?.secondary?.length) {
        parts.push(`Secondary crafts: ${creator.craft.secondary.join(', ')}`);
    }
    if (creator.craft?.styleSignature) {
        parts.push(`Style: ${creator.craft.styleSignature}`);
    }
    
    // Technical tags and keywords
    if (creator.matching?.technicalTags?.length) {
        parts.push(`Technical expertise: ${creator.matching.technicalTags.join(', ')}`);
    }
    if (creator.matching?.positiveKeywords?.length) {
        parts.push(`Keywords: ${creator.matching.positiveKeywords.join(', ')}`);
    }
    
    // Location
    if (creator.contact?.location) {
        parts.push(`Location: ${creator.contact.location}`);
    }
    
    // Bio if available
    if (creator.bio) {
        parts.push(`Bio: ${creator.bio}`);
    }
    
    return parts.join('. ');
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(
    text: string,
    taskType: EmbeddingTaskType = 'RETRIEVAL_DOCUMENT'
): Promise<EmbeddingResult> {
    // Initialize client if needed
    if (!genAI && !vertexAI) {
        initializeClient();
    }
    
    console.log(`ðŸ”¢ Generating embedding (${EMBEDDING_DIMENSIONS}d, ${taskType})...`);
    const startTime = Date.now();
    
    try {
        if (genAI) {
            // Use Google AI API
            const response = await genAI.models.embedContent({
                model: EMBEDDING_MODEL,
                contents: text,
                config: {
                    taskType,
                    outputDimensionality: EMBEDDING_DIMENSIONS
                }
            });
            
            const elapsed = Date.now() - startTime;
            console.log(`â±ï¸ Embedding generated in ${elapsed}ms`);
            
            // Get the embedding from response
            const embedding = response.embeddings?.[0];
            if (!embedding?.values) {
                throw new Error('No embedding values in response');
            }
            
            return {
                values: embedding.values,
                dimensions: embedding.values.length,
                model: EMBEDDING_MODEL
            };
        } else if (vertexAI) {
            // Vertex AI doesn't have native embeddings in the same SDK
            // We need to use the prediction API or fall back to REST
            throw new Error('Vertex AI embeddings require API key. Please set GEMINI_API_KEY.');
        } else {
            throw new Error('No AI client available');
        }
    } catch (error) {
        console.error('âŒ Embedding generation failed:', error);
        throw error;
    }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(
    texts: string[],
    taskType: EmbeddingTaskType = 'RETRIEVAL_DOCUMENT'
): Promise<EmbeddingResult[]> {
    // Initialize client if needed
    if (!genAI && !vertexAI) {
        initializeClient();
    }
    
    console.log(`ðŸ”¢ Generating ${texts.length} embeddings (${EMBEDDING_DIMENSIONS}d, ${taskType})...`);
    const startTime = Date.now();
    
    try {
        if (genAI) {
            // Use Google AI API batch endpoint
            const response = await genAI.models.embedContent({
                model: EMBEDDING_MODEL,
                contents: texts,
                config: {
                    taskType,
                    outputDimensionality: EMBEDDING_DIMENSIONS
                }
            });
            
            const elapsed = Date.now() - startTime;
            console.log(`â±ï¸ ${texts.length} embeddings generated in ${elapsed}ms`);
            
            if (!response.embeddings?.length) {
                throw new Error('No embeddings in response');
            }
            
            return response.embeddings.map(emb => {
                if (!emb.values) {
                    throw new Error('Missing values in embedding response');
                }
                return {
                    values: emb.values,
                    dimensions: emb.values.length,
                    model: EMBEDDING_MODEL
                };
            });
        } else if (vertexAI) {
            throw new Error('Vertex AI embeddings require API key. Please set GEMINI_API_KEY.');
        } else {
            throw new Error('No AI client available');
        }
    } catch (error) {
        console.error('âŒ Batch embedding generation failed:', error);
        throw error;
    }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns a value between -1 (opposite) and 1 (identical)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) {
        return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find the most similar embeddings to a query embedding
 */
export function findSimilar(
    queryEmbedding: number[],
    candidates: { id: string; embedding: number[]; [key: string]: any }[],
    options: { limit?: number; minSimilarity?: number } = {}
): Array<{ id: string; similarity: number; [key: string]: any }> {
    const { limit = 10, minSimilarity = 0 } = options;
    
    const scored = candidates
        .map(candidate => ({
            ...candidate,
            similarity: cosineSimilarity(queryEmbedding, candidate.embedding)
        }))
        .filter(c => c.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    
    return scored;
}

/**
 * Normalize an embedding vector to unit length
 * Required for smaller dimensions (768, 1536) to ensure accurate similarity
 */
export function normalizeEmbedding(embedding: number[]): number[] {
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return embedding;
    return embedding.map(val => val / norm);
}

// =============================================================================
// ðŸŒŸ GOLDEN RECORD LOOKALIKE MODEL
// =============================================================================

export interface GoldenRecordModel {
    centroid: number[];
    goldenRecordCount: number;
    goldenRecordIds: string[];
    dimensions: number;
    createdAt: Date;
}

/**
 * Calculate the centroid (average) of multiple embedding vectors
 * This represents the "ideal" Golden Record profile
 */
export function calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) {
        throw new Error('Cannot calculate centroid of empty array');
    }
    
    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);
    
    // Sum all embeddings
    for (const embedding of embeddings) {
        if (embedding.length !== dimensions) {
            throw new Error(`Embedding dimension mismatch: expected ${dimensions}, got ${embedding.length}`);
        }
        for (let i = 0; i < dimensions; i++) {
            centroid[i] += embedding[i];
        }
    }
    
    // Average
    for (let i = 0; i < dimensions; i++) {
        centroid[i] /= embeddings.length;
    }
    
    // Normalize for consistent similarity scoring
    return normalizeEmbedding(centroid);
}

/**
 * Build a Golden Record model from a list of Golden Record creators
 */
export function buildGoldenRecordModel(
    goldenRecords: Array<{ id: string; embedding: number[] }>
): GoldenRecordModel {
    if (goldenRecords.length === 0) {
        throw new Error('No Golden Records provided');
    }
    
    const embeddings = goldenRecords.map(gr => gr.embedding);
    const centroid = calculateCentroid(embeddings);
    
    return {
        centroid,
        goldenRecordCount: goldenRecords.length,
        goldenRecordIds: goldenRecords.map(gr => gr.id),
        dimensions: centroid.length,
        createdAt: new Date()
    };
}

/**
 * Score a creator against the Golden Record model
 * Returns a similarity score (0-1) indicating how close they are to the ideal
 */
export function scoreAgainstGoldenRecords(
    creatorEmbedding: number[],
    model: GoldenRecordModel
): number {
    return cosineSimilarity(creatorEmbedding, model.centroid);
}

/**
 * Find lookalikes: creators most similar to the Golden Record model
 */
export function findLookalikes(
    model: GoldenRecordModel,
    candidates: Array<{ id: string; embedding: number[]; [key: string]: any }>,
    options: { limit?: number; minSimilarity?: number; excludeGoldenRecords?: boolean } = {}
): Array<{ id: string; goldenRecordSimilarity: number; [key: string]: any }> {
    const { limit = 10, minSimilarity = 0, excludeGoldenRecords = true } = options;
    
    let filtered = candidates;
    
    // Optionally exclude Golden Records from results
    if (excludeGoldenRecords) {
        const grIds = new Set(model.goldenRecordIds);
        filtered = candidates.filter(c => !grIds.has(c.id));
    }
    
    // Score and rank
    const scored = filtered
        .map(candidate => ({
            ...candidate,
            goldenRecordSimilarity: cosineSimilarity(candidate.embedding, model.centroid)
        }))
        .filter(c => c.goldenRecordSimilarity >= minSimilarity)
        .sort((a, b) => b.goldenRecordSimilarity - a.goldenRecordSimilarity)
        .slice(0, limit);
    
    return scored;
}

/**
 * Calculate per-craft Golden Record models
 * Useful for finding lookalikes within specific crafts
 */
export function buildCraftSpecificModels(
    goldenRecords: Array<{ id: string; embedding: number[]; craft?: { primary?: string } }>
): Map<string, GoldenRecordModel> {
    const craftGroups = new Map<string, Array<{ id: string; embedding: number[] }>>();
    
    // Group by craft
    for (const gr of goldenRecords) {
        const craft = gr.craft?.primary || 'other';
        if (!craftGroups.has(craft)) {
            craftGroups.set(craft, []);
        }
        craftGroups.get(craft)!.push({ id: gr.id, embedding: gr.embedding });
    }
    
    // Build model for each craft
    const models = new Map<string, GoldenRecordModel>();
    for (const [craft, records] of craftGroups) {
        if (records.length > 0) {
            models.set(craft, buildGoldenRecordModel(records));
        }
    }
    
    return models;
}

// =============================================================================
// ðŸ§ª TEST FUNCTIONS
// =============================================================================

/**
 * Test the LLM connection
 */
export async function testLLMConnection(): Promise<boolean> {
    try {
        const text = await generateContent('Reply with just the word "connected" if you can read this.');
        return text.toLowerCase().includes('connected');
    } catch (error) {
        console.error('âŒ LLM connection test failed:', error);
        return false;
    }
}

/**
 * Test the embedding generation
 */
export async function testEmbeddings(): Promise<{ success: boolean; dimensions?: number; error?: string }> {
    try {
        const result = await generateEmbedding('Test embedding for CatchFire', 'RETRIEVAL_DOCUMENT');
        return {
            success: true,
            dimensions: result.dimensions
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get the current client type being used
 */
export function getClientType(): string {
    if (!genAI && !vertexAI) {
        initializeClient();
    }
    return useVertexAI ? `Vertex AI (${GCP_PROJECT_ID})` : 'Google AI API';
}

/**
 * Get embedding configuration info
 */
export function getEmbeddingConfig(): { model: string; dimensions: number } {
    return {
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS
    };
}
