/**
 * @file schemas.ts
 * @description Zod schemas and TypeScript types for CatchFire Creator data
 * @author Charley Scholz, JLIT
 * @coauthor Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-01-28
 */

import { z } from 'zod';

// =============================================================================
// 🎬 CRAFT CATEGORIES (as const for type inference)
// =============================================================================

export const CRAFT_TYPES = [
    'cinematographer',
    'director',
    'editor',
    'colorist',
    'vfx_artist',
    'compositor',
    'motion_designer',
    '3d_artist',
    'animator',
    'sound_designer',
    'producer',
    'gaffer',
    'photographer',
    'other'
] as const;

export const PLATFORMS = [
    'vimeo',
    'behance',
    'artstation',
    'instagram',
    'youtube',
    'tiktok',
    'the_rookies',
    'motionographer',
    'dribbble',
    'linkedin',
    'other'
] as const;

export const SOURCE_TYPES = [
    'festival',
    'platform',
    'community',
    'referral',
    'manual'
] as const;

export const LOCATION_CONSTRAINTS = [
    'digital_only',
    'on_site',
    'flexible'
] as const;

// Deck/docx alignment: primary output medium and classification
export const PRIMARY_MEDIA = ['still', 'video', 'audio'] as const;
export const BUDGET_TIERS = ['emerging', 'mid-tier', 'established'] as const;

/** Classification subtypes (docx Tier 1 output_subtype) */
export const CLASSIFICATION_STILL = ['photography', 'illustration', 'ai_imagery', 'art'] as const;
export const CLASSIFICATION_VIDEO = ['film_narrative', 'commercial', 'social_platform', 'documentary', 'music_video', 'animation'] as const;
export const CLASSIFICATION_AUDIO = ['podcast_spoken_word', 'music_composition', 'sound_design'] as const;
export const CLASSIFICATION_TYPES = [...CLASSIFICATION_STILL, ...CLASSIFICATION_VIDEO, ...CLASSIFICATION_AUDIO] as const;

/** Subject matter tags (deck/docx Tier 2) */
export const SUBJECT_MATTER_TAGS = [
    'food', 'beverage', 'automotive', 'fashion', 'beauty', 'lifestyle', 'portrait', 'product',
    'sports', 'travel', 'tech', 'medical', 'architecture', 'nature', 'children', 'seniors',
    'corporate', 'entertainment', 'luxury'
] as const;

/** Subcategory tags (narrower within subject matter); see config/subject-taxonomy.json for parent mapping */
export const SUBJECT_SUBCATEGORY_TAGS = [
    'music', 'film-tv', 'gaming', 'celebrity',
    'team-sports', 'individual-sports', 'action-sports', 'fitness',
    'restaurant', 'packaged-goods', 'recipe', 'beverage',
    'luxury-automotive', 'commercial-automotive', 'motorsport', 'lifestyle-automotive',
    'high-fashion', 'commercial-fashion', 'streetwear', 'accessories'
] as const;

// =============================================================================
// 📋 TYPE DEFINITIONS (inferred from constants)
// =============================================================================

export type CraftType = typeof CRAFT_TYPES[number];
export type Platform = typeof PLATFORMS[number];
export type SourceType = typeof SOURCE_TYPES[number];
export type LocationConstraint = typeof LOCATION_CONSTRAINTS[number];
export type PrimaryMedium = typeof PRIMARY_MEDIA[number];
export type BudgetTier = typeof BUDGET_TIERS[number];
export type SubjectMatterTag = typeof SUBJECT_MATTER_TAGS[number];
export type SubjectSubcategoryTag = typeof SUBJECT_SUBCATEGORY_TAGS[number];
export type ClassificationType = typeof CLASSIFICATION_TYPES[number];

// =============================================================================
// 📋 SUB-SCHEMAS
// =============================================================================

export const SourceSchema = z.object({
    type: z.enum(SOURCE_TYPES).optional(),
    name: z.string().optional(),
    url: z.string().url().optional().or(z.literal('')),
    discoveredAt: z.string().datetime().optional()
}).optional();

export const CraftSchema = z.object({
    primary: z.enum(CRAFT_TYPES).optional().default('other'),
    secondary: z.array(z.string()).optional().default([]),
    styleSignature: z.string().optional(),
    technicalTags: z.array(z.string()).optional().default([]),
    /** Subject matter (e.g. food, automotive, fashion). Max 10 per docx. */
    subjectMatterTags: z.array(z.string()).optional().default([]),
    /** Narrower subcategory (e.g. restaurant, luxury-automotive). Max 5 per docx. */
    subjectSubcategoryTags: z.array(z.string()).optional().default([]),
    /** Primary output medium: still | video | audio (deck/docx Tier 1). */
    primaryMedium: z.enum(PRIMARY_MEDIA).optional(),
    /** Output subtype (e.g. photography, documentary, music_video). */
    classification: z.string().optional()
}).optional();

export const MatchingSchema = z.object({
    positiveKeywords: z.array(z.string()).optional().default([]),
    negativeKeywords: z.array(z.string()).optional().default([]),
    qualityScore: z.number().min(0).max(100).optional(),
    isGoldenRecord: z.boolean().optional().default(false),
    lastVerified: z.string().datetime().optional()
}).optional();

export const ContactSchema = z.object({
    email: z.string().email().optional().or(z.literal('')),
    portfolio_url: z.string().url().optional().or(z.literal('')),
    location: z.string().optional(),
    locationConstraints: z.enum(LOCATION_CONSTRAINTS).optional(),
    rateRange: z.string().optional(),
    /** Normalized budget tier (deck/docx): emerging | mid-tier | established. */
    budgetTier: z.enum(BUDGET_TIERS).optional(),
    isHireable: z.boolean().optional().default(true)
}).optional();

// =============================================================================
// 🎯 MAIN SCHEMAS
// =============================================================================

/**
 * Schema for creating a new creator
 */
export const CreateCreatorSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    handle: z.string().optional(),
    platform: z.enum(PLATFORMS).default('other'),
    source: SourceSchema,
    craft: CraftSchema,
    matching: MatchingSchema,
    contact: ContactSchema,
    /** Last portfolio/activity date (ISO or YYYY-MM-DD). Deck/docx Tier 1. */
    lastActiveDate: z.string().optional()
});

/**
 * Schema for a creator stored in the database (includes id and timestamps)
 */
export const CreatorSchema = CreateCreatorSchema.extend({
    id: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});

/**
 * Schema for batch import (less strict)
 */
export const BatchCreatorSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    platform: z.enum(PLATFORMS).default('other'),
    handle: z.string().optional(),
    source: SourceSchema,
    craft: CraftSchema,
    matching: MatchingSchema,
    contact: ContactSchema,
    lastActiveDate: z.string().optional()
});

/**
 * Schema for matching request
 */
export const MatchRequestSchema = z.object({
    brief: z.string().min(1, 'Brief is required'),
    filters: z.object({
        craft: z.string().optional(),
        location: z.string().optional(),
        tags: z.array(z.string()).optional(),
        subjectMatter: z.union([z.string(), z.array(z.string())]).optional(),
        subjectSubcategory: z.union([z.string(), z.array(z.string())]).optional(),
        primaryMedium: z.enum(PRIMARY_MEDIA).optional(),
        budgetTier: z.enum(BUDGET_TIERS).optional(),
        minQualityScore: z.number().min(0).max(100).optional(),
        goldenRecordsOnly: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(10)
    }).default({ limit: 10 })
});

/**
 * Schema for categorization request
 */
export const CategorizeRequestSchema = z.object({
    bio: z.string().min(1, 'Bio is required'),
    portfolio_url: z.string().url().optional(),
    recentWork: z.array(z.string()).optional()
});

// =============================================================================
// 🔷 TYPESCRIPT TYPES (inferred from Zod schemas)
// =============================================================================

/** Type for creating a new creator (input) */
export type CreateCreatorInput = z.infer<typeof CreateCreatorSchema>;

/** Type for a creator stored in the database */
export type Creator = z.infer<typeof CreatorSchema>;

/** Type for batch import creator */
export type BatchCreatorInput = z.infer<typeof BatchCreatorSchema>;

/** Type for match request */
export type MatchRequest = z.infer<typeof MatchRequestSchema>;

/** Type for categorize request */
export type CategorizeRequest = z.infer<typeof CategorizeRequestSchema>;

/** Type for source information */
export type Source = z.infer<typeof SourceSchema>;

/** Type for craft information */
export type Craft = z.infer<typeof CraftSchema>;

/** Type for matching metadata */
export type Matching = z.infer<typeof MatchingSchema>;

/** Type for contact information */
export type Contact = z.infer<typeof ContactSchema>;

// =============================================================================
// 🎯 SCORING RESULT TYPES
// =============================================================================

export interface ScoreBreakdown {
    exactName?: number;
    exactHandle?: number;
    primaryCraft?: number;
    secondaryCraft?: number;
    location?: number;
    technicalTags?: number;
    positiveKeywords?: number;
    negativeKeywords?: number;
    goldenRecord?: number;
    qualityScore?: number;
    subjectMatter?: number;
    subjectSubcategory?: number;
    primaryMedium?: number;
}

export interface ScoreResult {
    score: number;
    rawScore: number;
    breakdown: ScoreBreakdown;
    reasons: string[];
}

export interface ScoredCreator extends Creator {
    matchScore: number;
    matchBreakdown: ScoreBreakdown;
    matchReasons: string[];
}

export interface ExtractedKeywords {
    crafts: string[];
    technical: string[];
    locations: string[];
    styles: string[];
    /** Subject matter inferred from brief (e.g. food, automotive). */
    subjects: string[];
    /** Primary medium inferred from brief (still, video, audio). */
    primaryMediumHint: string | null;
    raw: string[];
}

// =============================================================================
// 🔧 VALIDATION HELPERS
// =============================================================================

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Validate creator data for creation
 */
export function validateCreator(data: unknown): ValidationResult<CreateCreatorInput> {
    try {
        const validated = CreateCreatorSchema.parse(data);
        return { success: true, data: validated };
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: messages };
        }
        return { success: false, error: String(error) };
    }
}

/**
 * Validate creator data for batch import (lenient)
 */
export function validateBatchCreator(data: unknown): ValidationResult<BatchCreatorInput> {
    try {
        const validated = BatchCreatorSchema.parse(data);
        return { success: true, data: validated };
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: messages };
        }
        return { success: false, error: String(error) };
    }
}

/**
 * Validate match request
 */
export function validateMatchRequest(data: unknown): ValidationResult<MatchRequest> {
    try {
        const validated = MatchRequestSchema.parse(data);
        return { success: true, data: validated };
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: messages };
        }
        return { success: false, error: String(error) };
    }
}

/**
 * Validate categorization request
 */
export function validateCategorizeRequest(data: unknown): ValidationResult<CategorizeRequest> {
    try {
        const validated = CategorizeRequestSchema.parse(data);
        return { success: true, data: validated };
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
            return { success: false, error: messages };
        }
        return { success: false, error: String(error) };
    }
}
