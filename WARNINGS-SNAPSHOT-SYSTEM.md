# Warnings Snapshot System - Summary

## Overview

A comprehensive system to prevent new console warnings and errors from being introduced while allowing gradual cleanup of existing ones.

## Current Snapshot Status

| Snapshot        | Warnings | Errors | Size  | Status    |
| --------------- | -------- | ------ | ----- | --------- |
| **Unit**        | 26       | 34     | 14KB  | ✅ Stable |
| **Integration** | 4        | 3      | 2.1KB | ✅ Stable |
| **E2E**         | 6        | 0      | 7.5KB | ✅ Stable |

**Grand Total: 36 warnings + 37 errors = 73 issues to fix**

---

## Key Features

### 1. **Additive Mode**

- New warnings are **added** to snapshots
- Warnings are **never automatically removed**
- Solves non-deterministic test behavior
- Must manually edit snapshot to remove warnings after fixing

### 2. **Independent Snapshots**

- 3 separate snapshot files
- Running one doesn't affect others

### 3. **CI-Safe Path Normalization**

Ensures snapshots work across different machines and CI environments by normalizing all variable data:

**Path Normalization:**
- User home directories: `/Users/username/...` → `<USER_PATH>`
- CI home directories: `/home/runner/...` → `<USER_PATH>`
- Project root: `.../metamask-extension/` → `<PROJECT_ROOT>/`
- Node modules: `.../node_modules/...` → `<NODE_MODULE>`
- Absolute paths: `/path/to/file` → `<ABSOLUTE_PATH>/`

**Source Location Normalization:**
- Line and column numbers: `:140:19` → `:<LINE>:<COL>`

**Number Normalization:**
- All numbers: `123`, `456`, `789` → `<NUMBER>`
- Durations: `in 827ms` → `in <DURATION>ms`
- JSON values: `"value": 700` → `"value": <NUMBER>`
- Large numbers: `1762290003263` → `<NUMBER>`

**ID Normalization:**
- UUIDs: `550e8400-e29b-41d4-a716-446655440000` → `<UUID>`
- Addresses: `0x1234...` → `<ADDRESS>`
- Hashes: `abc123def456...` → `<HASH>`
- Timestamps: `2024-11-05T12:34:56.789Z` → `<TIMESTAMP>`

**Result:** Snapshots are portable, allowing to work on developer machines, CI servers, and any environment without modification

### 4. **Auto-Retry Workflow**

- Temp files preserved between runs
- Just re-run same command until all tests pass
- Progress tracking shows accumulated warnings

---

## Quick Commands

### Generate/Update Snapshots:

```bash
# No build needed:
yarn test:warnings:update:unit          # ~5 min
yarn test:warnings:update:integration   # ~30 sec

# Needs build:
yarn build:test  # ~5 min (once)
yarn test:warnings:update:e2e      # ~10-15 min
```

### Normal Test Runs (Automatic Validation):

```bash
yarn test:unit        # Fails if new warnings detected
yarn test:integration # Fails if new warnings detected
yarn test:e2e:chrome  # Fails if new warnings detected
```

---

## How Additive Mode Works

### Example:

```
Run 1: Finds warnings A, B, C     → Snapshot: [A, B, C]
Run 2: Finds warnings B, D        → Snapshot: [A, B, C, D]  (added D)
Run 3: Finds warnings A, E        → Snapshot: [A, B, C, D, E] (added E)
Run 4: Finds warnings B, D        → Snapshot: [A, B, C, D, E] (no change)
```

After several runs, you have the **complete set** of all possible warnings, including non-deterministic ones!

---

## Removing Warnings (After Fixing)

```bash
# 1. Fix the code
# 2. Verify the warning is gone
yarn test:unit path/to/test.test.ts  # Should pass

# 3. Manually edit snapshot
code test/test-warnings-snapshot-unit.json
# Delete the fixed warning

# 4. Verify full suite
yarn test:unit  # Should pass
```

---

## Why Snapshots are Independent

Each snapshot type uses:

- **Different environment variable:** `WARNINGS_SNAPSHOT_TYPE`
- **Different temp directory:** `.warnings-snapshot-temp-{type}`
- **Different snapshot file:** `test-warnings-snapshot-{type}.json`

Running one snapshot generation **never affects** other snapshots.

---

## Documentation

- **`test/QUICK-START-WARNINGS-SNAPSHOT.md`** - Quick start guide
- **`test/README-WARNINGS-SNAPSHOT.md`** - Complete documentation
- **`WARNINGS-SNAPSHOT-SYSTEM.md`** - This file

---

## Next Steps

### Start Fixing Warnings:

```bash
# See all warnings
cat test/test-warnings-snapshot-unit.json | jq '.warnings'

# Fix them one by one
# Then manually remove from snapshot after verification
```
