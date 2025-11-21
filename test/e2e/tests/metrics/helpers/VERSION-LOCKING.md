# Segment Schema Version Locking

## Overview

The event validator generator uses a lockfile (`.segment-schema.lock`) to pin the segment-schema repository to a specific commit. This ensures:

- ✅ Reproducible validator generation across team members
- ✅ Validators don't break when schema repo is updated
- ✅ Controlled schema updates (explicit opt-in)
- ✅ Clear schema version in generated files

## How It Works

### 1. Lockfile (`.segment-schema.lock`)

Stores the pinned schema version (user-agnostic):

```json
{
  "commit": "3af2b9e45a588aeec5c24d016c1625b4d043b78f",
  "branch": "main",
  "lastUpdated": "2025-11-21T18:23:14.465Z"
}
```

**Note**: Schema path is NOT stored in lockfile since it's user-specific. Each developer provides their own `--schema` path.

### 2. Generated Files Include Version

Every generated validator includes the schema version:

```typescript
/**
 * Auto-generated validator for "Transaction Finalized" event
 *
 * Schema version: 3af2b9e (main)
 * Generated at: 2025-11-21T18:23:14.460Z
 */
```

### 3. Automatic Checkout

The generator:
1. Reads the locked commit from `.segment-schema.lock`
2. Temporarily checks out that commit
3. Generates the validator
4. Restores the original commit

## Usage

### First Time Setup

Create the lockfile:

```bash
yarn tsx development/segment-event-parser.ts \
  --schema ~/path/to/segment-schema \
  --event "Transaction Finalized" \
  --destination ./test/e2e/tests/metrics/helpers
```

This creates `.segment-schema.lock` with current commit.

### Normal Usage (Uses Locked Version)

Always provide `--schema` path (each developer has their own path):

```bash
yarn tsx development/segment-event-parser.ts \
  --schema ~/path/to/segment-schema \
  --event "Transaction Finalized" \
  --destination ./test/e2e/tests/metrics/helpers
```

Uses the commit from `.segment-schema.lock` - **safe and reproducible** across all developers!

### Update Schema Version

When you want to update to latest schema:

```bash
yarn tsx development/segment-event-parser.ts \
  --schema ~/path/to/segment-schema \
  --event "Transaction Finalized" \
  --destination ./test/e2e/tests/metrics/helpers \
  --update-schema
```

This:
1. Gets current HEAD commit from schema repo
2. Generates validator using latest schema
3. Updates `.segment-schema.lock` with new commit
4. **Commit the updated lockfile to git!**

### Override for Testing

Test with a specific commit without updating lockfile:

```bash
yarn tsx development/segment-event-parser.ts \
  --schema ~/path/to/segment-schema \
  --event "Transaction Finalized" \
  --destination ./test/e2e/tests/metrics/helpers \
  --schema-commit a1b2c3d4
```

## Workflow Recommendations

### When Schema Updates

1. **Test locally first:**
```bash
# Try new schema with override
yarn tsx development/segment-event-parser.ts \
  --schema ~/path/to/segment-schema \
  --event "Your Event Name" \
  --destination ./test/e2e/tests/metrics/helpers \
  --schema-commit <new-commit>

# Run tests to verify nothing breaks
yarn test:e2e:single test/e2e/tests/metrics/your-test.spec.ts
```

2. **If tests pass, update lockfile:**
```bash
yarn tsx development/segment-event-parser.ts \
  --schema ~/path/to/segment-schema \
  --event "Your Event Name" \
  --destination ./test/e2e/tests/metrics/helpers \
  --update-schema

# Commit the lockfile change
git add .segment-schema.lock
git commit -m "Update segment-schema to <commit>"
```

3. **Regenerate all validators:**
```bash
# Regenerate all event validators with new schema
yarn tsx development/segment-event-parser.ts --schema ~/path/to/segment-schema --event "Transaction Submitted" --destination ./test/e2e/tests/metrics/helpers
yarn tsx development/segment-event-parser.ts --schema ~/path/to/segment-schema --event "Transaction Finalized" --destination ./test/e2e/tests/metrics/helpers
# ... etc for all events
```

## Best Practices

1. ✅ **Commit lockfile to git** - ensures team uses same version
2. ✅ **Update intentionally** - use `--update-schema` only when ready
3. ✅ **Test before updating** - use `--schema-commit` to test first
4. ✅ **Regenerate all validators** - when updating schema version
5. ✅ **Document schema changes** - in commit message when updating lockfile

