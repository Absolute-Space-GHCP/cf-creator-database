/**
 * @file llm.ts
 * @description Gemini LLM integration for creator categorization and style analysis
 *              Uses @google/genai SDK for both API key and Vertex AI (ADC) auth
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-03-05
 */

import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { CRAFT_TYPES, CraftType } from './schemas';

// =============================================================================
// 🔧 CONFIGURATION
// =============================================================================

const MODEL_ID = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID || 'catchfire-app-2026';
const GCP_REGION = process.env.GCP_REGION || 'us-central1';

// Unified client instance
let genAI: GoogleGenAI | null = null;
let clientMode: 'api_key' | 'vertex_ai' = 'api_key';

/**
 * Initialize the AI client using @google/genai SDK
 * Prefers API key (Google AI), falls back to Vertex AI with ADC
 */
function initializeClient(): void {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (apiKey) {
        genAI = new GoogleGenAI({ apiKey });
        clientMode = 'api_key';
        console.log('✅ Gemini AI client initialized (Google AI API)');
    } else {
        genAI = new GoogleGenAI({
            vertexai: true,
            project: GCP_PROJECT_ID,
            location: GCP_REGION
        });
        clientMode = 'vertex_ai';
        console.log(`✅ Gemini AI client initialized (Vertex AI: ${GCP_PROJECT_ID}/${GCP_REGION})`);
    }
}

/**
 * Generate content using the unified @google/genai client
 */
async function generateContent(prompt: string, options: { temperature?: number; maxOutputTokens?: number } = {}): Promise<string> {
    if (!genAI) {
        initializeClient();
    }
    
    if (!genAI) {
        throw new Error('No AI client available');
    }
    
    const { temperature = 0.3, maxOutputTokens = 1024 } = options;
    
    const response = await genAI.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
            temperature,
            maxOutputTokens
        }
    });
    return response.text || '';
}

// =============================================================================
// 🎬 CRAFT CATEGORIZATION
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
    
    console.log(`🤖 Categorizing with ${MODEL_ID}...`);
    const startTime = Date.now();
    
    try {
        const text = await generateContent(prompt, { temperature: 0.3, maxOutputTokens: 1024 });
        
        const elapsed = Date.now() - startTime;
        console.log(`⏱️ LLM response in ${elapsed}ms`);
        
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
        console.error('❌ LLM categorization failed:', error);
        throw error;
    }
}

// =============================================================================
// 🎨 STYLE SIGNATURE GENERATION
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
    
    console.log(`🎨 Generating style signature for ${name}...`);
    const startTime = Date.now();
    
    try {
        const text = await generateContent(prompt, { temperature: 0.7, maxOutputTokens: 256 });
        
        const elapsed = Date.now() - startTime;
        console.log(`⏱️ Style signature generated in ${elapsed}ms`);
        
        const signature = text.trim();
        return signature || `${name} is a talented ${craft} with a distinctive creative vision.`;
    } catch (error) {
        console.error('❌ Style signature generation failed:', error);
        return `${name} is a talented ${craft} with a distinctive creative vision.`;
    }
}

// =============================================================================
// 📸 IMAGE ANALYSIS (Gemini Vision)
// =============================================================================

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif'
];

export interface ImageAnalysis {
    technicalTags: string[];
    styleKeywords: string[];
    subjectMatter: string[];
    colorPalette: string[];
    moodDescriptor: string;
    equipmentGuess: string[];
}

const IMAGE_ANALYSIS_PROMPT = `You are an expert creative director and technical analyst evaluating portfolio images for a talent matching platform called CatchFire, which values CRAFT over CLOUT.

Analyze this image as a seasoned creative professional would, focusing on technical execution and artistic merit.

Return ONLY valid JSON (no markdown fences, no explanation) with this exact structure:

{
  "technicalTags": ["#HashtagFormat tags for camera/equipment/technique indicators, e.g. #NaturalLight, #Anamorphic, #35mm, #MediumFormat, #StudioLighting, #PracticalEffects, #LongExposure. Max 8 tags."],
  "styleKeywords": ["Descriptive style terms like cinematic, minimalist, high-contrast, desaturated, warm-toned, editorial, moody, documentary, surreal. Max 8 keywords."],
  "subjectMatter": ["What is being photographed or filmed: portrait, landscape, product, food, architecture, automotive, fashion, sports, nature, street, event, abstract. Max 5 items."],
  "colorPalette": ["Dominant colors and color treatment: warm earth tones, cool blues, muted pastels, high saturation, monochromatic, teal-and-orange, etc. Max 5 descriptors."],
  "moodDescriptor": "A single concise phrase capturing the emotional tone: intimate and contemplative, bold and energetic, serene and ethereal, gritty and raw, etc.",
  "equipmentGuess": ["Best guesses at equipment/tools based on visual evidence: full-frame DSLR, medium format, cinema camera, drone, iPhone, mirrorless, anamorphic lens, vintage glass, studio strobes, LED panels. Only include if you have reasonable confidence. Max 5 items."]
}

Analyze the image now:`;

/**
 * Analyze a portfolio image using Gemini Vision to extract visual style data
 */
export async function analyzePortfolioImage(imageUrl: string): Promise<ImageAnalysis> {
    if (!genAI) {
        initializeClient();
    }
    if (!genAI) {
        throw new Error('No AI client available');
    }

    console.log(`📸 Analyzing portfolio image: ${imageUrl.substring(0, 80)}...`);
    const startTime = Date.now();

    // Fetch the image
    let imageBuffer: Buffer;
    let mimeType: string;
    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            maxContentLength: MAX_IMAGE_SIZE_BYTES,
            maxBodyLength: MAX_IMAGE_SIZE_BYTES,
            headers: {
                'Accept': 'image/*',
                'User-Agent': 'CatchFire-ImageAnalyzer/1.0'
            }
        });

        const contentType = (response.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(contentType)) {
            throw new Error(`Unsupported content type: ${contentType}. Expected one of: ${ALLOWED_IMAGE_MIME_TYPES.join(', ')}`);
        }

        const contentLength = response.data.byteLength;
        if (contentLength > MAX_IMAGE_SIZE_BYTES) {
            throw new Error(`Image too large: ${(contentLength / 1024 / 1024).toFixed(1)}MB exceeds ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB limit`);
        }

        imageBuffer = Buffer.from(response.data);
        mimeType = contentType;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
                throw new Error(`Image fetch timed out for URL: ${imageUrl}`);
            }
            if (error.response?.status === 404) {
                throw new Error(`Image not found (404): ${imageUrl}`);
            }
            throw new Error(`Failed to fetch image: ${error.message}`);
        }
        throw error;
    }

    const fetchTime = Date.now() - startTime;
    console.log(`   Fetched ${(imageBuffer.length / 1024).toFixed(0)}KB image (${mimeType}) in ${fetchTime}ms`);

    // Convert to base64 and send to Gemini
    const base64Image = imageBuffer.toString('base64');

    try {
        const response = await genAI.models.generateContent({
            model: MODEL_ID,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: IMAGE_ANALYSIS_PROMPT },
                        { inlineData: { mimeType, data: base64Image } }
                    ]
                }
            ],
            config: {
                temperature: 0.3,
                maxOutputTokens: 1024
            }
        });

        const text = response.text || '';
        const elapsed = Date.now() - startTime;
        console.log(`⏱️ Image analysis completed in ${elapsed}ms`);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in LLM vision response');
        }

        const result = JSON.parse(jsonMatch[0]) as ImageAnalysis;

        // Ensure all fields exist with defaults
        result.technicalTags = result.technicalTags || [];
        result.styleKeywords = result.styleKeywords || [];
        result.subjectMatter = result.subjectMatter || [];
        result.colorPalette = result.colorPalette || [];
        result.moodDescriptor = result.moodDescriptor || 'undetermined';
        result.equipmentGuess = result.equipmentGuess || [];

        return result;
    } catch (error: unknown) {
        const elapsed = Date.now() - startTime;
        console.error(`❌ Image analysis failed after ${elapsed}ms:`, error);
        throw error;
    }
}

// =============================================================================
// 📋 BRIEF ANALYSIS
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
    
    console.log('📋 Analyzing brief with LLM...');
    const startTime = Date.now();
    
    try {
        const text = await generateContent(prompt, { temperature: 0.2, maxOutputTokens: 512 });
        
        const elapsed = Date.now() - startTime;
        console.log(`⏱️ Brief analysis in ${elapsed}ms`);
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in LLM response');
        }
        
        return JSON.parse(jsonMatch[0]) as BriefAnalysis;
    } catch (error) {
        console.error('❌ Brief analysis failed:', error);
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
// 🔢 EMBEDDINGS
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
    if (!genAI) {
        initializeClient();
    }
    
    if (!genAI) {
        throw new Error('No AI client available');
    }
    
    console.log(`🔢 Generating embedding (${EMBEDDING_DIMENSIONS}d, ${taskType})...`);
    const startTime = Date.now();
    
    try {
        const response = await genAI.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: text,
            config: {
                taskType,
                outputDimensionality: EMBEDDING_DIMENSIONS
            }
        });
        
        const elapsed = Date.now() - startTime;
        console.log(`⏱️ Embedding generated in ${elapsed}ms`);
        
        const embedding = response.embeddings?.[0];
        if (!embedding?.values) {
            throw new Error('No embedding values in response');
        }
        
        return {
            values: embedding.values,
            dimensions: embedding.values.length,
            model: EMBEDDING_MODEL
        };
    } catch (error) {
        console.error('❌ Embedding generation failed:', error);
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
    if (!genAI) {
        initializeClient();
    }
    
    if (!genAI) {
        throw new Error('No AI client available');
    }
    
    console.log(`🔢 Generating ${texts.length} embeddings (${EMBEDDING_DIMENSIONS}d, ${taskType})...`);
    const startTime = Date.now();
    
    try {
        const response = await genAI.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: texts,
            config: {
                taskType,
                outputDimensionality: EMBEDDING_DIMENSIONS
            }
        });
        
        const elapsed = Date.now() - startTime;
        console.log(`⏱️ ${texts.length} embeddings generated in ${elapsed}ms`);
        
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
    } catch (error) {
        console.error('❌ Batch embedding generation failed:', error);
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
// 🌟 GOLDEN RECORD LOOKALIKE MODEL
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
// 🧪 TEST FUNCTIONS
// =============================================================================

/**
 * Test the LLM connection
 */
export async function testLLMConnection(): Promise<boolean> {
    try {
        const text = await generateContent('Reply with just the word "connected" if you can read this.');
        return text.toLowerCase().includes('connected');
    } catch (error) {
        console.error('❌ LLM connection test failed:', error);
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
    if (!genAI) {
        initializeClient();
    }
    return clientMode === 'vertex_ai' ? `Vertex AI (${GCP_PROJECT_ID})` : 'Google AI API';
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
