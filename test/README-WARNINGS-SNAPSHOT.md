# Console Warnings/Errors Snapshot System

Prevents introduction of new console warnings/errors in unit, integration and e2e tests.

## Initial Status (November 2025)

- Unit: 81 warnings, 262 errors (343 total)
- Integration: 6 warnings, 9 errors (15 total)
- E2E: 87 warnings, 0 errors (87 total)
- **Total: 445 warnings/errors captured in baseline**

All these warnings/errors are stored in 3 independent snapshot files:

- `test/test-warnings-snapshot-unit.json` - Unit tests
- `test/test-warnings-snapshot-integration.json` - Integration tests
- `test/test-warnings-snapshot-e2e.json` - E2E tests

Each contains:

```json
{
  "metadata": { ... },
  "errors": ["Error message 1"],
  "warnings": ["Warning message 1", "Warning message 2"]
}
```

Initial snapshots have been generated with these commands:

```bash
# Unit tests (no build needed)
yarn test:warnings:update:unit

# Integration tests (no build needed)
yarn test:warnings:update:integration

# E2E tests (requires build)
yarn build:test
yarn test:warnings:update:e2e
```

How these commands work:

- Each test creates a temp file storing its warnings/errors
- After all tests complete, temp files are aggregated into the snapshot
- Temp files are deleted after successful aggregation
- This is especially useful for e2e tests (which take 5-6 hours) since failed tests don't require re-running everything

---

## Quick Start

It's unlikely you'll have to regenerate the entire snapshot, this was only needed initially.

Instead, you can specify the name of the test you want to capture warnings/errors from.

### Run tests

```bash
# Unit tests (no build needed)
yarn test:unit path/to/test/file

# Integration tests (no build needed)
yarn test:integration path/to/test/file

# E2E tests (requires build)
yarn build:test
SELENIUM_BROWSER=chrome yarn test:e2e:single path/to/test/file
```

If tests include new warnings/errors, they'll fail until you:

- Either fix the new warnings/errors [recommended]
- Or add the new warnings/errors to the snapshots

### Update Snapshots (not recommended)

```bash
# Unit tests (no build needed)
yarn test:warnings:update:unit path/to/test/file

# Integration tests (no build needed)
yarn test:warnings:update:integration path/to/test/file

# E2E tests (requires build)
yarn build:test
yarn test:warnings:update:e2e path/to/test/file
```

More concrete examples can be found in [README-WARNINGS-SNAPSHOT-TEST.md](./README-WARNINGS-SNAPSHOT-TEST.md)

---

## How it works

1. **Additive Mode** - Warnings accumulate, never auto-removed
2. **Independent Snapshots** - 3 separate files, don't affect each other
3. **CI-Safe** - All paths/numbers/IDs normalized
4. **Retry-compatible** - Temp files preserved between runs
5. **Progress Tracking** - E2E shows found/expected/missing counts
6. **Message Truncation** - 2KB max per message prevents bloat

See [README-WARNINGS-SNAPSHOT-ARCHITECTURE.md](./README-WARNINGS-SNAPSHOT-ARCHITECTURE.md) for more detail

---

## Appendix

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
yarn test:unit path/to/test/file

# 3. Manually edit snapshot file
code test/test-warnings-snapshot-unit.json
# Delete the fixed warning line

# 4. Verify full suite passes
yarn test:unit
```

---
