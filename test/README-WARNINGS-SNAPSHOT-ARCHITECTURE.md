# Console Warnings/Errors Snapshot System - Architecture

## Introduction

The snapshot system prevents new console warnings and errors from being introduced in tests by maintaining baseline snapshots of all existing issues. When tests run, the system captures console output, normalizes it for CI compatibility, and validates against the baseline.

### How It Works

**Core Mechanism:**

1. **Capture** - Console methods are intercepted to record warnings/errors during test execution
2. **Normalize** - Messages are normalized (paths → `<USER_PATH>`, numbers → `<NUMBER>`, etc.) for cross-platform consistency
3. **Store** - Each test saves its captured data to a test-specific temp file
4. **Aggregate** - After all tests complete, temp files are combined
5. **Validate** - Aggregated data is compared against the baseline snapshot
6. **Enforce** - If new warnings are found, tests fail with actionable error messages

**Two Modes:**

- **Validation Mode** (default): Fails if new warnings detected
- **Generation Mode** (`GENERATE_WARNINGS_SNAPSHOT=true`): Adds new warnings to baseline

**Key Design Principles:**

- **Additive Snapshots** - Warnings accumulate, never auto-removed (handles non-deterministic tests)
- **Independent Snapshots** - 3 separate files (unit/integration/e2e) don't affect each other
- **Test-Specific Temp Files** - One temp file per test enables granular updates
- **CI-Safe Normalization** - Aggressive path/number replacement ensures cross-platform stability

**Initial Baseline (November 2025):**

- Unit: 81 warnings + 262 errors = 343 issues
- Integration: 6 warnings + 9 errors = 15 issues
- E2E: 87 warnings + 0 errors = 87 issues
- **Total: 445 issues**

---

## System Flow

### Flow 1: Normal Test Execution (Validation Mode)

**Unit/Integration Tests (Jest):**

```
┌─────────────────────────────────────────────────┐
│ Developer runs: yarn test:unit <test-file>      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ jest.config.js                                   │
│ - setupFilesAfterEnv: test/jest/setup.ts        │
│ - globalTeardown: test/jest/global-teardown.ts  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ test/jest/setup.ts (runs before tests)          │
│ - Sets WARNINGS_SNAPSHOT_TYPE='unit'            │
│ - Calls setupConsoleCapture()                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ test/jest/console-capture.ts                    │
│                                                 │
│ beforeAll:                                      │
│   → Deletes stale temp file for this test       │
│   → Prevents false positives from old runs      │
│                                                 │
│ setupConsoleCapture():                          │
│   → Overrides console.warn/error                │
│   → Intercepts all console output               │
│   → Normalizes messages (paths, numbers, IDs)   │
│   → Stores in memory: captured.warnings[]       │
│   → Calls original console (still logs)         │
│                                                 │
│ afterAll:                                       │
│   → Extracts test file path from Jest context   │
│   → Saves to temp file if data exists:          │
│     warnings-unit-test-<testname>.json          │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ All tests complete                              │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ test/jest/global-teardown.ts (runs once)        │
│                                                 │
│ aggregateTestSnapshots():                       │
│   → Reads all warnings-unit-test-*.json files   │
│   → Combines into single object                 │
│   → Extracts testFilePath for error messages    │
│                                                 │
│ compareWithSnapshot():                          │
│   → Loads test-warnings-snapshot-unit.json      │
│   → Finds warnings NOT in baseline              │
│   → Returns newWarnings[] and newErrors[]       │
│                                                 │
│ If new issues found:                            │
│   → formatComparisonResults() creates message   │
│   → Shows copy-paste instructions               │
│   → Shows exact update command                  │
│   → throw Error('New console warnings...')      │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
          ┌───────┴────────┐
          │                │
          ▼                ▼
       Success           Fail
      (exit 0)     (exit 1 + message)
```

**E2E Tests (Mocha):**

```
┌─────────────────────────────────────────────────┐
│ Developer runs: yarn test:e2e:single <test-file>│
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ test() calls withFixtures()                     │
│ (test/e2e/helpers.js)                           │
│                                                 │
│ Start of withFixtures:                          │
│   → Extract test file path from stack trace     │
│   → Delete stale temp file if exists            │
│                                                 │
│ Setup:                                          │
│   → Start browser, extension, dapp              │
│   → Run test code                               │
│                                                 │
│ After test completes:                           │
│   → Capture driver.errors (from CDP)            │
│   → Capture driver.warnings (from CDP)          │
│   → Call validateSnapshot(testFilePath)         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ test/e2e/console-capture.ts                     │
│ validateSnapshot(testFilePath)                  │
│                                                 │
│ If GENERATE_WARNINGS_SNAPSHOT=true:             │
│   → saveCapturedToTemp()                        │
│   → Save to warnings-e2e-test-<name>.json       │
│                                                 │
│ If validation mode:                             │
│   → compareWithSnapshot()                       │
│   → If new warnings: throw error with message   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
          ┌───────┴────────┐
          │                │
          ▼                ▼
       Success           Fail
      (exit 0)     (exit 1 + message)
```

**Key Difference:** E2E validates per-test (Mocha), while unit/integration validates after all tests (Jest global teardown).

---

### Flow 2: Updating Snapshots (Generation Mode)

```
┌──────────────────────────────────────────────────────┐
│ Developer runs:                                      │
│ yarn test:warnings:update:unit <test-file>           │
└─────────────────┬────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│ package.json script triggers:                        │
│ development/generate-warnings-snapshot.ts            │
│                                                      │
│ Sets environment:                                    │
│   → GENERATE_WARNINGS_SNAPSHOT='true'                │
│   → WARNINGS_SNAPSHOT_TYPE='unit'                    │
│                                                      │
│ Runs tests:                                          │
│   → yarn test:unit <test-file>                       │
└─────────────────┬────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│ Tests execute (same as Flow 1, but...)               │
│                                                      │
│ console-capture.ts:                                  │
│   → Captures warnings/errors                         │
│   → Saves to temp files                              │
│                                                      │
│ global-teardown.ts:                                  │
│   → Skips validation (generation mode)               │
│   → Just logs "data saved to temp files"             │
└─────────────────┬────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│ If tests passed (exit code 0):                       │
│                                                      │
│ generate-warnings-snapshot.ts continues:             │
│   → aggregateAndSaveSnapshot(specificTestFile)       │
│   → Reads temp file(s)                               │
│   → Loads existing snapshot                          │
│   → Merges (additive): adds new, keeps existing      │
│   → Sorts alphabetically                             │
│   → Saves to test-warnings-snapshot-unit.json        │
│   → Deletes temp files                               │
│   → Success message with counts                      │
│                                                      │
│ If tests failed:                                     │
│   → Shows error and keeps temp files                 │
│   → User can re-run to continue accumulating         │
└──────────────────────────────────────────────────────┘

Result: Baseline snapshot updated, temp files cleaned
```

**Why Two-Phase Approach:**

1. **Phase 1 (Tests)** - Accumulate data without validation interference
2. **Phase 2 (Generate script)** - Only update snapshot if ALL tests passed

This ensures partial test runs don't corrupt the snapshot.

---

## Architecture Components

### Core Logic (1 file)

**`test/helpers/console-snapshot.ts`** - Shared normalization and comparison logic

Key functions:

- `normalizeMessage()` - CI-safe message normalization (paths, numbers, IDs → placeholders)
- `loadSnapshot()` / `saveSnapshot()` - Atomic file I/O with temp-file-rename pattern
- `saveTestSnapshot()` - Writes test-specific temp files
- `compareWithSnapshot()` - Detects new warnings/errors
- `formatComparisonResults()` - User-friendly error messages with exact commands
- `aggregateAndSaveSnapshot()` - Combines temp files, merges with baseline, saves

---

### Capture Implementation (3 files)

**`test/jest/console-capture.ts`** - Jest (unit + integration) console capture

- Overrides `console.warn` and `console.error` globally
- `beforeAll`: Deletes stale temp file for this test
- Intercepts calls, normalizes messages, stores in memory
- `afterAll`: Saves captured data to `warnings-{type}-test-{name}.json`
- Extracts test file path from Jest context or stack trace

**`test/e2e/console-capture.ts`** - E2E browser console capture

- Receives warnings/errors from Chrome DevTools Protocol (via driver)
- `captureWarning()` / `captureError()` - Normalize and store
- `validateSnapshot()` - Main entry point called by `withFixtures`
- Generation mode: saves temp file
- Validation mode: compares and throws if new warnings found

**`test/e2e/webdriver/driver.js`** - WebDriver console listener

- Listens to Chrome DevTools Protocol console events
- Tracks `driver.warnings` and `driver.errors` arrays
- `logBrowserError()` - Compresses long messages for CI logs (>500 chars → single line)
- Passes captured data to console-capture.ts

---

### Validation/Aggregation (3 files)

**`test/jest/global-teardown.ts`** - Unit test validation

- Runs once after ALL unit tests complete
- `aggregateTestSnapshots()` - Reads all `warnings-unit-test-*.json` files
- Generation mode: logs message, skips validation
- Validation mode: compares against `test-warnings-snapshot-unit.json`, throws if new issues

**`test/jest/integration-global-teardown.ts`** - Integration test validation

- Identical to unit teardown but uses `WARNINGS_SNAPSHOT_TYPE='integration'`
- Uses `test-warnings-snapshot-integration.json`

**`development/generate-warnings-snapshot.ts`** - Snapshot generation CLI

- Entry point for `yarn test:warnings:update:*` commands
- Sets `GENERATE_WARNINGS_SNAPSHOT=true` environment variable
- Runs tests: specific file or all tests (with smart retry logic for e2e)
- If tests pass: calls `aggregateAndSaveSnapshot()` to update baseline
- Cleans up temp files on success

---

### Integration Points (3 files)

**`test/jest/setup.ts`** - Unit test setup

```typescript
// Sets WARNINGS_SNAPSHOT_TYPE='unit'
setupConsoleCapture(); // Hooks console.warn/error
```

Automatically runs before all unit tests via `jest.config.js`.

**`test/integration/config/setupAfter.js`** - Integration test setup

```typescript
// Sets WARNINGS_SNAPSHOT_TYPE='integration'
setupConsoleCapture(); // Same console hooks as unit tests
```

Automatically runs before all integration tests via `jest.integration.config.js`.

**`test/e2e/helpers.js`** - E2E test fixtures

Modified `withFixtures()` function:

1. **Before test**: Deletes stale temp file for this specific test
2. **After test**: Captures `driver.warnings` and `driver.errors` from CDP
3. **Validation**: Calls `validateSnapshot(testFilePath)` from console-capture.ts

Unlike Jest tests, e2e validates per-test (no global teardown) because it uses Mocha.

---

### Configuration (3 files)

**`jest.config.js`** - Unit test config

```javascript
globalTeardown: '<rootDir>/test/jest/global-teardown.ts';
```

**`jest.integration.config.js`** - Integration test config

```javascript
globalTeardown: '<rootDir>/test/jest/integration-global-teardown.ts';
```

**`.gitignore`** - Excludes temp files

```
test/.warnings-snapshot-temp-*/
```

---

### Snapshot Data Files (3 files)

**`test/test-warnings-snapshot-unit.json`** - Unit baseline (343 issues)
**`test/test-warnings-snapshot-integration.json`** - Integration baseline (15 issues)
**`test/test-warnings-snapshot-e2e.json`** - E2E baseline (87 issues)

Structure:

```json
{
  "metadata": {
    "generatedAt": "2025-11-17T...",
    "description": "...",
    "note": "ADDITIVE - warnings added, never auto-removed"
  },
  "errors": ["Error 1", "Error 2", ...],
  "warnings": ["Warning 1", "Warning 2", ...]
}
```

---

## Key Technical Decisions

### 1. Why Additive Mode?

**Problem:** Tests are non-deterministic - warnings appear inconsistently due to timing, race conditions, parallel execution.

**Solution:** Accumulate ALL warnings over multiple runs, never auto-remove.

**Trade-off:** Requires manual cleanup when fixing code, but eliminates false positives from flaky tests.

### 2. Why Test-Specific Temp Files?

**Problem:** Worker-based files (`warnings-unit-worker-1.json`) couldn't map back to specific tests.

**Solution:** One temp file per test: `warnings-unit-test-background-api.json`

**Benefits:**

- Run single test to update only its warnings
- Clear error messages: `yarn test:warnings:update:unit app/scripts/foo.test.js`
- Cleanup prevents stale file pollution

### 3. Why Normalize Everything?

**Problem:** Snapshots created on macOS (`/Users/john/`) fail on CI Linux (`/home/runner/`).

**Solution:** Replace all environment-specific values:

- Paths: `/Users/...` → `<USER_PATH>`, `/home/...` → `<USER_PATH>`
- Numbers: `123`, `in 827ms` → `<NUMBER>`, `in <DURATION>ms`
- IDs: UUIDs, addresses, hashes, chain IDs, client IDs → placeholders
- Line numbers: `:140:19` → `:<LINE>:<COL>`

**Result:** Snapshots work identically on macOS, Linux, Windows, CI.

### 4. Why Global Teardown for Jest but Not E2E?

**Jest (Unit/Integration):**

- Tests run in parallel workers
- Can't validate mid-run (incomplete data)
- Global teardown ensures ALL tests finished before validating

**E2E (Mocha):**

- Tests run sequentially (one browser at a time)
- Can validate after each test completes
- No global teardown needed

### 5. Why Two Modes (Generation vs Validation)?

**Generation Mode:** `GENERATE_WARNINGS_SNAPSHOT=true`

- Captures warnings without failing tests
- Accumulates data in temp files
- Updates baseline after successful run
- Used by: `yarn test:warnings:update:*` commands

**Validation Mode:** (default)

- Compares captured warnings against baseline
- Fails tests if new warnings detected
- Used by: Normal test runs (`yarn test:unit`)

This separation prevents infinite loops where validation would fail generation attempts.

---

## File Reference

### Core System (5 files)

1. `test/helpers/console-snapshot.ts` - Normalization, comparison, aggregation (628 lines)
2. `development/generate-warnings-snapshot.ts` - CLI snapshot generator (526 lines)
3. `test/jest/console-capture.ts` - Jest console hooks (272 lines)
4. `test/e2e/console-capture.ts` - E2E browser capture (236 lines)
5. `test/e2e/webdriver/driver.js` - CDP listener + CI log compression (20 lines added)

### Teardown/Setup (4 files)

6. `test/jest/global-teardown.ts` - Unit validation (106 lines)
7. `test/jest/integration-global-teardown.ts` - Integration validation (113 lines)
8. `test/jest/setup.ts` - Unit console hooks setup (11 lines added)
9. `test/integration/config/setupAfter.js` - Integration console hooks setup (10 lines added)

### Integration (3 files)

10. `test/e2e/helpers.js` - withFixtures cleanup + validation (163 lines added)
11. `jest.config.js` - globalTeardown reference (1 line added)
12. `jest.integration.config.js` - globalTeardown reference (1 line added)

### Documentation (2 files)

13. `test/README-WARNINGS-SNAPSHOT.md` - User guide (166 lines)
14. `test/README-WARNINGS-SNAPSHOT-TEST.md` - Manual testing guide (270 lines)

### Data (3 files)

15. `test/test-warnings-snapshot-unit.json` - 343 baseline issues
16. `test/test-warnings-snapshot-integration.json` - 15 baseline issues
17. `test/test-warnings-snapshot-e2e.json` - 87 baseline issues

---

## Normalization Examples

The `normalizeMessage()` function ensures snapshots are deterministic:

```javascript
// Paths
"/Users/john/metamask-extension/ui/app.tsx:42:10"
→ "<USER_PATH>:<LINE>:<COL>"

// Numbers
"Migration 131.2: Invalid state", "took 827ms"
→ "Migration <NUMBER>.<NUMBER>: Invalid state", "took <DURATION>ms"

// IDs
"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
"8f3c2a5e-4b1d-4f2e-9a8c-7d6e5f4c3b2a"
"selectedNetworkClientId":"3f8a9c2b1d"
→ "<ADDRESS>", "<UUID>", "selectedNetworkClientId":"<CLIENT_ID>"

// Chain IDs
"bip122:000000000019d6689c085ae165831e93", "eip155:1", "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
→ "bip122:<CHAIN_ID>", "eip155:<CHAIN_ID>", "solana:<CHAIN_ID>"

// Repeated messages (collapsed)
"Translator - Unable to find value of key \"send\" for locale \"en\"
 Translator - Unable to find value of key \"receive\" for locale \"en\"
 Translator - Unable to find value of key \"swap\" for locale \"en\""
→ "Translator - Unable to find value of key \"<KEY>\" for locale \"<LOCALE>\" [repeated]"
```

This aggressive normalization is critical for CI stability.

---

## Temp File Lifecycle

### Test-Specific Temp Files

**Location:** `test/.warnings-snapshot-temp-{type}/`

**Naming:** `warnings-{type}-test-{sanitized-test-name}.json`

**Examples:**

- `warnings-unit-test-background-api.json` (from `app/scripts/controllers/permissions/background-api.test.js`)
- `warnings-integration-test-permit.json` (from `test/integration/confirmations/signatures/permit.test.tsx`)
- `warnings-e2e-test-unlock-wallet.json` (from `test/e2e/tests/account/unlock-wallet.spec.ts`)

### Lifecycle:

```
1. beforeAll/withFixtures START
   → Delete stale temp file (if exists)

2. Tests run
   → Console output captured in memory

3. afterAll/withFixtures END
   → Save captured data to temp file

4. Global teardown (Jest only)
   → Aggregate all temp files
   → Validate or generate

5. Cleanup
   → Temp files deleted after successful snapshot generation
   → Kept on failure for retry
```

---

## Error Message Format

When validation fails, developers see:

```
❌ New console warnings detected:
================================================================================

Please fix the code or add to test/test-warnings-snapshot-unit.json:

1. Copy-paste the following warning into "warnings" array in test/test-warnings-snapshot-unit.json:
   "Unexpected key \"DNS\" found in preloadedState..."

2. Copy-paste the following error into "errors" array in test/test-warnings-snapshot-unit.json:
   "Warning: An update to %s inside a test was not wrapped in act(...)..."

📝 Or run this command to update the snapshot automatically:
   yarn test:warnings:update:unit app/scripts/controllers/permissions/background-api.test.js

================================================================================
Error in global teardown: Error: New console warnings or errors detected
```

**Key Features:**

- Lists each new warning/error with copy-paste instructions
- Shows exact snapshot filename
- Provides ready-to-run update command with specific test file path
- Clear, actionable guidance
