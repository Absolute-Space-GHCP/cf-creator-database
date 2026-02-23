/**
 * @file e2e-semantic.test.ts
 * @description End-to-end tests validating the full semantic search pipeline:
 *   embed query → cosine similarity → score → rank results
 *   Uses mock embeddings and real scoring functions (no live API calls).
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-23
 */

import { describe, it, expect } from 'vitest';
import {
    ALL_CREATORS,
    ROGER_DEAKINS,
    ASH_THORP,
    PAUL_SHORTINO,
    INFLUENCER_CREATOR,
    GOLDEN_RECORDS,
    NON_GOLDEN_CREATORS,
    getEmbedding,
    getEmbeddingIds,
    cosineSimilarity,
    EMBEDDING_DIMENSIONS,
} from './fixtures';
import { scoreCreator, rankCreators, WEIGHTS } from '../src/scoring';
import type { Creator } from '../src/schemas';

// =============================================================================
// Pipeline simulation helpers
// =============================================================================

/** Seeded PRNG (Mulberry32) — mirrors the one in fixtures/embeddings.ts */
function mulberry32(seed: number): () => number {
    let state = seed | 0;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        const unsigned = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        return unsigned * 2 - 1;
    };
}

function hashString(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = (Math.imul(31, hash) + s.charCodeAt(i)) | 0;
    }
    return hash;
}

/**
 * Generate a deterministic mock query embedding (768-dim, L2-normalised).
 * In production this would call the Vertex AI embedding API.
 */
function embedQuery(query: string): number[] {
    const rng = mulberry32(hashString(`query:${query}`));
    const vec = new Array(EMBEDDING_DIMENSIONS);
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
        vec[i] = rng();
    }
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
        for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) vec[i] /= norm;
    }
    return vec;
}

interface SemanticResult {
    creator: Creator;
    similarity: number;
    briefScore: number;
    combinedScore: number;
    matchReasons: string[];
}

/**
 * Full semantic search pipeline (mocked — no live API).
 *
 * 1. Embed the query text → 768-dim vector
 * 2. Cosine similarity vs every creator embedding
 * 3. Brief-based scoring via `scoreCreator`
 * 4. Weighted combination: 40 % semantic + 60 % brief scoring
 * 5. Filter by threshold → sort descending → limit
 */
function semanticSearch(
    query: string,
    creators: Creator[],
    options: { threshold?: number; limit?: number } = {},
): SemanticResult[] {
    const { threshold = 0, limit = 10 } = options;

    const queryVec = embedQuery(query);

    const results: SemanticResult[] = creators.map((creator) => {
        const creatorVec = getEmbedding(creator.id);
        const similarity = cosineSimilarity(queryVec, creatorVec);

        const { score: briefScore, reasons } = scoreCreator(creator, query);

        // Normalise similarity from [-1,1] → [0,100] for combination
        const normSimilarity = ((similarity + 1) / 2) * 100;
        const combinedScore = 0.4 * normSimilarity + 0.6 * briefScore;

        return {
            creator,
            similarity,
            briefScore,
            combinedScore: Math.round(combinedScore * 100) / 100,
            matchReasons: reasons,
        };
    });

    return results
        .filter((r) => r.combinedScore >= threshold)
        .sort((a, b) => b.combinedScore - a.combinedScore)
        .slice(0, limit);
}

// =============================================================================
// Tests
// =============================================================================

describe('E2E Semantic Search Pipeline', () => {
    // -----------------------------------------------------------------
    // (a) Full pipeline — "cinematography" query
    // -----------------------------------------------------------------
    describe('Full pipeline: cinematography query', () => {
        const QUERY =
            'Looking for an experienced cinematographer with naturalistic lighting for a narrative feature film';

        it('returns results', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS, { threshold: 10 });
            expect(results.length).toBeGreaterThan(0);
        });

        it('ranks cinematographer fixtures highest', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS, { threshold: 10 });
            expect(results[0].creator.name).toBe('Roger Deakins');
        });

        it('Roger Deakins has the highest combinedScore', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS);
            const deakins = results.find((r) => r.creator.id === ROGER_DEAKINS.id)!;
            for (const r of results) {
                expect(deakins.combinedScore).toBeGreaterThanOrEqual(r.combinedScore);
            }
        });

        it('influencer ViralVicky ranks near bottom', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS);
            const vicky = results.find((r) => r.creator.id === INFLUENCER_CREATOR.id);
            if (vicky) {
                const vickyIdx = results.indexOf(vicky);
                expect(vickyIdx).toBeGreaterThan(results.length / 2);
            }
        });

        it('each result carries matchReasons', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS);
            for (const r of results) {
                expect(Array.isArray(r.matchReasons)).toBe(true);
                expect(r.matchReasons.length).toBeGreaterThan(0);
            }
        });
    });

    // -----------------------------------------------------------------
    // (b) Negative test — nonsense query
    // -----------------------------------------------------------------
    describe('Negative test: underwater basket weaving', () => {
        const QUERY = 'underwater basket weaving in a remote village';
        const HIGH_THRESHOLD = 55;

        it('returns zero results above a meaningful threshold', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS, {
                threshold: HIGH_THRESHOLD,
            });
            expect(results.length).toBe(0);
        });

        it('all combined scores stay below threshold', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS, { threshold: 0 });
            for (const r of results) {
                expect(r.combinedScore).toBeLessThan(HIGH_THRESHOLD);
            }
        });

        it('brief scores are low for every creator', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS);
            const maxBriefScore = Math.max(...results.map((r) => r.briefScore));
            expect(maxBriefScore).toBeLessThan(60);
        });
    });

    // -----------------------------------------------------------------
    // (c) Multi-craft query — "motion design" + "3D"
    // -----------------------------------------------------------------
    describe('Multi-craft query: motion design + 3D', () => {
        const QUERY =
            'Need a motion designer with strong 3D skills for a commercial title sequence using Cinema 4D';

        it('both Ash Thorp and Paul Shortino appear in results', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS, { threshold: 10 });
            const names = results.map((r) => r.creator.name);
            expect(names).toContain('Ash Thorp');
            expect(names).toContain('Paul Shortino');
        });

        it('Ash Thorp ranks in top 2 (primary motion_designer + secondary 3d_artist)', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS, { threshold: 10 });
            const ashIdx = results.findIndex((r) => r.creator.name === 'Ash Thorp');
            expect(ashIdx).toBeLessThanOrEqual(1);
        });

        it('3D artist Lena Petrova also appears (secondary craft overlap)', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS, { threshold: 10 });
            const names = results.map((r) => r.creator.name);
            expect(names).toContain('Lena Petrova');
        });

        it('non-3D / non-motion creators score lower than multi-craft matches', () => {
            const results = semanticSearch(QUERY, ALL_CREATORS);
            const ashResult = results.find((r) => r.creator.name === 'Ash Thorp')!;
            const influencerResult = results.find(
                (r) => r.creator.name === 'ViralVicky',
            );
            if (influencerResult) {
                expect(ashResult.combinedScore).toBeGreaterThan(
                    influencerResult.combinedScore,
                );
            }
        });
    });

    // -----------------------------------------------------------------
    // (d) Golden Record boost
    // -----------------------------------------------------------------
    describe('Golden Record boost', () => {
        it('golden record creators receive the goldenRecordBonus in breakdown', () => {
            for (const gr of GOLDEN_RECORDS) {
                const { breakdown } = scoreCreator(gr, 'general creative talent');
                expect(breakdown.goldenRecord).toBe(WEIGHTS.goldenRecordBonus);
            }
        });

        it('non-golden creators do NOT receive goldenRecordBonus', () => {
            for (const c of NON_GOLDEN_CREATORS) {
                const { breakdown } = scoreCreator(c, 'general creative talent');
                expect(breakdown.goldenRecord).toBeUndefined();
            }
        });

        it('golden records outscore comparable non-golden creators in pipeline', () => {
            const QUERY = 'cinematographer for a narrative feature film';
            const results = semanticSearch(QUERY, ALL_CREATORS);

            const deakins = results.find((r) => r.creator.id === ROGER_DEAKINS.id)!;
            const jake = results.find((r) => r.creator.name === 'Jake Morrison')!;

            // Both are cinematographers, but Deakins is golden
            expect(deakins.briefScore).toBeGreaterThan(jake.briefScore);
            expect(deakins.combinedScore).toBeGreaterThan(jake.combinedScore);
        });

        it('golden record bonus value is positive and meaningful', () => {
            expect(WEIGHTS.goldenRecordBonus).toBeGreaterThan(0);
            expect(WEIGHTS.goldenRecordBonus).toBeLessThanOrEqual(25);
        });
    });

    // -----------------------------------------------------------------
    // (e) Empty query — graceful handling
    // -----------------------------------------------------------------
    describe('Empty query: graceful handling', () => {
        it('does not throw for an empty string', () => {
            expect(() => semanticSearch('', ALL_CREATORS)).not.toThrow();
        });

        it('returns results (quality-score + golden-record baseline)', () => {
            const results = semanticSearch('', ALL_CREATORS);
            expect(results.length).toBeGreaterThan(0);
        });

        it('brief scores reflect only baseline signals (quality, golden, craft indicators)', () => {
            const results = semanticSearch('', ALL_CREATORS);
            for (const r of results) {
                const { breakdown } = scoreCreator(r.creator, '');
                expect(breakdown.primaryCraft).toBeUndefined();
                expect(breakdown.location).toBeUndefined();
                expect(breakdown.technicalTags).toBeUndefined();
                expect(breakdown.positiveKeywords).toBeUndefined();
            }
        });

        it('scoreCreator returns a valid result for empty brief', () => {
            const result = scoreCreator(ROGER_DEAKINS, '');
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
            expect(Array.isArray(result.reasons)).toBe(true);
        });
    });

    // -----------------------------------------------------------------
    // (f) Location filtering
    // -----------------------------------------------------------------
    describe('Location filtering', () => {
        it('creators in Los Angeles score higher for LA-based query', () => {
            const QUERY = 'cinematographer based in Los Angeles for a feature film';
            const results = semanticSearch(QUERY, ALL_CREATORS);

            const laCreators = results.filter((r) =>
                r.creator.contact?.location?.includes('Los Angeles'),
            );
            const nonLaCreators = results.filter(
                (r) => !r.creator.contact?.location?.includes('Los Angeles'),
            );

            if (laCreators.length > 0 && nonLaCreators.length > 0) {
                const avgLa =
                    laCreators.reduce((s, r) => s + r.briefScore, 0) / laCreators.length;
                const avgNonLa =
                    nonLaCreators.reduce((s, r) => s + r.briefScore, 0) /
                    nonLaCreators.length;
                expect(avgLa).toBeGreaterThan(avgNonLa);
            }
        });

        it('location match adds the locationMatch weight to breakdown', () => {
            const result = scoreCreator(
                ROGER_DEAKINS,
                'cinematographer in Los Angeles',
            );
            expect(result.breakdown.location).toBe(WEIGHTS.locationMatch);
        });

        it('location does NOT match for unrelated city', () => {
            const result = scoreCreator(ROGER_DEAKINS, 'cinematographer in Tokyo');
            expect(result.breakdown.location).toBeUndefined();
        });

        it('New York query boosts NY-based creator Sofia Varga', () => {
            const QUERY = 'director for a documentary in New York';
            const results = semanticSearch(QUERY, ALL_CREATORS);

            const sofia = results.find((r) => r.creator.name === 'Sofia Varga')!;
            expect(sofia).toBeDefined();
            expect(sofia.briefScore).toBeGreaterThan(30);

            const { breakdown } = scoreCreator(sofia.creator, QUERY);
            expect(breakdown.location).toBe(WEIGHTS.locationMatch);
        });

        it('Chicago query boosts Jake Morrison', () => {
            const result = scoreCreator(
                ALL_CREATORS.find((c) => c.name === 'Jake Morrison')!,
                'food cinematographer based in Chicago',
            );
            expect(result.breakdown.location).toBe(WEIGHTS.locationMatch);
        });
    });

    // -----------------------------------------------------------------
    // Pipeline structural integrity
    // -----------------------------------------------------------------
    describe('Pipeline structural integrity', () => {
        it('all fixture creators have valid 768-dim embeddings', () => {
            const ids = getEmbeddingIds();
            expect(ids.length).toBe(ALL_CREATORS.length);

            for (const id of ids) {
                const vec = getEmbedding(id);
                expect(vec.length).toBe(768);
            }
        });

        it('cosine similarity of identical vectors is ~1', () => {
            const vec = getEmbedding(ROGER_DEAKINS.id);
            expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5);
        });

        it('cosine similarity is symmetric', () => {
            const a = getEmbedding(ROGER_DEAKINS.id);
            const b = getEmbedding(ASH_THORP.id);
            expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
        });

        it('mock query embeddings are deterministic', () => {
            const q = 'test query';
            const v1 = embedQuery(q);
            const v2 = embedQuery(q);
            expect(v1).toEqual(v2);
        });

        it('different queries produce different embeddings', () => {
            const v1 = embedQuery('cinematographer');
            const v2 = embedQuery('sound designer');
            expect(v1).not.toEqual(v2);
        });

        it('combined scores are bounded and ordered', () => {
            const results = semanticSearch('cinematographer', ALL_CREATORS);
            for (let i = 1; i < results.length; i++) {
                expect(results[i - 1].combinedScore).toBeGreaterThanOrEqual(
                    results[i].combinedScore,
                );
            }
            for (const r of results) {
                expect(r.combinedScore).toBeGreaterThanOrEqual(0);
            }
        });

        it('limit option restricts output size', () => {
            const results = semanticSearch('creative talent', ALL_CREATORS, {
                limit: 3,
            });
            expect(results.length).toBeLessThanOrEqual(3);
        });

        it('threshold option filters low-scoring results', () => {
            const results = semanticSearch('cinematographer', ALL_CREATORS, {
                threshold: 40,
            });
            for (const r of results) {
                expect(r.combinedScore).toBeGreaterThanOrEqual(40);
            }
        });
    });
});
