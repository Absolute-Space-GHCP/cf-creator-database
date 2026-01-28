/**
 * @file llm.ts
 * @description Gemini LLM integration for creator categorization and style analysis
 *              Supports both Google AI API (with API key) and Vertex AI (with ADC)
 * @author Charley Scholz, JLIT
 * @coauthor Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-01-28
 */

import { GoogleGenAI } from '@google/genai';
import { VertexAI } from '@google-cloud/vertexai';
import { CRAFT_TYPES, CraftType } from './schemas';

// =============================================================================
// 🔧 CONFIGURATION
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
        console.log('✅ Gemini AI client initialized (Google AI API)');
    } else {
        // Fall back to Vertex AI with ADC
        vertexAI = new VertexAI({
            project: GCP_PROJECT_ID,
            location: GCP_REGION
        });
        useVertexAI = true;
        console.log(`✅ Gemini AI client initialized (Vertex AI: ${GCP_PROJECT_ID}/${GCP_REGION})`);
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
// 🔍 BRIEF ANALYSIS
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
// 🧪 TEST FUNCTION
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
 * Get the current client type being used
 */
export function getClientType(): string {
    if (!genAI && !vertexAI) {
        initializeClient();
    }
    return useVertexAI ? `Vertex AI (${GCP_PROJECT_ID})` : 'Google AI API';
}
