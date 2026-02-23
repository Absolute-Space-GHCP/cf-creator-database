/**
 * @file embeddings.ts
 * @description Pre-computed deterministic 768-dimension embedding vectors for fixture creators
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-23
 */

import { ALL_CREATORS } from './creators';

const EMBEDDING_DIM = 768;

/**
 * Simple seeded PRNG (Mulberry32) that produces deterministic floats in [-1, 1].
 * NOT cryptographically secure — only for reproducible test data.
 */
function mulberry32(seed: number): () => number {
    let state = seed | 0;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        const unsigned = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        return unsigned * 2 - 1; // map [0,1) → [-1,1)
    };
}

/** Derive a numeric seed from a string (simple hash) */
function hashString(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = (Math.imul(31, hash) + s.charCodeAt(i)) | 0;
    }
    return hash;
}

/** Generate a deterministic 768-dim embedding for a given creator ID */
function generateEmbedding(creatorId: string): number[] {
    const rng = mulberry32(hashString(creatorId));
    const vec: number[] = new Array(EMBEDDING_DIM);
    for (let i = 0; i < EMBEDDING_DIM; i++) {
        vec[i] = rng();
    }

    // L2-normalize so dot-product equals cosine similarity
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
        for (let i = 0; i < EMBEDDING_DIM; i++) {
            vec[i] /= norm;
        }
    }
    return vec;
}

// Pre-compute embeddings for every fixture creator
const EMBEDDINGS_MAP: Map<string, number[]> = new Map(
    ALL_CREATORS.map((c) => [c.id, generateEmbedding(c.id)]),
);

/**
 * Retrieve a pre-computed 768-dim embedding vector for a fixture creator.
 * Throws if the creator ID is not found in the fixture set.
 */
export function getEmbedding(creatorId: string): number[] {
    const vec = EMBEDDINGS_MAP.get(creatorId);
    if (!vec) {
        throw new Error(`No fixture embedding for creator "${creatorId}"`);
    }
    return vec;
}

/** All fixture creator IDs that have embeddings */
export function getEmbeddingIds(): string[] {
    return [...EMBEDDINGS_MAP.keys()];
}

/** The dimensionality of every fixture embedding */
export const EMBEDDING_DIMENSIONS = EMBEDDING_DIM;

/** Utility: cosine similarity between two unit vectors (= dot product) */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error('Vectors must be same length');
    let dot = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
    }
    return dot;
}
