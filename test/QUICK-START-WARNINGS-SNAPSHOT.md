# Quick Start: Warnings Snapshot System

## What It Does

Prevents new console warnings/errors from being introduced in your tests using an **additive approach** - new warnings are added to snapshots but never automatically removed.

## Current Status

**3 snapshot files with captured warnings/errors:**

- Unit: 26 warnings, 34 errors
- Integration: 4 warnings, 3 errors
- E2E: 6 warnings, 0 errors

**Total to fix: 36 warnings + 37 errors = 73 issues**

---

## Simple Workflow

### For All Test Types: Just Keep Running Until It Works! 🔄

```bash
# Unit Tests (no build needed)
yarn test:warnings:update:unit
# If tests fail, fix them and re-run the SAME command
# Warnings accumulate until complete set is captured ✅

# Integration Tests (no build needed)
yarn test:warnings:update:integration
# If tests fail, fix them and re-run the SAME command
# Keep running until stable ✅

# E2E Tests (needs build first)
yarn build:test  # ~5-10 min (only once)
yarn test:warnings:update:e2e
# If tests fail, fix them and re-run the SAME command
# Temp files preserved, warnings accumulate ✅
```

**That's it!** No manual steps, no manual aggregation, no complicated commands.

## How It Works

### Automatic Temp File Management

1. **First Run:**
   - All tests run
   - Passing tests save their data to temp files
   - Script exits with error if any test fails
   - Temp files are **preserved**

2. **Second Run (after fixing):**
   - All tests run again
   - Tests overwrite their temp files with fresh data
   - If all pass → **snapshot auto-generated!** ✅
   - Temp files **auto-cleaned up** 🧹

3. **Keep Retrying:**
   - Just re-run the same command
   - Each run shows progress: `📊 Progress: 48 test(s) saved`
   - Eventually all tests pass → snapshot generated!

### What You'll See

**When Tests Fail:**

```
❌ Some tests failed. Snapshot cannot be generated yet.
   Exit code: 1

📊 Progress: 48 test(s) have saved their warnings/errors.

🔄 To retry:
   1. Fix the failing test(s)
   2. Run this command again:
      yarn test:warnings:update:e2e

   Temp files are preserved. When all tests pass,
   the snapshot will be auto-generated! 🎯
```

**When All Tests Pass:**

```
✅ All tests passed! Aggregating and saving snapshot...
   Cleaned up 50 temporary file(s) after successful snapshot generation.

✅ E2E tests snapshot generation complete!
   Check test/test-warnings-snapshot-e2e.json

🧹 All temporary files have been cleaned up.
```

## Behind the Scenes

### Temp Files (Automatic)

```
test/.warnings-snapshot-temp-unit/
test/.warnings-snapshot-temp-integration/
test/.warnings-snapshot-temp-e2e/
```

- Created automatically
- Preserved between runs
- Cleaned up on success
- Already in `.gitignore`

### For E2E Tests: Per-Test Files

Each e2e test gets its own temp file:

```
test/.warnings-snapshot-temp-e2e/
├── warnings-e2e-test-account-creation.json
├── warnings-e2e-test-send-transaction.json
├── warnings-e2e-test-swap-tokens.json
└── ... (one per test)
```

**Benefit:** Re-running the command overwrites ALL files, but each test is independent.

## Tips

### Check Progress

```bash
# See how many temp files exist
ls test/.warnings-snapshot-temp-e2e/ | wc -l

# View temp file contents
cat test/.warnings-snapshot-temp-e2e/warnings-e2e-test-*.json
```

### Start Fresh

```bash
# Clear temp files if you want to start over
rm -rf test/.warnings-snapshot-temp-*

# Then run generation again
yarn test:warnings:update:e2e
```

### View Generated Snapshot

```bash
# Check the snapshot file
cat test/test-warnings-snapshot-unit.json
cat test/test-warnings-snapshot-integration.json
cat test/test-warnings-snapshot-e2e.json
```

## Normal Test Runs (After Snapshot Created)

Once snapshots are generated, normal test runs automatically validate:

```bash
# These will now FAIL if new warnings/errors appear:
yarn test:unit
yarn test:integration
yarn test:e2e:chrome  # E2E tests
```

No extra flags needed - it just works! 🚀

## Removing Fixed Warnings

**Important:** Snapshots are ADDITIVE - to remove a warning:

1. Fix the code causing the warning
2. Verify: `yarn test:unit path/to/test.tsx` (should pass)
3. Manually edit the snapshot file and delete that warning
4. Verify: `yarn test:unit` (full suite should pass)

## Advanced: Manual Incremental Updates

For power users who want to save time on e2e tests, see:

- `test/E2E-INCREMENTAL-SNAPSHOT-WORKFLOW.md`

But for most cases, just use the simple "keep re-running" approach! 👍
