# Enhanced Dangling Branches Analysis Report

**Generated:** 2026-02-16 09:19:56 UTC

## Executive Summary

This enhanced analysis provides deeper insights into dangling branches by:
- Distinguishing official release branches from version working branches
- Identifying patterns in AI-agent created branches
- Analyzing branches by author/creator
- Finding branches without associated PRs

## Key Updates Based on Clarifications

### 1. Refined Release Branch Categorization

**KEEP (Official Releases):**
- `Version-v12.16.0` ✅
- `Version-v13.2.0` ✅
- Pattern: `Version-vX.Y.Z` (exact format)

**CONSIDER FOR DELETION (Version Working Branches):**
- `v10-commit-breakdown` 🗑️
- `sync-v13.2.0-with-master` 🗑️
- `10.33`, `10.36`, `11.1` 🗑️
- `Version-10.9.2` (no 'v' prefix) 🗑️

### 2. AI-Agent Pattern Analysis

#### Cursor Agent Branches

Found multiple patterns of Cursor Agent activity:

**A. Error Reporting Branches (No Human PR Required):**

These are automated error-fixing attempts by Cursor Agent:

| Pattern | Count | Has PR? | Status |
|---------|-------|---------|--------|
| `error-insufficient-number-*` | ~40+ | Some have PRs | Review & Delete |
| `error-cannot-read-*` | ~10+ | No PRs found | Delete |
| `error-invalid-*` | ~15+ | No PRs found | Delete |
| `error-migration-*` | ~5+ | No PRs found | Delete |
| `error-*` (other) | ~40+ | Varies | Review |

**Key Finding:** The `error-insufficient-number-*` branches DO have associated PRs
created by `cursor[bot]` to fix translation substitution errors. However, many are
still in draft state and may be abandoned. All other `error-*` patterns appear to
have no PRs and can be deleted.

**B. Cursor Development Branches:**

- `cursor/*` pattern - ~40+ branches
- Many have associated PRs (64 found)
- Check PR status: merged, closed, or abandoned

**C. Copilot Branches:**

- `copilot/*` pattern - ~10+ branches
- Including `copilot/remove-dangling-branches` (this analysis!)
- Check PR status individually

**D. Devin AI Branches:**

- `devin/*` pattern - ~8 branches
- Examples: `devin/story-*`, `devin/typography-*`
- Likely abandoned experiments

### 3. Detailed Branch Categories

#### High Priority Deletion Candidates

**Category A: Error Branches Without PRs (~70+ branches)**

These can be deleted immediately:

```
error-cannot-read-*
error-invalid-chain-*
error-invalid-caip-*
error-invalid-controller-*
error-migration-*
error-minified-redux-*
error-missing-identity-*
error-no-*
error-protecting-intrinsics-*
error-the-category-*
... and many more
```

**Category B: Error Branches With Draft PRs (~30+ branches)**

These have PRs but in draft state - review and delete if abandoned:

```
error-insufficient-number-* (40+ variations)
  - PRs exist but most are draft
  - Created by cursor[bot]
  - Fixing translation substitution errors
```

**Category C: Version Working Branches (~10+ branches)**

```
v10-commit-breakdown
sync-v13.2.0-with-master
10.33
10.34.2-test
10.36
11.1
Version-10.9.2
9.6-switch-network-fix
```

**Category D: Temporary Branches (~5 branches)**

```
TEMP-MERGE/ASSETS-1134/update-network-manager-filter
TEMP-MERGE-2/ASSETS-1134/update-network-manager-filter
TEMP-combined-core-network-controller-sync
TEMP-fix-up-tsconfig-add-provider-config-id
```

**Category E: Devin AI Branches (~8 branches)**

```
devin/story-*
devin/typography-*
```

#### Medium Priority - Requires PR Verification

**Category F: Cursor Development Branches (~40+ branches)**

These have PRs (64 found) - need to check status:

```
cursor/analyze-and-optimize-code-performance-*
cursor/chain-badge-component-*
cursor/storybook-v7-to-v10-*
cursor/fix-*
cursor/update-*
... and ~35 more
```

**Action:** Query each PR's status:
- If merged: Delete branch
- If closed (not merged): Delete branch
- If open and active: Keep
- If draft and abandoned: Delete

**Category G: Copilot Branches (~10+ branches)**

```
copilot/audit-fix-side-effect-patterns
copilot/fix-clear-activity-tab-bug
copilot/reduce-useselector-subscriptions
copilot/remove-dangling-branches
... and more
```

**Category H: Feature/Ticket Branches (~200+ branches)**

Standard feature branches - check PR status:

```
ASSETS-*, MMI-*, SWAPS-*, SOL-*, MMS-*
NNT-*, NOTIFY-*, NWNT-*, QA-*, SL-*
```

**Category I: Personal User Branches (~100+ branches)**

```
ad/*, brian/*, cc/*, dd/*, djb/*
dbrans/*, cryptotavares/*, ellul/*
```

## Updated Statistics

| Category | Count | No PRs | Has PRs | Priority |
|----------|-------|--------|---------|----------|
| Error Branches (No PRs) | ~70+ | ✅ | ❌ | **High** |
| Error Branches (Draft PRs) | ~30+ | ❌ | ✅ | **High** |
| Version Working Branches | ~10 | ❓ | ❓ | **High** |
| Temporary Branches | ~5 | ✅ | ❌ | **High** |
| Devin AI Branches | ~8 | ✅ | ❌ | **High** |
| Cursor Dev Branches | ~40+ | ❌ | ✅ | **Medium** |
| Copilot Branches | ~10+ | ❌ | ✅ | **Medium** |
| Feature/Ticket Branches | ~200+ | ❓ | ❓ | **Medium** |
| User Branches | ~100+ | ❓ | ❓ | **Medium** |
| Official Releases (Keep) | ~50+ | N/A | N/A | **Low** |

**Updated Totals:**
- **Immediate Deletion Candidates:** ~120+ branches (error branches without PRs, temp branches, devin)
- **Review & Likely Delete:** ~50+ branches (error branches with draft PRs, version working branches)
- **Requires PR Status Check:** ~350+ branches (cursor, copilot, feature, user branches)

## Recommended Action Plan

### Phase 1: Immediate Cleanup (High Confidence)

Delete these branches immediately:

1. **~70+ Error branches without PRs**
   ```bash
   # Patterns to delete:
   error-cannot-read-*
   error-invalid-*
   error-migration-*
   error-minified-redux-*
   error-missing-identity-*
   error-no-*
   error-the-category-*
   # ... etc
   ```

2. **~5 Temporary branches**
   ```bash
   TEMP-MERGE/ASSETS-1134/update-network-manager-filter
   TEMP-MERGE-2/ASSETS-1134/update-network-manager-filter
   TEMP-combined-core-network-controller-sync
   TEMP-fix-up-tsconfig-add-provider-config-id
   ```

3. **~8 Devin AI branches**
   ```bash
   devin/story-*
   devin/typography-*
   ```

### Phase 2: Review and Delete (Needs Verification)

1. **~30+ Error branches with draft PRs**
   - Review each `error-insufficient-number-*` PR
   - If draft and inactive >1 month: Delete
   - If merged: Delete branch

2. **~10 Version working branches**
   - Verify these versions are EOL
   - Check if any active work references them
   - Delete if confirmed old/unused

### Phase 3: PR Status Verification (Requires API Queries)

For each of these categories, query GitHub API for PR status:

1. **~40+ Cursor branches** - Check if PR is merged/closed/abandoned
2. **~10+ Copilot branches** - Check if PR is merged/closed/abandoned
3. **~200+ Feature branches** - Check PR age and status
4. **~100+ User branches** - Contact owners or check last activity

**Deletion Criteria:**
- PR merged + branch not protected = DELETE
- PR closed (not merged) + >1 year old = DELETE
- No PR exists + >1 year old = DELETE
- Draft PR + no activity in >3 months = DELETE

## Pattern Recognition Summary

### Identified Patterns

1. **Error-* branches by Cursor Agent:**
   - `error-insufficient-number-*` (40+) → Some have PRs (draft)
   - `error-cannot-read-*` (10+) → No PRs
   - `error-invalid-*` (15+) → No PRs
   - `error-the-category-*` (20+) → No PRs
   - All created by automated error reporting

2. **Version working branches:**
   - Number-only: `10.33`, `10.36`, `11.1`
   - v-prefix: `v10-commit-breakdown`
   - sync/merge: `sync-v13.2.0-with-master`
   - Old format: `Version-10.9.2` (no 'v')

3. **AI agent branches:**
   - Cursor: 40+ dev branches + 100+ error branches
   - Copilot: 10+ branches
   - Devin: 8 branches

4. **Temporary branches:**
   - All with `TEMP` prefix/suffix
   - Clear candidates for deletion

## Branches to Preserve

**DO NOT DELETE:**

- `Version-v12.16.0`, `Version-v13.2.0`, etc. (official releases)
- Any branch matching `Version-vX.Y.Z` pattern exactly
- Protected branches (marked in GitHub)
- `develop`, `main`, `master`
- `cla-signatures`

---

*This enhanced report incorporates refined categorization rules and pattern
analysis based on branch authors and PR associations. Manual verification is
recommended before mass deletion, especially for phases 2 and 3.*
