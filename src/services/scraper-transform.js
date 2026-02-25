/**
 * @file scraper-transform.js
 * @description Schema transform: converts Python scraper pipeline output (3-tier CreatorRecord)
 *              to the Matching Engine's BatchCreatorSchema format.
 * @author Charley Scholz, JLIT
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-02-25
 * @updated 2026-02-25
 */

const OUTPUT_TO_CRAFT = {
    photography: 'photographer',
    illustration: 'other',
    ai_imagery: 'other',
    art: 'other',
    film_narrative: 'director',
    commercial: 'director',
    social_platform: 'other',
    documentary: 'director',
    music_video: 'director',
    animation: 'animator',
    podcast_spoken_word: 'sound_designer',
    music_composition: 'sound_designer',
    sound_design: 'sound_designer'
};

const APPROACH_TO_CRAFT = {
    cinematography: 'cinematographer',
    cinematographer: 'cinematographer',
    colorist: 'colorist',
    color_grading: 'colorist',
    vfx: 'vfx_artist',
    visual_effects: 'vfx_artist',
    motion_design: 'motion_designer',
    motion_graphics: 'motion_designer',
    '3d': '3d_artist',
    '3d_artist': '3d_artist',
    editing: 'editor',
    editor: 'editor',
    compositing: 'compositor',
    gaffer: 'gaffer',
    lighting: 'gaffer'
};

const BUDGET_TO_RATE = {
    emerging: '$500-2,000/day',
    'mid-tier': '$2,000-5,000/day',
    established: '$5,000+/day'
};

function detectPlatform(url) {
    if (!url) return 'other';
    const lower = url.toLowerCase();
    if (lower.includes('vimeo')) return 'vimeo';
    if (lower.includes('behance')) return 'behance';
    if (lower.includes('artstation')) return 'artstation';
    if (lower.includes('instagram')) return 'instagram';
    if (lower.includes('youtube')) return 'youtube';
    if (lower.includes('tiktok')) return 'tiktok';
    if (lower.includes('therookies')) return 'the_rookies';
    if (lower.includes('motionographer')) return 'motionographer';
    if (lower.includes('dribbble')) return 'dribbble';
    if (lower.includes('linkedin')) return 'linkedin';
    return 'other';
}

function detectSourceType(url) {
    if (!url) return 'manual';
    const lower = url.toLowerCase();
    if (lower.includes('camerimage') || lower.includes('annecy') ||
        lower.includes('ciclope') || lower.includes('sitges') ||
        lower.includes('fantastic') || lower.includes('sxsw') ||
        lower.includes('ukmva') || lower.includes('promax')) {
        return 'festival';
    }
    if (lower.includes('vimeo') || lower.includes('behance') ||
        lower.includes('artstation') || lower.includes('therookies') ||
        lower.includes('motionographer')) {
        return 'platform';
    }
    if (lower.includes('reddit')) return 'community';
    return 'platform';
}

function calculateQualityScore(record) {
    let score = 50;
    if (record.average_rating) {
        score += Math.round(record.average_rating * 6);
    }
    if (record.budget_tier === 'established') score += 15;
    else if (record.budget_tier === 'mid-tier') score += 10;
    else if (record.budget_tier === 'emerging') score += 5;
    if (record.review_count && record.review_count >= 3) score += 5;
    return Math.min(100, Math.max(0, score));
}

function safeHostname(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return undefined;
    }
}

/**
 * Normalize a datetime string to RFC 3339 format accepted by Zod's z.string().datetime().
 * Python's datetime.isoformat() produces microsecond precision without timezone;
 * Zod requires 0 or 3 fractional digits with a Z or offset suffix.
 */
function normalizeISODatetime(value) {
    if (!value) return undefined;
    const str = String(value);
    const hasTimezone = /Z$/.test(str) || /[+-]\d{2}:\d{2}$/.test(str);
    const base = hasTimezone ? str.replace(/Z$|[+-]\d{2}:\d{2}$/, '') : str;
    const tz = hasTimezone ? str.slice(base.length) : 'Z';
    const truncated = base.replace(/(\.\d{3})\d*$/, '$1');
    return truncated + tz;
}

/**
 * Transform a single Python scraper record (CreatorRecord.to_dict() output)
 * into the Matching Engine's BatchCreatorSchema format.
 */
function transformRecord(record) {
    let primaryCraft = 'other';
    if (record.output_subtype && OUTPUT_TO_CRAFT[record.output_subtype]) {
        primaryCraft = OUTPUT_TO_CRAFT[record.output_subtype];
    }

    const approachStyle = record.approach_style || [];
    for (const style of approachStyle) {
        const craft = APPROACH_TO_CRAFT[style.toLowerCase()];
        if (craft) {
            primaryCraft = craft;
            break;
        }
    }

    const secondaryCrafts = [];
    for (const style of approachStyle) {
        const craft = APPROACH_TO_CRAFT[style.toLowerCase()];
        if (craft && craft !== primaryCraft && !secondaryCrafts.includes(craft)) {
            secondaryCrafts.push(craft);
        }
    }

    const styleSignatureParts = [
        ...(record.visual_style || []),
        ...(record.tone || [])
    ];
    const styleSignature = styleSignatureParts.length > 0
        ? styleSignatureParts.join(', ')
        : undefined;

    const positiveKeywords = [
        ...(record.subject_matter || []),
        ...(record.industry_vertical || []),
        ...(record.visual_style || []),
        ...(record.tone || [])
    ];

    const locationParts = [];
    if (record.location_city) locationParts.push(record.location_city);
    if (record.location_country) locationParts.push(record.location_country);
    const location = locationParts.length > 0 ? locationParts.join(', ') : undefined;

    let locationConstraints;
    if (record.remote_available === true) locationConstraints = 'flexible';
    else if (record.remote_available === false) locationConstraints = 'on_site';

    return {
        name: record.name,
        handle: undefined,
        platform: detectPlatform(record.portfolio_url),
        source: {
            type: detectSourceType(record.source_url),
            name: record.source_url ? safeHostname(record.source_url) : undefined,
            url: record.source_url || undefined,
            discoveredAt: normalizeISODatetime(record.created_at)
        },
        craft: {
            primary: primaryCraft,
            secondary: secondaryCrafts,
            styleSignature,
            technicalTags: record.technical_capability || []
        },
        matching: {
            positiveKeywords,
            negativeKeywords: [],
            qualityScore: calculateQualityScore(record),
            isGoldenRecord: (record.average_rating || 0) >= 4.5 && (record.review_count || 0) >= 3,
            lastVerified: normalizeISODatetime(record.updated_at)
        },
        contact: {
            email: record.contact_email || undefined,
            portfolio_url: record.portfolio_url || undefined,
            location,
            locationConstraints,
            rateRange: record.budget_tier ? BUDGET_TO_RATE[record.budget_tier] : undefined,
            isHireable: true
        }
    };
}

/**
 * Transform an array of Python pipeline output records into BatchCreatorSchema format.
 * Expects the `records` array from the pipeline JSON output (each element is CreatorRecord.to_dict()).
 *
 * @param {Object[]} records - Array of serialized CreatorRecord dicts from the Python pipeline
 * @returns {{ transformed: Object[], errors: string[] }}
 */
function transformScraperRecords(records) {
    const transformed = [];
    const errors = [];

    for (const record of records) {
        try {
            transformed.push(transformRecord(record));
        } catch (err) {
            errors.push(`Failed to transform "${record.name || 'unknown'}": ${err.message}`);
        }
    }

    return { transformed, errors };
}

module.exports = {
    transformScraperRecords,
    transformRecord,
    detectPlatform,
    detectSourceType,
    calculateQualityScore,
    OUTPUT_TO_CRAFT,
    APPROACH_TO_CRAFT,
    BUDGET_TO_RATE
};
