/**
 * @file index.ts
 * @description Barrel export for all test fixtures
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-23
 */

export {
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
    ALL_CREATORS,
    getCreator,
    CREATORS_BY_ID,
} from './creators';

export {
    getEmbedding,
    getEmbeddingIds,
    EMBEDDING_DIMENSIONS,
    cosineSimilarity,
} from './embeddings';

export {
    GOLDEN_RECORDS,
    GOLDEN_RECORD_IDS,
    NON_GOLDEN_CREATORS,
    isGoldenRecord,
} from './goldenRecords';
