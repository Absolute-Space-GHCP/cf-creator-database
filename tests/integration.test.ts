/**
 * @file integration.test.ts
 * @description Integration tests for the full CatchFire pipeline:
 *   batch import -> Firestore write -> embedding generation -> semantic search
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-02-18
 * @updated 2026-02-18
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8090';

async function api(path: string, options?: RequestInit) {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    const data = await res.json();
    return { status: res.status, data };
}

describe('Pipeline Integration', () => {
    const testCreatorName = `Integration Test Creator ${Date.now()}`;
    let createdId: string;

    describe('Health & Prerequisites', () => {
        it('server is healthy', async () => {
            const { status, data } = await api('/health');
            expect(status).toBe(200);
            expect(data.status).toBe('ok');
        });

        it('Firestore has existing creators', async () => {
            const { data } = await api('/api/v1/stats');
            expect(data.stats.totalCreators).toBeGreaterThan(0);
        });

        it('LLM service is available', async () => {
            const { status, data } = await api('/api/v1/llm/test');
            expect(status).toBe(200);
            expect(data.success).toBe(true);
        });

        it('embedding service is available', async () => {
            const { status, data } = await api('/api/v1/embeddings/test');
            expect(status).toBe(200);
            expect(data.success).toBe(true);
        });
    });

    describe('Batch Import -> Firestore', () => {
        it('batch import creates new creators', async () => {
            const { status, data } = await api('/api/v1/creators/batch', {
                method: 'POST',
                body: JSON.stringify({
                    creators: [{
                        name: testCreatorName,
                        platform: 'vimeo',
                        source: { type: 'festival', name: 'Integration Test', url: 'https://test.example.com' },
                        craft: { primary: 'cinematographer', secondary: ['colorist'], technicalTags: ['#ArriAlexa', '#Anamorphic'] },
                        matching: { positiveKeywords: ['moody', 'cinematic'], negativeKeywords: [], qualityScore: 80 },
                        contact: { portfolio_url: 'https://test.example.com/portfolio', location: 'New York, USA' },
                    }],
                }),
            });
            expect([200, 201]).toContain(status);
            expect(data.success).toBe(true);
            expect(data.imported).toBe(1);
            createdId = data.results[0].id;
            expect(createdId).toBeTruthy();
        });

        it('imported creator is retrievable by ID', async () => {
            const { status, data } = await api(`/api/v1/creators/${createdId}`);
            expect(status).toBe(200);
            expect(data.creator.name).toBe(testCreatorName);
            expect(data.creator.craft.primary).toBe('cinematographer');
            expect(data.creator.contact.location).toBe('New York, USA');
        });

        it('imported creator appears in list', async () => {
            const { data } = await api('/api/v1/creators');
            const found = data.creators.find((c: any) => c.name === testCreatorName);
            expect(found).toBeTruthy();
        });
    });

    describe('Embedding Generation', () => {
        it('generates embedding for imported creator', async () => {
            const { status, data } = await api(`/api/v1/embeddings/generate/${createdId}`, {
                method: 'POST',
            });
            expect(status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.dimensions).toBe(768);
        });
    });

    describe('Semantic Search Retrieval', () => {
        it('semantic search returns results for relevant query', async () => {
            const { status, data } = await api('/api/v1/search/semantic', {
                method: 'POST',
                body: JSON.stringify({ query: 'cinematographer moody cinematic ARRI Alexa anamorphic New York' }),
            });
            expect(status).toBe(200);
            expect(data.results.length).toBeGreaterThan(0);
            expect(data.results[0].similarity).toBeGreaterThan(0);
        });

        it('brief matching returns the imported creator', async () => {
            const { status, data } = await api('/api/v1/match', {
                method: 'POST',
                body: JSON.stringify({
                    brief: 'Need a cinematographer with ARRI Alexa experience, moody cinematic style, based in New York',
                    filters: { limit: 20 },
                }),
            });
            expect(status).toBe(200);
            expect(data.matches.length).toBeGreaterThan(0);
            const found = data.matches.find((m: any) => m.name === testCreatorName);
            expect(found).toBeTruthy();
            expect(found.matchScore).toBeGreaterThan(0);
        });
    });

    describe('Feedback Loop', () => {
        it('records feedback for a match result', async () => {
            const { status, data } = await api('/api/v1/feedback', {
                method: 'POST',
                body: JSON.stringify({
                    event: 'match',
                    rating: 'up',
                    briefOrQuery: 'integration test brief',
                    creatorId: createdId,
                    comment: 'Integration test feedback',
                }),
            });
            expect(status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.recorded).toBe(true);
        });
    });

    describe('Golden Records Model', () => {
        it('lookalike model has golden records', async () => {
            const { data } = await api('/api/v1/lookalikes/model');
            expect(data.model.goldenRecordCount).toBeGreaterThan(0);
            expect(data.model.dimensions).toBe(768);
        });

        it('can score a creator against golden records', async () => {
            const { status, data } = await api(`/api/v1/lookalikes/score/${createdId}`);
            expect(status).toBe(200);
            expect(data.goldenRecordSimilarity).toBeDefined();
            expect(typeof data.goldenRecordSimilarity).toBe('number');
            expect(data.goldenRecordSimilarity).toBeGreaterThan(0);
        });
    });

    afterAll(async () => {
        // Clean up: we don't delete the test creator since the DB is shared
        // and the creator has a unique timestamp name that won't collide
    });
});
