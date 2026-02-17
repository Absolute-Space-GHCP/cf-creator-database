/**
 * @file vitest.config.ts
 * @description Vitest configuration for CatchFire Matching Engine
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.6, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-02-17
 * @updated 2026-02-17
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
        testTimeout: 10000,
        coverage: {
            provider: 'v8',
            include: ['src/schemas.ts', 'src/scoring.ts', 'src/llm.ts'],
            reporter: ['text', 'text-summary']
        }
    }
});
