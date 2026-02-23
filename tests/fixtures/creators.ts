/**
 * @file creators.ts
 * @description Mock creator fixtures for unit and integration tests
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-23
 */

import type { Creator } from '../../src/schemas';

const TS = '2026-01-28T00:00:00Z';

// =============================================================================
// Golden Records (3)
// =============================================================================

export const ROGER_DEAKINS: Creator = {
    id: 'fixture-deakins',
    name: 'Roger Deakins',
    handle: '@rogerdeakins',
    platform: 'vimeo',
    source: {
        type: 'festival',
        name: 'Academy Awards',
        url: 'https://www.oscars.org',
        discoveredAt: TS,
    },
    craft: {
        primary: 'cinematographer',
        secondary: ['director'],
        styleSignature:
            'Master of naturalistic lighting with an unparalleled ability to create atmosphere through shadow and texture.',
        technicalTags: ['#ARRIAlexa', '#NaturalLight', '#Anamorphic', '#FilmEmulation'],
        subjectMatterTags: ['entertainment'],
        subjectSubcategoryTags: ['film-tv'],
        primaryMedium: 'video',
        classification: 'film_narrative',
    },
    matching: {
        positiveKeywords: ['cinematography', 'lighting', 'atmosphere', 'narrative', 'feature film', 'oscar winner'],
        negativeKeywords: [],
        qualityScore: 100,
        isGoldenRecord: true,
    },
    contact: {
        location: 'Los Angeles, CA',
        locationConstraints: 'flexible',
        isHireable: false,
    },
    createdAt: TS,
    updatedAt: TS,
};

export const ASH_THORP: Creator = {
    id: 'fixture-thorp',
    name: 'Ash Thorp',
    handle: '@ashthorp',
    platform: 'behance',
    source: {
        type: 'community',
        name: 'Motionographer',
        url: 'https://motionographer.com',
        discoveredAt: TS,
    },
    craft: {
        primary: 'motion_designer',
        secondary: ['3d_artist', 'director'],
        styleSignature:
            'Boundary-pushing motion designer blending photorealistic 3D with bold graphic design.',
        technicalTags: ['#Cinema4D', '#Octane', '#AfterEffects', '#UnrealEngine5'],
        subjectMatterTags: ['entertainment', 'tech'],
        subjectSubcategoryTags: ['film-tv', 'gaming'],
        primaryMedium: 'video',
        classification: 'commercial',
    },
    matching: {
        positiveKeywords: ['motion design', '3d', 'title sequence', 'commercial', 'sci-fi', 'futuristic'],
        negativeKeywords: [],
        qualityScore: 97,
        isGoldenRecord: true,
    },
    contact: {
        location: 'Los Angeles, CA',
        locationConstraints: 'flexible',
        isHireable: true,
    },
    createdAt: TS,
    updatedAt: TS,
};

export const PAUL_SHORTINO: Creator = {
    id: 'fixture-shortino',
    name: 'Paul Shortino',
    handle: '@paulshortino',
    platform: 'artstation',
    source: {
        type: 'platform',
        name: 'ArtStation',
        url: 'https://artstation.com/paulshortino',
        discoveredAt: TS,
    },
    craft: {
        primary: '3d_artist',
        secondary: ['compositor', 'vfx_artist'],
        styleSignature:
            'Photoreal 3D artist specializing in automotive and product visualization.',
        technicalTags: ['#HoudiniFX', '#Redshift3D', '#Automotive', '#ProductViz'],
        subjectMatterTags: ['automotive', 'product'],
        subjectSubcategoryTags: ['luxury-automotive'],
        primaryMedium: 'video',
        classification: 'commercial',
    },
    matching: {
        positiveKeywords: ['3d', 'automotive', 'product', 'photoreal', 'commercial', 'cgi'],
        negativeKeywords: [],
        qualityScore: 94,
        isGoldenRecord: true,
    },
    contact: {
        location: 'London, UK',
        locationConstraints: 'flexible',
        isHireable: true,
    },
    createdAt: TS,
    updatedAt: TS,
};

// =============================================================================
// Standard creators (9) — one per remaining craft + extra diversity
// =============================================================================

export const SOFIA_VARGA: Creator = {
    id: 'fixture-varga',
    name: 'Sofia Varga',
    handle: '@sofiavarga',
    platform: 'vimeo',
    source: {
        type: 'festival',
        name: 'Sundance Film Festival',
        url: 'https://sundance.org',
        discoveredAt: TS,
    },
    craft: {
        primary: 'director',
        secondary: ['editor'],
        styleSignature:
            'Intimate character-driven narratives with a handheld documentary feel.',
        technicalTags: ['#REDKomodo', '#DaVinciResolve', '#HandheldCamera'],
        subjectMatterTags: ['entertainment', 'lifestyle'],
        primaryMedium: 'video',
        classification: 'documentary',
    },
    matching: {
        positiveKeywords: ['director', 'documentary', 'narrative', 'indie', 'character study'],
        negativeKeywords: [],
        qualityScore: 88,
        isGoldenRecord: false,
    },
    contact: {
        email: 'sofia@vargafilms.com',
        portfolio_url: 'https://vimeo.com/sofiavarga',
        location: 'New York, NY',
        locationConstraints: 'on_site',
        budgetTier: 'mid-tier',
        isHireable: true,
    },
    createdAt: TS,
    updatedAt: TS,
};

export const MARCUS_CHEN: Creator = {
    id: 'fixture-chen',
    name: 'Marcus Chen',
    handle: '@marcusvfx',
    platform: 'artstation',
    source: {
        type: 'community',
        name: 'fxphd',
        url: 'https://fxphd.com',
        discoveredAt: TS,
    },
    craft: {
        primary: 'vfx_artist',
        secondary: ['compositor'],
        styleSignature:
            'Invisible VFX specialist making impossible shots feel seamless and grounded.',
        technicalTags: ['#Nuke', '#HoudiniFX', '#FlameAutodesk', '#MotionCapture'],
        subjectMatterTags: ['entertainment'],
        subjectSubcategoryTags: ['film-tv'],
        primaryMedium: 'video',
        classification: 'film_narrative',
    },
    matching: {
        positiveKeywords: ['vfx', 'compositing', 'invisible effects', 'film', 'feature'],
        negativeKeywords: [],
        qualityScore: 91,
        isGoldenRecord: false,
    },
    contact: {
        email: 'marcus@chenvfx.co',
        portfolio_url: 'https://artstation.com/marcusvfx',
        location: 'Vancouver, BC',
        locationConstraints: 'flexible',
        budgetTier: 'established',
        isHireable: true,
    },
    createdAt: TS,
    updatedAt: TS,
};

export const ELENA_KOVAC: Creator = {
    id: 'fixture-kovac',
    name: 'Elena Kovac',
    handle: '@elenacolor',
    platform: 'youtube',
    source: {
        type: 'platform',
        name: 'YouTube',
        url: 'https://youtube.com/@elenacolor',
        discoveredAt: TS,
    },
    craft: {
        primary: 'colorist',
        secondary: [],
        styleSignature:
            'Film-emulation colorist specialising in warm cinematic grades and teal-orange palettes.',
        technicalTags: ['#DaVinciResolve', '#FilmLUT', '#ACES', '#HDR'],
        subjectMatterTags: ['entertainment', 'fashion'],
        primaryMedium: 'video',
        classification: 'music_video',
    },
    matching: {
        positiveKeywords: ['color grading', 'colorist', 'film look', 'music video', 'commercial'],
        negativeKeywords: [],
        qualityScore: 82,
        isGoldenRecord: false,
    },
    contact: {
        email: 'elena@kovaccolor.com',
        location: 'Berlin, Germany',
        locationConstraints: 'digital_only',
        budgetTier: 'mid-tier',
        isHireable: true,
    },
    createdAt: TS,
    updatedAt: TS,
};

export const YUKI_TANAKA: Creator = {
    id: 'fixture-tanaka',
    name: 'Yuki Tanaka',
    handle: '@yukianim',
    platform: 'vimeo',
    source: {
        type: 'festival',
        name: 'Annecy Animation Festival',
        url: 'https://annecy.org',
        discoveredAt: TS,
    },
    craft: {
        primary: 'animator',
        secondary: ['motion_designer'],
        styleSignature:
            'Hand-drawn cel animation meets modern digital compositing, whimsical and fluid.',
        technicalTags: ['#TVPaint', '#ToonBoom', '#AfterEffects', '#ProcreateAnimation'],
        subjectMatterTags: ['entertainment', 'children'],
        primaryMedium: 'video',
        classification: 'animation',
    },
    matching: {
        positiveKeywords: ['2d animation', 'hand-drawn', 'cel animation', 'character animation'],
        negativeKeywords: [],
        qualityScore: 85,
        isGoldenRecord: false,
    },
    contact: {
        portfolio_url: 'https://vimeo.com/yukianim',
        location: 'Tokyo, Japan',
        locationConstraints: 'digital_only',
        budgetTier: 'mid-tier',
        isHireable: true,
    },
    createdAt: TS,
    updatedAt: TS,
};

export const OMAR_HASSAN: Creator = {
    id: 'fixture-hassan',
    name: 'Omar Hassan',
    handle: '@omarsfx',
    platform: 'youtube',
    source: {
        type: 'community',
        name: 'A Sound Effect',
        url: 'https://asoundeffect.com',
        discoveredAt: TS,
    },
    craft: {
        primary: 'sound_designer',
        secondary: [],
        styleSignature:
            'Immersive spatial audio designer crafting rich sonic landscapes for film and games.',
        technicalTags: ['#ProTools', '#Atmos', '#FieldRecording', '#FMOD'],
        subjectMatterTags: ['entertainment', 'tech'],
        subjectSubcategoryTags: ['gaming', 'film-tv'],
        primaryMedium: 'audio',
        classification: 'sound_design',
    },
    matching: {
        positiveKeywords: ['sound design', 'spatial audio', 'Dolby Atmos', 'foley', 'game audio'],
        negativeKeywords: [],
        qualityScore: 78,
        isGoldenRecord: false,
    },
    contact: {
        email: 'omar@hassansound.io',
        location: 'Toronto, Canada',
        locationConstraints: 'flexible',
        budgetTier: 'emerging',
        isHireable: true,
    },
    createdAt: TS,
    updatedAt: TS,
};

export const LENA_PETROVA: Creator = {
    id: 'fixture-petrova',
    name: 'Lena Petrova',
    handle: '@lenapetrova3d',
    platform: 'behance',
    source: {
        type: 'platform',
        name: 'Behance',
        url: 'https://behance.net/lenapetrova3d',
        discoveredAt: TS,
    },
    craft: {
        primary: '3d_artist',
        secondary: ['animator'],
        styleSignature:
            'Stylised 3D character artist with a focus on expressive topology and vibrant textures.',
        technicalTags: ['#Blender', '#ZBrush', '#SubstancePainter', '#Marmoset'],
        subjectMatterTags: ['entertainment'],
        subjectSubcategoryTags: ['gaming'],
        primaryMedium: 'still',
        classification: 'illustration',
    },
    matching: {
        positiveKeywords: ['3d character', 'stylized', 'game art', 'character design'],
        negativeKeywords: [],
        qualityScore: 76,
        isGoldenRecord: false,
    },
    contact: {
        portfolio_url: 'https://behance.net/lenapetrova3d',
        location: 'Kyiv, Ukraine',
        locationConstraints: 'digital_only',
        budgetTier: 'emerging',
        isHireable: true,
    },
    createdAt: TS,
    updatedAt: TS,
};

export const JAKE_MORRISON: Creator = {
    id: 'fixture-morrison',
    name: 'Jake Morrison',
    handle: '@jakemorrison',
    platform: 'other',
    source: {
        type: 'referral',
        name: 'CatchFire Internal',
    },
    craft: {
        primary: 'cinematographer',
        secondary: ['colorist'],
        styleSignature:
            'High-end food and beverage cinematographer with a sculptural approach to light.',
        technicalTags: ['#SonyVenice', '#MacroLens', '#Phantom', '#TableTop'],
        subjectMatterTags: ['food', 'beverage'],
        subjectSubcategoryTags: ['restaurant', 'beverage'],
        primaryMedium: 'video',
        classification: 'commercial',
    },
    matching: {
        positiveKeywords: ['food', 'beverage', 'tabletop', 'product shot', 'commercial'],
        negativeKeywords: [],
        qualityScore: 86,
        isGoldenRecord: false,
    },
    contact: {
        email: 'jake@morrisoncinema.com',
        portfolio_url: 'https://morrisoncinema.com',
        location: 'Chicago, IL',
        locationConstraints: 'on_site',
        budgetTier: 'established',
        isHireable: true,
    },
    createdAt: TS,
    updatedAt: TS,
};

export const NINA_WILLIAMS: Creator = {
    id: 'fixture-williams',
    name: 'Nina Williams',
    handle: '@ninawilliams',
    platform: 'vimeo',
    source: {
        type: 'manual',
        name: 'Manual entry',
    },
    craft: {
        primary: 'director',
        secondary: ['cinematographer'],
        styleSignature:
            'Bold fashion film director known for surreal set pieces and saturated colour palettes.',
        technicalTags: ['#ARRIMini', '#Cooke', '#SteadicamOp'],
        subjectMatterTags: ['fashion', 'beauty', 'luxury'],
        subjectSubcategoryTags: ['high-fashion'],
        primaryMedium: 'video',
        classification: 'commercial',
    },
    matching: {
        positiveKeywords: ['fashion film', 'beauty', 'luxury brand', 'surreal', 'editorial'],
        negativeKeywords: [],
        qualityScore: 90,
        isGoldenRecord: false,
    },
    contact: {
        email: 'nina@williamsdirects.com',
        portfolio_url: 'https://vimeo.com/ninawilliams',
        location: 'Paris, France',
        locationConstraints: 'flexible',
        budgetTier: 'established',
        isHireable: true,
    },
    createdAt: TS,
    updatedAt: TS,
};

export const INFLUENCER_CREATOR: Creator = {
    id: 'fixture-influencer',
    name: 'ViralVicky',
    handle: '@viralvicky',
    platform: 'other',
    craft: {
        primary: 'other',
        secondary: [],
        styleSignature: 'lifestyle vlogger trending on fyp with viral content',
        technicalTags: ['#canonm50', '#vlog'],
    },
    matching: {
        positiveKeywords: ['content creator', 'influencer'],
        negativeKeywords: ['fyp', 'viral', 'trending'],
        qualityScore: 20,
        isGoldenRecord: false,
    },
    contact: {
        location: 'Miami, FL',
        isHireable: true,
    },
    createdAt: TS,
    updatedAt: TS,
};

// =============================================================================
// Aggregate exports
// =============================================================================

/** All 12 fixture creators */
export const ALL_CREATORS: Creator[] = [
    ROGER_DEAKINS,
    ASH_THORP,
    PAUL_SHORTINO,
    SOFIA_VARGA,
    MARCUS_CHEN,
    ELENA_KOVAC,
    YUKI_TANAKA,
    OMAR_HASSAN,
    LENA_PETROVA,
    JAKE_MORRISON,
    NINA_WILLIAMS,
    INFLUENCER_CREATOR,
];

/** Lookup a fixture creator by id */
export function getCreator(id: string): Creator | undefined {
    return ALL_CREATORS.find((c) => c.id === id);
}

/** Fixture creators keyed by id for fast access */
export const CREATORS_BY_ID: Record<string, Creator> = Object.fromEntries(
    ALL_CREATORS.map((c) => [c.id, c]),
);
