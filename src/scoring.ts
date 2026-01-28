/**
 * @file scoring.ts
 * @description Scoring algorithm for matching creators to client briefs
 * @author Charley Scholz, JLIT
 * @coauthor Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-01-28
 */

import type { 
    Creator, 
    ScoreBreakdown, 
    ScoreResult, 
    ScoredCreator, 
    ExtractedKeywords 
} from './schemas';

// =============================================================================
// 🎯 SCORING WEIGHTS
// =============================================================================

export interface ScoringWeights {
    exactNameMatch: number;
    craftMatch: number;
    secondaryCraftMatch: number;
    locationMatch: number;
    technicalTagMatch: number;
    positiveKeywordMatch: number;
    goldenRecordBonus: number;
    qualityScoreWeight: number;
    negativeKeywordPenalty: number;
}

export const WEIGHTS: ScoringWeights = {
    exactNameMatch: 100,      // Exact name/handle match
    craftMatch: 30,           // Primary craft matches brief
    secondaryCraftMatch: 15,  // Secondary craft matches
    locationMatch: 20,        // Location mentioned in brief
    technicalTagMatch: 10,    // Per matching technical tag
    positiveKeywordMatch: 5,  // Per matching positive keyword
    goldenRecordBonus: 15,    // Bonus for golden record creators
    qualityScoreWeight: 0.2,  // Multiplier for quality score
    negativeKeywordPenalty: -20 // Penalty per negative keyword match
};

// =============================================================================
// 🚫 INFLUENCER NOISE DETECTION
// =============================================================================

/** Keywords that indicate lifestyle/influencer content (anti-pattern for craft focus) */
const INFLUENCER_NOISE_KEYWORDS: readonly string[] = [
    'fyp', 'foryoupage', 'viral', 'trending', 'grwm', 'ootd',
    'influencer', 'content creator', 'lifestyle', 'vlog', 'vlogger',
    'subscribe', 'like and subscribe', 'brand deal', 'sponsored',
    'pr package', 'haul', 'unboxing', 'asmr', 'mukbang',
    'canonm50', 'iphone cinematography', 'phone footage'
];

/** Keywords that indicate professional craft (positive signal) */
const CRAFT_POSITIVE_INDICATORS: readonly string[] = [
    'award', 'winner', 'nominee', 'festival', 'camerimage', 'sundance',
    'annecy', 'ciclope', 'cannes', 'golden frog', 'staff pick',
    'commercial director', 'cinematographer', 'vfx supervisor',
    'lead compositor', 'senior colorist', 'showrunner',
    'feature film', 'theatrical', 'broadcast', 'netflix', 'hbo',
    'arri certified', 'red certified', 'davinci certified'
];

// =============================================================================
// 📝 KEYWORD EXTRACTION
// =============================================================================

/** Craft-related keywords to detect in briefs */
const CRAFT_KEYWORDS: readonly string[] = [
    'cinematographer', 'cinematography', 'dp', 'director of photography',
    'director', 'editor', 'editing', 'post-production',
    'colorist', 'color grading', 'color',
    'vfx', 'visual effects', 'compositor', 'compositing',
    'motion design', 'motion graphics', 'motion designer',
    '3d', 'cgi', 'animation', 'animator',
    'sound', 'audio', 'music',
    'photographer', 'photography',
    'producer', 'production'
];

/** Technical keywords (equipment/software) */
const TECHNICAL_KEYWORDS: readonly string[] = [
    'arri', 'alexa', 'red', 'sony', 'venice', 'bmpcc',
    'anamorphic', 'cooke', 'zeiss',
    'houdini', 'nuke', 'after effects', 'premiere',
    'davinci', 'resolve', 'cinema 4d', 'c4d',
    'unreal', 'ue5', 'blender', 'maya',
    'aces', 'log', 'raw'
];

/** Location keywords (common production locations) */
const LOCATION_KEYWORDS: readonly string[] = [
    'los angeles', 'la', 'new york', 'nyc', 'ny',
    'london', 'vancouver', 'toronto', 'atlanta',
    'chicago', 'miami', 'austin', 'portland',
    'san francisco', 'sf', 'seattle'
];

/** Style/genre keywords */
const STYLE_KEYWORDS: readonly string[] = [
    'commercial', 'music video', 'documentary', 'narrative',
    'fashion', 'beauty', 'automotive', 'sports',
    'food', 'lifestyle', 'corporate', 'brand',
    'cinematic', 'moody', 'bright', 'dark', 'gritty',
    'clean', 'minimal', 'bold', 'experimental'
];

/**
 * Extract keywords from a brief text
 * @param brief - The client brief text
 * @returns Extracted keywords categorized
 */
export function extractBriefKeywords(brief: string): ExtractedKeywords {
    const lowerBrief = brief.toLowerCase();
    
    return {
        crafts: CRAFT_KEYWORDS.filter(k => lowerBrief.includes(k)),
        technical: TECHNICAL_KEYWORDS.filter(k => lowerBrief.includes(k)),
        locations: LOCATION_KEYWORDS.filter(k => lowerBrief.includes(k)),
        styles: STYLE_KEYWORDS.filter(k => lowerBrief.includes(k)),
        raw: lowerBrief.split(/\s+/).filter(w => w.length > 3)
    };
}

/**
 * Detect influencer noise in creator profile
 * @param creator - Creator object
 * @returns Number of influencer noise indicators found
 */
export function detectInfluencerNoise(creator: Creator): { count: number; indicators: string[] } {
    const indicators: string[] = [];
    
    // Check styleSignature
    const style = (creator.craft?.styleSignature ?? '').toLowerCase();
    // Check all technical tags
    const tags = (creator.craft?.technicalTags ?? []).map(t => t.toLowerCase());
    // Check positive keywords (sometimes misused)
    const posKeywords = (creator.matching?.positiveKeywords ?? []).map(k => k.toLowerCase());
    
    const allText = [style, ...tags, ...posKeywords].join(' ');
    
    for (const noise of INFLUENCER_NOISE_KEYWORDS) {
        if (allText.includes(noise.toLowerCase())) {
            indicators.push(noise);
        }
    }
    
    return { count: indicators.length, indicators };
}

/**
 * Detect craft professionalism indicators
 * @param creator - Creator object
 * @returns Number of professional indicators found
 */
export function detectCraftIndicators(creator: Creator): { count: number; indicators: string[] } {
    const indicators: string[] = [];
    
    const style = (creator.craft?.styleSignature ?? '').toLowerCase();
    const tags = (creator.craft?.technicalTags ?? []).map(t => t.toLowerCase());
    const posKeywords = (creator.matching?.positiveKeywords ?? []).map(k => k.toLowerCase());
    const sourceName = (creator.source?.name ?? '').toLowerCase();
    
    const allText = [style, ...tags, ...posKeywords, sourceName].join(' ');
    
    for (const indicator of CRAFT_POSITIVE_INDICATORS) {
        if (allText.includes(indicator.toLowerCase())) {
            indicators.push(indicator);
        }
    }
    
    return { count: indicators.length, indicators };
}

/**
 * Calculate style match between brief and creator's style signature
 * @param briefStyles - Style keywords from brief
 * @param styleSignature - Creator's style signature
 * @returns Match score (0-15)
 */
export function calculateStyleMatch(briefStyles: string[], styleSignature: string): number {
    if (!styleSignature || briefStyles.length === 0) return 0;
    
    const lowerSignature = styleSignature.toLowerCase();
    let matches = 0;
    
    for (const style of briefStyles) {
        if (lowerSignature.includes(style.toLowerCase())) {
            matches++;
        }
    }
    
    // Cap at 3 matches worth 5 points each = 15 points max
    return Math.min(matches, 3) * 5;
}

// =============================================================================
// 🎬 SCORING FUNCTIONS
// =============================================================================

/**
 * Calculate match score between a creator and a brief
 * @param creator - Creator object from database
 * @param brief - Client brief text
 * @param briefKeywords - Pre-extracted keywords from brief (optional)
 * @returns Score result with breakdown and reasons
 */
export function scoreCreator(
    creator: Creator, 
    brief: string, 
    briefKeywords?: ExtractedKeywords
): ScoreResult {
    const keywords = briefKeywords ?? extractBriefKeywords(brief);
    const lowerBrief = brief.toLowerCase();
    
    let score = 0;
    const breakdown: ScoreBreakdown = {};
    const reasons: string[] = [];
    
    // 1. Exact name/handle match
    if (creator.name && lowerBrief.includes(creator.name.toLowerCase())) {
        score += WEIGHTS.exactNameMatch;
        breakdown.exactName = WEIGHTS.exactNameMatch;
        reasons.push(`Exact name match: "${creator.name}"`);
    }
    if (creator.handle && lowerBrief.includes(creator.handle.toLowerCase().replace('@', ''))) {
        score += WEIGHTS.exactNameMatch;
        breakdown.exactHandle = WEIGHTS.exactNameMatch;
        reasons.push(`Exact handle match: "${creator.handle}"`);
    }
    
    // 2. Primary craft match
    const primaryCraft = creator.craft?.primary?.toLowerCase() ?? '';
    if (primaryCraft) {
        const craftMatches = keywords.crafts.filter(k => 
            primaryCraft.includes(k) || k.includes(primaryCraft)
        );
        if (craftMatches.length > 0) {
            score += WEIGHTS.craftMatch;
            breakdown.primaryCraft = WEIGHTS.craftMatch;
            reasons.push(`Primary craft match: ${primaryCraft}`);
        }
    }
    
    // 3. Secondary craft match
    const secondaryCrafts = creator.craft?.secondary ?? [];
    for (const craft of secondaryCrafts) {
        const lowerCraft = craft.toLowerCase();
        const matches = keywords.crafts.filter(k => 
            lowerCraft.includes(k) || k.includes(lowerCraft)
        );
        if (matches.length > 0) {
            score += WEIGHTS.secondaryCraftMatch;
            breakdown.secondaryCraft = (breakdown.secondaryCraft ?? 0) + WEIGHTS.secondaryCraftMatch;
            reasons.push(`Secondary craft: ${craft}`);
        }
    }
    
    // 4. Location match
    const creatorLocation = creator.contact?.location?.toLowerCase() ?? '';
    if (creatorLocation) {
        const locationMatches = keywords.locations.filter(loc => 
            creatorLocation.includes(loc)
        );
        if (locationMatches.length > 0) {
            score += WEIGHTS.locationMatch;
            breakdown.location = WEIGHTS.locationMatch;
            reasons.push(`Location match: ${creator.contact?.location}`);
        }
    }
    
    // 5. Technical tag matches
    const technicalTags = creator.craft?.technicalTags ?? [];
    let techMatches = 0;
    for (const tag of technicalTags) {
        const cleanTag = tag.toLowerCase().replace('#', '');
        if (keywords.technical.some(k => cleanTag.includes(k) || k.includes(cleanTag))) {
            techMatches++;
            score += WEIGHTS.technicalTagMatch;
        }
        // Also check if tag appears in brief directly
        if (lowerBrief.includes(cleanTag)) {
            techMatches++;
            score += WEIGHTS.technicalTagMatch;
        }
    }
    if (techMatches > 0) {
        breakdown.technicalTags = techMatches * WEIGHTS.technicalTagMatch;
        reasons.push(`${techMatches} technical tag matches`);
    }
    
    // 6. Positive keyword matches
    const positiveKeywords = creator.matching?.positiveKeywords ?? [];
    let posMatches = 0;
    for (const keyword of positiveKeywords) {
        if (lowerBrief.includes(keyword.toLowerCase())) {
            posMatches++;
            score += WEIGHTS.positiveKeywordMatch;
        }
    }
    if (posMatches > 0) {
        breakdown.positiveKeywords = posMatches * WEIGHTS.positiveKeywordMatch;
        reasons.push(`${posMatches} keyword matches`);
    }
    
    // 7. Negative keyword penalty
    const negativeKeywords = creator.matching?.negativeKeywords ?? [];
    let negMatches = 0;
    for (const keyword of negativeKeywords) {
        if (lowerBrief.includes(keyword.toLowerCase())) {
            negMatches++;
            score += WEIGHTS.negativeKeywordPenalty;
        }
    }
    if (negMatches > 0) {
        breakdown.negativeKeywords = negMatches * WEIGHTS.negativeKeywordPenalty;
        reasons.push(`${negMatches} negative keyword penalties`);
    }
    
    // 8. Golden Record bonus
    if (creator.matching?.isGoldenRecord) {
        score += WEIGHTS.goldenRecordBonus;
        breakdown.goldenRecord = WEIGHTS.goldenRecordBonus;
        reasons.push('Golden Record creator');
    }
    
    // 9. Quality score contribution
    const qualityScore = creator.matching?.qualityScore ?? 50;
    const qualityContribution = Math.round(qualityScore * WEIGHTS.qualityScoreWeight);
    score += qualityContribution;
    breakdown.qualityScore = qualityContribution;
    
    // 10. Style signature match (Phase 2 enhancement)
    const styleSignature = creator.craft?.styleSignature ?? '';
    const styleScore = calculateStyleMatch(keywords.styles, styleSignature);
    if (styleScore > 0) {
        score += styleScore;
        reasons.push(`Style match: +${styleScore} pts`);
    }
    
    // 11. Influencer noise penalty (auto-detect)
    const noise = detectInfluencerNoise(creator);
    if (noise.count > 0) {
        const noisePenalty = noise.count * -10; // -10 per indicator
        score += noisePenalty;
        reasons.push(`Influencer noise detected: ${noise.indicators.slice(0, 2).join(', ')} (${noisePenalty} pts)`);
    }
    
    // 12. Craft professionalism bonus (auto-detect)
    const craftBonus = detectCraftIndicators(creator);
    if (craftBonus.count > 0) {
        const bonus = Math.min(craftBonus.count * 5, 20); // +5 per indicator, max +20
        score += bonus;
        reasons.push(`Professional indicators: ${craftBonus.indicators.slice(0, 2).join(', ')} (+${bonus} pts)`);
    }
    
    // Normalize score to 0-100 range
    const normalizedScore = Math.min(100, Math.max(0, score));
    
    return {
        score: normalizedScore,
        rawScore: score,
        breakdown,
        reasons: reasons.length > 0 ? reasons : ['Base match only']
    };
}

/**
 * Options for ranking creators
 */
export interface RankingOptions {
    minScore?: number;
    limit?: number;
}

/**
 * Score and rank multiple creators against a brief
 * @param creators - Array of creator objects
 * @param brief - Client brief text
 * @param options - Options for filtering/limiting results
 * @returns Sorted array of scored creators
 */
export function rankCreators(
    creators: Creator[], 
    brief: string, 
    options: RankingOptions = {}
): ScoredCreator[] {
    const { minScore = 0, limit = 10 } = options;
    
    // Pre-extract keywords once
    const briefKeywords = extractBriefKeywords(brief);
    
    console.log(`🎯 Scoring ${creators.length} creators against brief...`);
    console.log(`📝 Extracted keywords:`, {
        crafts: briefKeywords.crafts.slice(0, 5),
        technical: briefKeywords.technical.slice(0, 5),
        locations: briefKeywords.locations
    });
    
    // Score all creators
    const scored: ScoredCreator[] = creators.map(creator => {
        const result = scoreCreator(creator, brief, briefKeywords);
        return {
            ...creator,
            matchScore: result.score,
            matchBreakdown: result.breakdown,
            matchReasons: result.reasons
        };
    });
    
    // Filter and sort
    const filtered = scored
        .filter(c => c.matchScore >= minScore)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
    
    console.log(`✅ Ranked ${filtered.length} creators (min score: ${minScore})`);
    
    return filtered;
}
