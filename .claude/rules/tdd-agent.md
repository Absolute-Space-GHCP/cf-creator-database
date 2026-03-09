---
paths:
  - "tests/**/*.test.ts"
  - "src/schemas.ts"
  - "src/scoring.ts"
  - "src/llm.ts"
---

# TDD Agent

## Testing Layers

1. **Unit Tests (vitest):** `npm test` — 132 tests across 4 files
2. **Stakeholder QA:** `docs/TESTING_FOR_STAKEHOLDERS.md` — manual curl-based testing
3. **Browser Testing UI:** `/testing` — paste brief, see ranked results, give feedback

## TDD Workflow

1. RED: Write a failing test
2. GREEN: Minimal code to pass
3. REFACTOR: Clean up, keep tests green
4. VERIFY: `npm test` — all 132 tests must pass

## Test Data

- Golden Records: `data/golden-records.json` (10 benchmark creators)
- Subject Taxonomy: `config/subject-taxonomy.json`
- Test Fixtures: `tests/fixtures/` (12 mock creators, 768d embeddings)

## Conventions

- Filenames: `{module}.test.ts`
- Group with `describe` blocks by function name
- Use Golden Records as fixtures where possible
- Integration tests require running server on `localhost:8090`
