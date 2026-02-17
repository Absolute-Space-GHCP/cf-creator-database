/**
 * @file scoring.test.ts
 * @description Tests for the scoring algorithm using Golden Records data
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-02-17
 * @updated 2026-02-17
 */

import { describe, it, expect } from 'vitest';
import {
    extractBriefKeywords,
    detectInfluencerNoise,
    detectCraftIndicators,
    calculateStyleMatch,
    scoreCreator,
    rankCreators,
    WEIGHTS
} from '../src/scoring';
import type { Creator } from '../src/schemas';

// =============================================================================
// Test fixtures from Golden Records
// =============================================================================

const ROGER_DEAKINS: Creator = {
    id: 'golden-deakins',
    name: 'Roger Deakins',
    handle: '@rogerdeakins',
    platform: 'vimeo',
    source: {
        type: 'festival',
        name: 'Academy Awards',
        url: 'https://www.oscars.org',
        discoveredAt: '2026-01-28T00:00:00Z'
    },
    craft: {
        primary: 'cinematographer',
        secondary: ['director'],
        styleSignature: 'Master of naturalistic lighting with an unparalleled ability to create atmosphere through shadow and texture.',
        technicalTags: ['#ARRIAlexa', '#NaturalLight', '#Anamorphic', '#FilmEmulation']
    },
    matching: {
        positiveKeywords: ['cinematography', 'lighting', 'atmosphere', 'narrative', 'feature film', 'oscar winner'],
        negativeKeywords: [],
        qualityScore: 100,
        isGoldenRecord: true
    },
    contact: {
        location: 'Los Angeles, CA',
        locationConstraints: 'flexible',
        isHireable: false
    },
    createdAt: '2026-01-28T00:00:00Z',
    updatedAt: '2026-01-28T00:00:00Z'
};

const ASH_THORP: Creator = {
    id: 'golden-thorp',
    name: 'Ash Thorp',
    handle: '@ashthorp',
    platform: 'behance',
    craft: {
        primary: 'motion_designer',
        secondary: ['3d_artist', 'director'],
        styleSignature: 'Boundary-pushing motion designer blending photorealistic 3D with bold graphic design.',
        technicalTags: ['#Cinema4D', '#Octane', '#AfterEffects', '#UnrealEngine5']
    },
    matching: {
        positiveKeywords: ['motion design', '3d', 'title sequence', 'commercial', 'sci-fi', 'futuristic'],
        negativeKeywords: [],
        qualityScore: 97,
        isGoldenRecord: true
    },
    contact: {
        location: 'Los Angeles, CA',
        locationConstraints: 'flexible',
        isHireable: true
    },
    createdAt: '2026-01-28T00:00:00Z',
    updatedAt: '2026-01-28T00:00:00Z'
};

const INFLUENCER_CREATOR: Creator = {
    id: 'influencer-001',
    name: 'ViralVicky',
    handle: '@viralvicky',
    platform: 'instagram',
    craft: {
        primary: 'other',
        secondary: [],
        styleSignature: 'lifestyle vlogger trending on fyp with viral content',
        technicalTags: ['#canonm50', '#vlog']
    },
    matching: {
        positiveKeywords: ['content creator', 'influencer'],
        negativeKeywords: ['fyp', 'viral', 'trending'],
        qualityScore: 20,
        isGoldenRecord: false
    },
    contact: {
        location: 'Miami, FL',
        isHireable: true
    },
    createdAt: '2026-01-28T00:00:00Z',
    updatedAt: '2026-01-28T00:00:00Z'
};

const PAUL_SHORTINO: Creator = {
    id: 'golden-shortino',
    name: 'Paul Shortino',
    handle: '@paulshortino',
    platform: 'artstation',
    craft: {
        primary: '3d_artist',
        secondary: ['compositor', 'vfx_artist'],
        styleSignature: 'Photoreal 3D artist specializing in automotive and product visualization.',
        technicalTags: ['#HoudiniFX', '#Redshift3D', '#Automotive', '#ProductViz'],
        subjectMatterTags: ['automotive', 'product'],
        primaryMedium: 'video'
    },
    matching: {
        positiveKeywords: ['3d', 'automotive', 'product', 'photoreal', 'commercial', 'cgi'],
        negativeKeywords: [],
        qualityScore: 94,
        isGoldenRecord: true
    },
    contact: {
        location: 'London, UK',
        locationConstraints: 'flexible',
        isHireable: true
    },
    createdAt: '2026-01-28T00:00:00Z',
    updatedAt: '2026-01-28T00:00:00Z'
};

// =============================================================================
// extractBriefKeywords
// =============================================================================

describe('extractBriefKeywords', () => {
    it('extracts craft keywords from a cinematography brief', () => {
        const keywords = extractBriefKeywords(
            'Looking for an experienced cinematographer with cinematography skills for a feature film in LA'
        );
        expect(keywords.crafts).toContain('cinematographer');
        expect(keywords.crafts).toContain('cinematography');
        expect(keywords.locations).toContain('la');
    });

    it('extracts motion design keywords', () => {
        const keywords = extractBriefKeywords(
            'Need a motion designer for a 3D commercial using Cinema 4D and After Effects'
        );
        expect(keywords.crafts).toContain('motion design');
        expect(keywords.crafts).toContain('motion designer');
        expect(keywords.crafts).toContain('3d');
        expect(keywords.styles).toContain('commercial');
    });

    it('extracts technical keywords', () => {
        const keywords = extractBriefKeywords(
            'Must have experience with ARRI Alexa, anamorphic lenses, and DaVinci Resolve'
        );
        expect(keywords.technical).toContain('arri');
        expect(keywords.technical).toContain('alexa');
        expect(keywords.technical).toContain('anamorphic');
        expect(keywords.technical).toContain('davinci');
        expect(keywords.technical).toContain('resolve');
    });

    it('extracts location keywords', () => {
        const keywords = extractBriefKeywords('Based in New York or Los Angeles');
        expect(keywords.locations).toContain('new york');
        expect(keywords.locations).toContain('los angeles');
    });

    it('extracts style keywords', () => {
        const keywords = extractBriefKeywords(
            'Cinematic documentary style, moody and gritty'
        );
        expect(keywords.styles).toContain('cinematic');
        expect(keywords.styles).toContain('documentary');
        expect(keywords.styles).toContain('moody');
        expect(keywords.styles).toContain('gritty');
    });

    it('extracts subject matter hints', () => {
        const keywords = extractBriefKeywords(
            'Looking for automotive photography for a luxury car brand'
        );
        expect(keywords.subjects).toContain('automotive');
        expect(keywords.subjects).toContain('luxury');
    });

    it('detects primary medium hint from brief', () => {
        const videoKeywords = extractBriefKeywords('Need a director for a commercial film');
        expect(videoKeywords.primaryMediumHint).toBe('video');

        const stillKeywords = extractBriefKeywords('Looking for a photographer for product shots');
        expect(stillKeywords.primaryMediumHint).toBe('still');

        const audioKeywords = extractBriefKeywords('Need a sound designer for podcast audio');
        expect(audioKeywords.primaryMediumHint).toBe('audio');
    });

    it('returns empty arrays for unrelated text', () => {
        const keywords = extractBriefKeywords('Hello world test');
        expect(keywords.crafts).toHaveLength(0);
        expect(keywords.technical).toHaveLength(0);
        expect(keywords.locations).toHaveLength(0);
    });
});

// =============================================================================
// detectInfluencerNoise
// =============================================================================

describe('detectInfluencerNoise', () => {
    it('detects zero noise in a Golden Record creator', () => {
        const result = detectInfluencerNoise(ROGER_DEAKINS);
        expect(result.count).toBe(0);
        expect(result.indicators).toHaveLength(0);
    });

    it('detects noise in an influencer profile', () => {
        const result = detectInfluencerNoise(INFLUENCER_CREATOR);
        expect(result.count).toBeGreaterThan(0);
        expect(result.indicators.length).toBeGreaterThan(0);
    });

    it('detects specific noise keywords', () => {
        const result = detectInfluencerNoise(INFLUENCER_CREATOR);
        // Should detect from styleSignature ("lifestyle vlogger trending on fyp")
        // and from technicalTags (canonm50, vlog)
        const allIndicators = result.indicators.map(i => i.toLowerCase());
        expect(allIndicators).toContain('fyp');
    });
});

// =============================================================================
// detectCraftIndicators
// =============================================================================

describe('detectCraftIndicators', () => {
    it('detects craft indicators in a Golden Record', () => {
        const result = detectCraftIndicators(ROGER_DEAKINS);
        expect(result.count).toBeGreaterThan(0);
        // Roger Deakins has "oscar winner" in positiveKeywords and "Academy Awards" as source
        const indicators = result.indicators.map(i => i.toLowerCase());
        expect(indicators.some(i => i.includes('oscar') || i.includes('winner'))).toBe(true);
    });

    it('detects zero craft indicators for influencer', () => {
        const result = detectCraftIndicators(INFLUENCER_CREATOR);
        expect(result.count).toBe(0);
    });
});

// =============================================================================
// calculateStyleMatch
// =============================================================================

describe('calculateStyleMatch', () => {
    it('returns 0 for no style keywords', () => {
        const score = calculateStyleMatch([], 'Any style signature');
        expect(score).toBe(0);
    });

    it('returns 0 for empty style signature', () => {
        const score = calculateStyleMatch(['cinematic'], '');
        expect(score).toBe(0);
    });

    it('scores matching style keywords', () => {
        const score = calculateStyleMatch(
            ['cinematic', 'moody', 'bold'],
            'A cinematic and moody visual style with bold contrasts'
        );
        expect(score).toBe(15); // 3 matches * 5 = 15 (capped at 3)
    });

    it('caps at 15 points maximum', () => {
        const score = calculateStyleMatch(
            ['cinematic', 'moody', 'bold', 'dark', 'experimental'],
            'cinematic moody bold dark experimental'
        );
        expect(score).toBe(15);
    });

    it('scores partial matches', () => {
        const score = calculateStyleMatch(
            ['cinematic', 'experimental'],
            'A cinematic approach to storytelling'
        );
        expect(score).toBe(5); // 1 match
    });
});

// =============================================================================
// scoreCreator
// =============================================================================

describe('scoreCreator', () => {
    it('scores Roger Deakins high for a cinematography brief', () => {
        const result = scoreCreator(
            ROGER_DEAKINS,
            'Looking for an experienced cinematographer with naturalistic lighting for a narrative feature film in Los Angeles'
        );
        expect(result.score).toBeGreaterThan(50);
        expect(result.reasons.length).toBeGreaterThan(0);
        expect(result.breakdown.primaryCraft).toBe(WEIGHTS.craftMatch);
    });

    it('scores Ash Thorp high for a motion design brief', () => {
        const result = scoreCreator(
            ASH_THORP,
            'Need a motion designer for a commercial title sequence, preferably with Cinema 4D and After Effects experience'
        );
        expect(result.score).toBeGreaterThan(40);
        // Reasons include keyword matches, golden record, quality score, etc.
        expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('gives Golden Record bonus', () => {
        const result = scoreCreator(ROGER_DEAKINS, 'cinematographer');
        expect(result.breakdown.goldenRecord).toBe(WEIGHTS.goldenRecordBonus);
    });

    it('does not give Golden Record bonus to non-golden creators', () => {
        const result = scoreCreator(INFLUENCER_CREATOR, 'anything');
        expect(result.breakdown.goldenRecord).toBeUndefined();
    });

    it('applies negative keyword penalty', () => {
        const result = scoreCreator(
            INFLUENCER_CREATOR,
            'Looking for someone trending and viral on fyp'
        );
        expect(result.breakdown.negativeKeywords).toBeDefined();
        expect(result.breakdown.negativeKeywords!).toBeLessThan(0);
    });

    it('scores exact name match very high', () => {
        const result = scoreCreator(ROGER_DEAKINS, 'I want to work with Roger Deakins');
        expect(result.breakdown.exactName).toBe(WEIGHTS.exactNameMatch);
        expect(result.score).toBeGreaterThan(80);
    });

    it('detects location match', () => {
        const result = scoreCreator(ROGER_DEAKINS, 'cinematographer in Los Angeles');
        expect(result.breakdown.location).toBe(WEIGHTS.locationMatch);
    });

    it('includes quality score contribution', () => {
        const result = scoreCreator(ROGER_DEAKINS, 'test');
        // qualityScore 100 * 0.2 = 20
        expect(result.breakdown.qualityScore).toBe(20);
    });

    it('scores subject matter overlap', () => {
        const result = scoreCreator(
            PAUL_SHORTINO,
            'Need automotive CGI for a luxury car brand commercial'
        );
        expect(result.breakdown.subjectMatter).toBeDefined();
        expect(result.breakdown.subjectMatter!).toBeGreaterThan(0);
    });

    it('scores primary medium match', () => {
        const result = scoreCreator(
            PAUL_SHORTINO,
            'Need someone for a video commercial'
        );
        expect(result.breakdown.primaryMedium).toBe(WEIGHTS.primaryMediumMatch);
    });

    it('normalizes score to 0-100 range', () => {
        const result = scoreCreator(ROGER_DEAKINS, 'Roger Deakins cinematographer lighting naturalistic LA');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
    });

    it('returns rawScore that may exceed 100', () => {
        const result = scoreCreator(
            ROGER_DEAKINS,
            'Roger Deakins cinematographer lighting atmosphere narrative feature film Los Angeles arri alexa anamorphic oscar winner naturalistic'
        );
        // With exact name + craft + location + keywords + golden record + quality, raw can exceed 100
        expect(result.rawScore).toBeGreaterThanOrEqual(result.score);
    });
});

// =============================================================================
// rankCreators
// =============================================================================

describe('rankCreators', () => {
    const allCreators = [ROGER_DEAKINS, ASH_THORP, INFLUENCER_CREATOR, PAUL_SHORTINO];

    it('ranks creators by score descending', () => {
        const ranked = rankCreators(allCreators, 'cinematographer for a feature film');
        expect(ranked.length).toBeGreaterThan(0);
        for (let i = 1; i < ranked.length; i++) {
            expect(ranked[i - 1].matchScore).toBeGreaterThanOrEqual(ranked[i].matchScore);
        }
    });

    it('filters by minimum score', () => {
        const ranked = rankCreators(allCreators, 'cinematographer', { minScore: 30 });
        for (const creator of ranked) {
            expect(creator.matchScore).toBeGreaterThanOrEqual(30);
        }
    });

    it('limits results', () => {
        const ranked = rankCreators(allCreators, 'creative talent', { limit: 2 });
        expect(ranked.length).toBeLessThanOrEqual(2);
    });

    it('ranks Roger Deakins first for cinematography brief', () => {
        const ranked = rankCreators(
            allCreators,
            'Need a cinematographer for a feature film with naturalistic lighting in Los Angeles'
        );
        expect(ranked[0].name).toBe('Roger Deakins');
    });

    it('ranks Ash Thorp top-2 for motion design brief', () => {
        const ranked = rankCreators(
            allCreators,
            'Looking for a motion designer for a 3D commercial title sequence'
        );
        const ashIdx = ranked.findIndex(c => c.name === 'Ash Thorp');
        expect(ashIdx).toBeLessThanOrEqual(1); // Top 2
        expect(ranked[ashIdx].matchScore).toBeGreaterThan(40);
    });

    it('ranks Paul Shortino first for automotive 3D brief', () => {
        const ranked = rankCreators(
            allCreators,
            'Need a 3D artist for automotive CGI product visualization'
        );
        expect(ranked[0].name).toBe('Paul Shortino');
    });

    it('ranks influencer last for craft briefs', () => {
        const ranked = rankCreators(allCreators, 'cinematographer for narrative feature');
        const influencerIdx = ranked.findIndex(c => c.name === 'ViralVicky');
        if (influencerIdx >= 0) {
            expect(influencerIdx).toBe(ranked.length - 1);
        }
    });

    it('includes matchScore and matchReasons on each result', () => {
        const ranked = rankCreators(allCreators, 'cinematographer');
        for (const creator of ranked) {
            expect(creator.matchScore).toBeDefined();
            expect(typeof creator.matchScore).toBe('number');
            expect(Array.isArray(creator.matchReasons)).toBe(true);
            expect(creator.matchBreakdown).toBeDefined();
        }
    });
});

// =============================================================================
// WEIGHTS sanity checks
// =============================================================================

describe('Scoring Weights', () => {
    it('exactNameMatch is the highest single-event weight', () => {
        expect(WEIGHTS.exactNameMatch).toBeGreaterThan(WEIGHTS.craftMatch);
        expect(WEIGHTS.exactNameMatch).toBeGreaterThan(WEIGHTS.locationMatch);
    });

    it('negative keyword penalty is negative', () => {
        expect(WEIGHTS.negativeKeywordPenalty).toBeLessThan(0);
    });

    it('quality score weight is a fraction', () => {
        expect(WEIGHTS.qualityScoreWeight).toBeGreaterThan(0);
        expect(WEIGHTS.qualityScoreWeight).toBeLessThan(1);
    });
});
