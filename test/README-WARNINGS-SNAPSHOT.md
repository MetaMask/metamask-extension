# Console Warnings/Errors Snapshot System

Prevents new console warnings/errors from being introduced in tests while allowing gradual cleanup of existing ones.

## Current Status

- Unit: 26 warnings, 34 errors
- Integration: 4 warnings, 3 errors
- E2E: 6 warnings, 0 errors
- **Total: 73 issues to fix**

---

## Quick Start

### Update Snapshots

```bash
# Unit tests (no build needed)
yarn test:warnings:update:unit

# Integration tests (no build needed)
yarn test:warnings:update:integration

# E2E tests (requires build)
yarn build:test
yarn test:warnings:update:e2e
```

If tests fail, just **re-run the same command**. Temp files are preserved, warnings accumulate.

### Normal Test Runs (Automatic Validation)

```bash
yarn test:unit        # Fails if new warnings detected
yarn test:integration
yarn test:e2e:chrome
```

---

## How It Works

### Additive Mode ⚠️

**Snapshots accumulate warnings but NEVER automatically remove them.**

**Why?** Tests have non-deterministic behavior - warnings appear inconsistently due to parallel execution and timing. Additive mode accumulates all possible warnings over multiple runs until the complete set is captured.

**Example:**

```
Run 1: Finds warnings [A, B, C]    → Snapshot: [A, B, C]
Run 2: Finds warnings [B, D]       → Snapshot: [A, B, C, D]  (added D)
Run 3: Finds warnings [A, E]       → Snapshot: [A, B, C, D, E] (added E)
Run 4: No new warnings             → Snapshot: [A, B, C, D, E] (stable)
```

### Key Concepts

**Console Errors ≠ Test Failures**

```javascript
test('example', () => {
  console.error('Memory leak!'); // ← Captured, but test continues
  console.warn('Deprecated API'); // ← Captured, but test continues
  expect(2 + 2).toBe(4); // ✅ Test passes!
});
```

We capture React warnings, migration issues, validation warnings, etc. that don't fail tests but indicate real problems.

**Normalization**

All messages are normalized for CI compatibility:

- Paths: `/Users/john/...` → `<USER_PATH>`
- Numbers: `123`, `in 827ms` → `<NUMBER>`, `in <DURATION>ms`
- Line numbers: `:140:19` → `:<LINE>:<COL>`
- IDs: UUIDs, addresses, hashes → placeholders

**Result:** Snapshots work on any machine/CI.

---

## Removing Fixed Warnings

Snapshots are additive - to remove a warning after fixing:

```bash
# 1. Fix the code
# 2. Verify the warning is gone
yarn test:unit path/to/test.test.tsx

# 3. Manually edit snapshot file
code test/test-warnings-snapshot-unit.json
# Delete the fixed warning line

# 4. Verify full suite passes
yarn test:unit
```

---

## Commands

```bash
yarn test:warnings:update:unit         # Update unit snapshot
yarn test:warnings:update:integration  # Update integration snapshot
yarn test:warnings:update:e2e          # Update e2e snapshot (requires: yarn build:test)
```

**That's it!** These commands handle everything automatically.

---

## Snapshot Files

Three independent snapshot files:

- `test/test-warnings-snapshot-unit.json` - Unit tests (14KB)
- `test/test-warnings-snapshot-integration.json` - Integration tests (2.1KB)
- `test/test-warnings-snapshot-e2e.json` - E2E tests (7.5KB)

Each contains:

```json
{
  "warnings": ["Warning message 1", "Warning message 2"],
  "errors": ["Error message 1"],
  "_metadata": { ... }
}
```

---

## Troubleshooting

### "New console warnings detected" Error

Your code introduced new warnings.

**Fix:** Either fix the code OR run `yarn test:warnings:update:*` to add them to the snapshot.

### Tests Keep Failing (Flaky E2E)

**Solution:** Keep running `yarn test:warnings:update:e2e`

- Shows progress: "Found 35, expecting 266, 231 still needed"
- Temp files preserved between runs
- Eventually all tests pass

### Reset Snapshot

```bash
rm test/test-warnings-snapshot-unit.json
yarn test:warnings:update:unit  # Run 5-10 times to capture all non-deterministic warnings
```

---

## Technical Details

### Architecture

- `test/jest/console-capture.ts` - Jest hooks
- `test/e2e/console-capture.ts` - E2E capture
- `test/helpers/console-snapshot.ts` - Normalization & comparison logic
- `development/generate-warnings-snapshot.ts` - Unified generation script
- `development/aggregate-warnings-snapshot.ts` - Manual aggregation utility

### Integration

Automatically integrated via:

- `test/jest/setup.js` - Unit tests
- `test/integration/config/setupAfter.js` - Integration tests
- `test/e2e/helpers.js` - E2E tests

### Temp Files

Stored in (gitignored):

- `test/.warnings-snapshot-temp-unit/`
- `test/.warnings-snapshot-temp-integration/`
- `test/.warnings-snapshot-temp-e2e/`

Auto-cleaned after successful snapshot generation.

---

## Key Features

1. **Additive Mode** - Warnings accumulate, never auto-removed
2. **Independent Snapshots** - 3 separate files, don't affect each other
3. **CI-Safe** - All paths/numbers/IDs normalized
4. **Retry-compatible** - Temp files preserved between runs
5. **Progress Tracking** - E2E shows found/expected/missing counts
6. **Message Truncation** - 2KB max per message prevents bloat

---

## Summary

**73 issues captured** (36 warnings + 37 errors)

**Commands:**

```bash
# Update snapshots when needed:
yarn test:warnings:update:unit
yarn test:warnings:update:integration
yarn test:warnings:update:e2e

# Normal test runs automatically validate:
yarn test:unit
yarn test:integration
yarn test:e2e:chrome
```

**Ready to prevent new warnings while fixing existing issues!** 🚀
