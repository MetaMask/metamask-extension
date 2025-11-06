# Console Warnings/Errors Snapshot System

This system captures console warnings and errors during test execution and compares them against snapshots to prevent new warnings/errors from being introduced.

**Current Snapshot Status:**

- Unit: 26 warnings, 34 errors
- Integration: 4 warnings, 3 errors
- E2E: 6 warnings, 0 errors
- **Total: 36 warnings, 37 errors (73 issues to fix)**

## Quick Start

**⚠️ IMPORTANT: Snapshots are ADDITIVE**

Running `yarn test:warnings:update:*` **adds** new warnings to the snapshot but **never removes** them automatically.

**Why?** Tests have non-deterministic behavior - warnings appear inconsistently due to parallel execution, race conditions, and timing issues. Additive mode solves this by accumulating all possible warnings over multiple runs.

**To remove a warning:**

1. Fix the code causing the warning
2. Verify it's gone: `yarn test:unit path/to/test.tsx`
3. Manually edit the snapshot file to remove that entry
4. Verify full suite: `yarn test:unit`

---

The snapshot system uses 3 independent snapshot files for different test types:

### Unit Tests

To update the unit tests snapshot:

```bash
yarn test:warnings:update:unit
```

This saves warnings/errors to `test/test-warnings-snapshot-unit.json`.

### Integration Tests

To update the integration tests snapshot:

```bash
yarn test:warnings:update:integration
```

This saves warnings/errors to `test/test-warnings-snapshot-integration.json`.

### E2E Tests

```bash
# First, ensure you have a test build ready
yarn build:test

# Then update the e2e snapshot
yarn test:warnings:update:e2e
```

This saves warnings/errors to `test/test-warnings-snapshot-e2e.json`.

**If Tests Fail:**

E2E tests can be flaky or slow. If some tests fail, just **re-run the same command**:

```bash
# E2E
yarn test:warnings:update:e2e
# If fails, fix and re-run same command

```

**How It Works:**

- Each test saves to a **unique temp file** (based on test name)
- Temp files are **preserved** across runs
- Re-running a test **overwrites** only that test's temp file
- Once **all tests pass**, snapshot is **automatically generated** and temp files are cleaned up

**Progress Tracking:**

The script shows how many tests have saved data:

```
📊 Progress: 48 test(s) have saved their warnings/errors.
```

## How It Works

1. **Capture Phase**: During test execution, all `console.warn()` and `console.error()` calls are intercepted and captured.

2. **Normalization**: Messages are normalized to remove timestamps, random IDs, file paths, and other variable data to avoid false positives.

3. **Comparison**: After all tests complete, captured messages are compared against the appropriate snapshot file:
   - Unit tests: `test/test-warnings-snapshot-unit.json`
   - Integration tests: `test/test-warnings-snapshot-integration.json`
   - E2E tests: `test/test-warnings-snapshot-e2e.json`

4. **Validation**: If new warnings or errors are detected that aren't in the snapshot, the test suite fails with a detailed error message.

## Usage

### Generate Initial Snapshot

To create the initial snapshot of existing warnings/errors for each test type:

```bash
# Unit tests
yarn test:warnings:update:unit

# Integration tests
yarn test:warnings:update:integration

# E2E tests (requires test build)
yarn build:test && yarn test:warnings:update:e2e
```

### Running Tests (Normal Mode)

When running tests normally:

```bash
yarn test:unit
# or
yarn test:integration
# or
yarn test:e2e:chrome
```

The system will:

- Automatically capture console warnings/errors
- Compare against the appropriate snapshot
- Fail if new warnings/errors are detected

### Updating the Snapshot

When you intentionally introduce new warnings/errors (e.g., fixing tests that previously suppressed them), update the appropriate snapshot:

```bash
# For unit tests
yarn test:warnings:update:unit

# For integration tests
yarn test:warnings:update:integration

# For e2e tests
yarn test:warnings:update:e2e
```

## Snapshot File Format

Each snapshot file contains:

```json
{
  "_metadata": {
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "description": "Snapshot of console warnings and errors captured during test execution"
  },
  "errors": ["Normalized error message 1"],
  "warnings": ["Normalized warning message 1", "Normalized warning message 2"]
}
```

Messages are normalized to:

- Replace timestamps with `<TIMESTAMP>`
- Replace UUIDs with `<UUID>`
- Replace addresses with `<ADDRESS>`
- Replace file paths with placeholders
- Normalize whitespace

## Snapshot Files

Three separate snapshot files are maintained:

- `test/test-warnings-snapshot-unit.json` - Unit tests warnings/errors
- `test/test-warnings-snapshot-integration.json` - Integration tests warnings/errors
- `test/test-warnings-snapshot-e2e.json` - E2E tests warnings/errors

Each snapshot file is managed independently, allowing teams to update them separately based on their test type.

## Integration Points

The system is automatically integrated into:

- **Unit tests**: `test/jest/setup.js` - Uses `test-warnings-snapshot-unit.json`
- **Integration tests**: `test/integration/config/setupAfter.js` - Uses `test-warnings-snapshot-integration.json`
- **E2E tests**: `test/e2e/helpers.js` - Uses `test-warnings-snapshot-e2e.json`

## Removing Warnings from Snapshots

### To Remove a Single Warning:

1. **Fix the code** that causes the warning
2. **Run the test** to verify the warning is gone: `yarn test:unit path/to/test.test.ts`
3. **Manually edit** the snapshot file and delete the warning entry
4. **Verify** the full suite passes: `yarn test:unit`

Example:

```bash
# 1. Fix code causing "Invalid length provided: invalid"
# 2. Verify it's gone
yarn test:unit ui/components/wherever/test.tsx  # ✅ Pass

# 3. Edit snapshot
code test/test-warnings-snapshot-unit.json
# Delete the line: "Invalid length provided: invalid..."

# 4. Verify full suite
yarn test:unit  # ✅ All pass
```

### To Remove All Warnings (Fresh Start):

```bash
# Delete snapshot and regenerate from scratch
rm test/test-warnings-snapshot-unit.json

# Run multiple times to capture all non-deterministic warnings
yarn test:warnings:update:unit
yarn test:warnings:update:unit
yarn test:warnings:update:unit

# Keep running until: "✅ No new warnings or errors found"
# Then you have a complete baseline
```

**Tip:** It typically takes 5-10 runs to capture all non-deterministic warnings in unit tests.

---

## Troubleshooting

### Non-Deterministic Warnings

Some warnings appear inconsistently due to:

- Parallel test execution timing
- Race conditions in tests
- Async timing issues

**Solution:** The additive mode handles this! Warnings accumulate over time until you have the complete set.

### Missing Warnings

If warnings/errors aren't being captured:

- Ensure the setup files are loading correctly
- Check that `console.warn` and `console.error` aren't being mocked before our capture hooks run
- Verify the snapshot file exists and is valid JSON

## Implementation Details

- **Capture**: `test/jest/console-capture.ts` - Hooks into Jest lifecycle
- **Snapshot Logic**: `test/helpers/console-snapshot.ts` - Normalization and comparison
- **E2E Capture**: `test/e2e/console-capture.ts` - E2E-specific capture system
- **Generation Scripts**:
  - `development/generate-warnings-snapshot.ts` - Unified snapshot generation for all test types

## Parallel Execution & Incremental Updates

### Jest Tests (Unit & Integration)

The system handles Jest's parallel test execution by:

1. Each worker saves its captured warnings to a worker-specific temp file (e.g., `warnings-unit-worker-1.json`)
2. Each worker **overwrites** its own file after each test file (accumulating data)
3. Global teardown aggregates all worker temp files
4. Final snapshot is saved once after all workers complete
5. This prevents race conditions when multiple workers write simultaneously

### E2E Tests

The system uses **per-test temp files** for incremental snapshot generation:

1. Each test saves its warnings/errors to a **unique temp file** based on test name
2. Files are named like: `warnings-e2e-test-sending-eth-to-recipient.json`
3. Re-running a test **overwrites only that test's file**
4. Other tests' data remains preserved
5. **Benefit:** You can re-run only failed tests without losing data from passing tests

**Example Incremental Workflow:**

```bash
# Initial run - 48 tests pass, 2 fail
yarn test:warnings:update:e2e
# Creates 48 temp files for passing tests
# Script exits with error

# Fix the 2 failing tests, then re-run ONLY those tests
GENERATE_WARNINGS_SNAPSHOT=true WARNINGS_SNAPSHOT_TYPE=e2e yarn test:e2e:single test/e2e/tests/test-1.spec.js
GENERATE_WARNINGS_SNAPSHOT=true WARNINGS_SNAPSHOT_TYPE=e2e yarn test:e2e:single test/e2e/tests/test-2.spec.js
# Updates only those 2 test files

# Aggregate all 50 temp files into final snapshot
yarn test:warnings:aggregate:e2e
# Success! No need to re-run all 50 tests
```
