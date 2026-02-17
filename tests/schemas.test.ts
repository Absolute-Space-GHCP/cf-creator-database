/**
 * @file schemas.test.ts
 * @description Tests for Zod schemas and validation helpers
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-02-17
 * @updated 2026-02-17
 */

import { describe, it, expect } from 'vitest';
import {
    validateCreator,
    validateBatchCreator,
    validateMatchRequest,
    validateCategorizeRequest,
    CreateCreatorSchema,
    BatchCreatorSchema,
    MatchRequestSchema,
    CategorizeRequestSchema,
    CRAFT_TYPES,
    PLATFORMS,
    SOURCE_TYPES,
    LOCATION_CONSTRAINTS,
    PRIMARY_MEDIA,
    BUDGET_TIERS,
    SUBJECT_MATTER_TAGS,
    SUBJECT_SUBCATEGORY_TAGS,
    CLASSIFICATION_TYPES,
} from '../src/schemas';

// =============================================================================
// Test data based on Golden Records
// =============================================================================

const VALID_CREATOR = {
    name: 'Roger Deakins',
    handle: '@rogerdeakins',
    platform: 'vimeo' as const,
    source: {
        type: 'festival' as const,
        name: 'Academy Awards',
        url: 'https://www.oscars.org',
        discoveredAt: '2026-01-28T00:00:00Z'
    },
    craft: {
        primary: 'cinematographer' as const,
        secondary: ['director'],
        styleSignature: 'Master of naturalistic lighting',
        technicalTags: ['#ARRIAlexa', '#NaturalLight'],
        subjectMatterTags: ['entertainment'],
        subjectSubcategoryTags: ['film-tv'],
        primaryMedium: 'video' as const,
        classification: 'film_narrative'
    },
    matching: {
        positiveKeywords: ['cinematography', 'lighting', 'oscar winner'],
        negativeKeywords: [],
        qualityScore: 100,
        isGoldenRecord: true
    },
    contact: {
        location: 'Los Angeles, CA',
        locationConstraints: 'flexible' as const,
        isHireable: false
    }
};

const MINIMAL_CREATOR = {
    name: 'Test Creator'
};

// =============================================================================
// Constants validation
// =============================================================================

describe('Constants', () => {
    it('CRAFT_TYPES contains expected crafts', () => {
        expect(CRAFT_TYPES).toContain('cinematographer');
        expect(CRAFT_TYPES).toContain('director');
        expect(CRAFT_TYPES).toContain('motion_designer');
        expect(CRAFT_TYPES).toContain('vfx_artist');
        expect(CRAFT_TYPES).toContain('other');
        expect(CRAFT_TYPES.length).toBeGreaterThanOrEqual(13);
    });

    it('PLATFORMS contains expected platforms', () => {
        expect(PLATFORMS).toContain('vimeo');
        expect(PLATFORMS).toContain('behance');
        expect(PLATFORMS).toContain('artstation');
        expect(PLATFORMS).toContain('other');
    });

    it('SOURCE_TYPES contains expected types', () => {
        expect(SOURCE_TYPES).toContain('festival');
        expect(SOURCE_TYPES).toContain('platform');
        expect(SOURCE_TYPES).toContain('community');
    });

    it('LOCATION_CONSTRAINTS has three valid options', () => {
        expect(LOCATION_CONSTRAINTS).toEqual(['digital_only', 'on_site', 'flexible']);
    });

    it('PRIMARY_MEDIA has still, video, audio', () => {
        expect(PRIMARY_MEDIA).toEqual(['still', 'video', 'audio']);
    });

    it('BUDGET_TIERS has emerging, mid-tier, established', () => {
        expect(BUDGET_TIERS).toEqual(['emerging', 'mid-tier', 'established']);
    });

    it('SUBJECT_MATTER_TAGS has 19 tags from deck', () => {
        expect(SUBJECT_MATTER_TAGS.length).toBe(19);
        expect(SUBJECT_MATTER_TAGS).toContain('food');
        expect(SUBJECT_MATTER_TAGS).toContain('automotive');
        expect(SUBJECT_MATTER_TAGS).toContain('fashion');
        expect(SUBJECT_MATTER_TAGS).toContain('entertainment');
    });

    it('SUBJECT_SUBCATEGORY_TAGS maps to parent tags', () => {
        expect(SUBJECT_SUBCATEGORY_TAGS).toContain('luxury-automotive');
        expect(SUBJECT_SUBCATEGORY_TAGS).toContain('high-fashion');
        expect(SUBJECT_SUBCATEGORY_TAGS).toContain('restaurant');
    });

    it('CLASSIFICATION_TYPES covers still, video, and audio', () => {
        expect(CLASSIFICATION_TYPES).toContain('photography');
        expect(CLASSIFICATION_TYPES).toContain('documentary');
        expect(CLASSIFICATION_TYPES).toContain('sound_design');
    });
});

// =============================================================================
// CreateCreatorSchema
// =============================================================================

describe('CreateCreatorSchema', () => {
    it('validates a full Golden Record creator', () => {
        const result = CreateCreatorSchema.safeParse(VALID_CREATOR);
        expect(result.success).toBe(true);
    });

    it('validates a minimal creator (name only)', () => {
        const result = CreateCreatorSchema.safeParse(MINIMAL_CREATOR);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe('Test Creator');
            expect(result.data.platform).toBe('other');
        }
    });

    it('rejects empty name', () => {
        const result = CreateCreatorSchema.safeParse({ name: '' });
        expect(result.success).toBe(false);
    });

    it('rejects missing name', () => {
        const result = CreateCreatorSchema.safeParse({});
        expect(result.success).toBe(false);
    });

    it('defaults platform to other', () => {
        const result = CreateCreatorSchema.safeParse({ name: 'X' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.platform).toBe('other');
        }
    });

    it('rejects invalid platform', () => {
        const result = CreateCreatorSchema.safeParse({ name: 'X', platform: 'snapchat' });
        expect(result.success).toBe(false);
    });

    it('accepts all valid platforms', () => {
        for (const platform of PLATFORMS) {
            const result = CreateCreatorSchema.safeParse({ name: 'X', platform });
            expect(result.success).toBe(true);
        }
    });

    it('accepts all valid craft types', () => {
        for (const craft of CRAFT_TYPES) {
            const result = CreateCreatorSchema.safeParse({
                name: 'X',
                craft: { primary: craft }
            });
            expect(result.success).toBe(true);
        }
    });

    it('validates source with valid URL', () => {
        const result = CreateCreatorSchema.safeParse({
            name: 'X',
            source: { type: 'festival', url: 'https://example.com' }
        });
        expect(result.success).toBe(true);
    });

    it('accepts empty string URL in source', () => {
        const result = CreateCreatorSchema.safeParse({
            name: 'X',
            source: { url: '' }
        });
        expect(result.success).toBe(true);
    });

    it('validates contact with email', () => {
        const result = CreateCreatorSchema.safeParse({
            name: 'X',
            contact: { email: 'test@example.com' }
        });
        expect(result.success).toBe(true);
    });

    it('validates budgetTier', () => {
        for (const tier of BUDGET_TIERS) {
            const result = CreateCreatorSchema.safeParse({
                name: 'X',
                contact: { budgetTier: tier }
            });
            expect(result.success).toBe(true);
        }
    });

    it('validates primaryMedium in craft', () => {
        for (const medium of PRIMARY_MEDIA) {
            const result = CreateCreatorSchema.safeParse({
                name: 'X',
                craft: { primaryMedium: medium }
            });
            expect(result.success).toBe(true);
        }
    });

    it('validates qualityScore range 0-100', () => {
        const valid = CreateCreatorSchema.safeParse({
            name: 'X', matching: { qualityScore: 75 }
        });
        expect(valid.success).toBe(true);

        const tooHigh = CreateCreatorSchema.safeParse({
            name: 'X', matching: { qualityScore: 101 }
        });
        expect(tooHigh.success).toBe(false);

        const tooLow = CreateCreatorSchema.safeParse({
            name: 'X', matching: { qualityScore: -1 }
        });
        expect(tooLow.success).toBe(false);
    });
});

// =============================================================================
// BatchCreatorSchema
// =============================================================================

describe('BatchCreatorSchema', () => {
    it('validates a full creator', () => {
        const result = BatchCreatorSchema.safeParse(VALID_CREATOR);
        expect(result.success).toBe(true);
    });

    it('validates a minimal creator', () => {
        const result = BatchCreatorSchema.safeParse(MINIMAL_CREATOR);
        expect(result.success).toBe(true);
    });
});

// =============================================================================
// MatchRequestSchema
// =============================================================================

describe('MatchRequestSchema', () => {
    it('validates a simple brief', () => {
        const result = MatchRequestSchema.safeParse({ brief: 'Find me a cinematographer in LA' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.filters.limit).toBe(10);
        }
    });

    it('rejects empty brief', () => {
        const result = MatchRequestSchema.safeParse({ brief: '' });
        expect(result.success).toBe(false);
    });

    it('validates with all filter options', () => {
        const result = MatchRequestSchema.safeParse({
            brief: 'Need a food photographer',
            filters: {
                craft: 'photographer',
                location: 'New York',
                tags: ['#food'],
                subjectMatter: 'food',
                subjectSubcategory: 'restaurant',
                primaryMedium: 'still',
                budgetTier: 'mid-tier',
                minQualityScore: 80,
                goldenRecordsOnly: false,
                limit: 5
            }
        });
        expect(result.success).toBe(true);
    });

    it('accepts subjectMatter as string or array', () => {
        const asString = MatchRequestSchema.safeParse({
            brief: 'X', filters: { subjectMatter: 'food' }
        });
        const asArray = MatchRequestSchema.safeParse({
            brief: 'X', filters: { subjectMatter: ['food', 'beverage'] }
        });
        expect(asString.success).toBe(true);
        expect(asArray.success).toBe(true);
    });

    it('enforces limit range 1-100', () => {
        const tooLow = MatchRequestSchema.safeParse({
            brief: 'X', filters: { limit: 0 }
        });
        expect(tooLow.success).toBe(false);

        const tooHigh = MatchRequestSchema.safeParse({
            brief: 'X', filters: { limit: 101 }
        });
        expect(tooHigh.success).toBe(false);
    });
});

// =============================================================================
// CategorizeRequestSchema
// =============================================================================

describe('CategorizeRequestSchema', () => {
    it('validates with bio only', () => {
        const result = CategorizeRequestSchema.safeParse({
            bio: 'Award-winning cinematographer specializing in documentary'
        });
        expect(result.success).toBe(true);
    });

    it('validates with bio + portfolio + recentWork', () => {
        const result = CategorizeRequestSchema.safeParse({
            bio: 'Motion designer at Studio X',
            portfolio_url: 'https://behance.net/user',
            recentWork: ['Nike commercial', 'Apple event']
        });
        expect(result.success).toBe(true);
    });

    it('rejects empty bio', () => {
        const result = CategorizeRequestSchema.safeParse({ bio: '' });
        expect(result.success).toBe(false);
    });
});

// =============================================================================
// Validation helpers
// =============================================================================

describe('Validation Helpers', () => {
    it('validateCreator returns success for valid data', () => {
        const result = validateCreator(VALID_CREATOR);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data!.name).toBe('Roger Deakins');
    });

    it('validateCreator returns error for invalid data', () => {
        const result = validateCreator({ name: '' });
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('validateBatchCreator accepts minimal data', () => {
        const result = validateBatchCreator({ name: 'Test' });
        expect(result.success).toBe(true);
    });

    it('validateMatchRequest accepts valid brief', () => {
        const result = validateMatchRequest({ brief: 'Find cinematographer' });
        expect(result.success).toBe(true);
    });

    it('validateCategorizeRequest accepts valid bio', () => {
        const result = validateCategorizeRequest({ bio: 'Some bio text' });
        expect(result.success).toBe(true);
    });
});
