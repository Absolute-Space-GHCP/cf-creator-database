/**
 * @file goldenRecords.ts
 * @description Golden Record fixture helpers for tests that focus on the lookalike model
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Cursor (IDE)
 * @created 2026-02-23
 * @updated 2026-02-23
 */

import type { Creator } from '../../src/schemas';
import { ROGER_DEAKINS, ASH_THORP, PAUL_SHORTINO, ALL_CREATORS } from './creators';

/** The 3 Golden Record fixtures */
export const GOLDEN_RECORDS: Creator[] = [ROGER_DEAKINS, ASH_THORP, PAUL_SHORTINO];

/** IDs of all Golden Record fixtures */
export const GOLDEN_RECORD_IDS: string[] = GOLDEN_RECORDS.map((c) => c.id);

/** Non-golden-record fixture creators */
export const NON_GOLDEN_CREATORS: Creator[] = ALL_CREATORS.filter(
    (c) => !c.matching?.isGoldenRecord,
);

/** Quick check: is this fixture creator a golden record? */
export function isGoldenRecord(creatorId: string): boolean {
    return GOLDEN_RECORD_IDS.includes(creatorId);
}
