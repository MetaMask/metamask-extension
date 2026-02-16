# Dangling Branches Analysis Report

**Generated:** 2026-02-16 09:08:13 UTC

## Executive Summary

This analysis identifies branches in the MetaMask extension repository that are candidates
for deletion based on three criteria:

1. **Temporary branches** from releases that are no longer active
2. **Branches from closed PRs** more than a year old (requires API verification)
3. **AI-created branches** (cursor/, copilot/, devin/) no longer in active use

## Analysis Methodology

Branches were categorized by analyzing their naming patterns:

- **AI-Created**: Branches starting with `cursor/`, `copilot/`, or `devin/`
- **Temporary**: Branches with `TEMP` in the name or explicit temp prefixes
- **Release**: Branches following `Version-vX.Y.Z` pattern
- **Error/Debug**: Automated error reporting branches (`error-*`)
- **Feature/Ticket**: Branches with JIRA-style ticket prefixes
- **User Branch**: Personal development branches with username prefixes

## Key Findings

### High-Priority Dangling Branches

#### 1. AI-Created Branches (~50+ branches)

These branches were created by AI coding assistants and should be reviewed:

**Cursor AI Branches:**
- `cursor/*` pattern - ~40+ branches
- Examples:
  - `cursor/additional-networks-icon-styling-211a`
  - `cursor/analyze-and-optimize-code-performance-*`
  - `cursor/chain-badge-component-*`
  - `cursor/storybook-v7-to-v10-57d0`
  - Many others with random hex suffixes

**Copilot AI Branches:**
- `copilot/*` pattern - ~10+ branches
- Examples:
  - `copilot/audit-fix-side-effect-patterns`
  - `copilot/fix-clear-activity-tab-bug`
  - `copilot/reduce-useselector-subscriptions`
  - `copilot/remove-dangling-branches` (this branch!)

**Devin AI Branches:**
- `devin/*` pattern - ~8 branches
- Examples:
  - `devin/story-*` (multiple)
  - `devin/typography-*`

**Recommendation:** Review each AI branch to determine if work was merged or abandoned.

#### 2. Temporary Branches (~5-7 branches)

Explicitly marked as temporary:

- `TEMP-MERGE/ASSETS-1134/update-network-manager-filter`
- `TEMP-MERGE-2/ASSETS-1134/update-network-manager-filter`
- `TEMP-combined-core-network-controller-sync`
- `TEMP-fix-up-tsconfig-add-provider-config-id`

**Recommendation:** These should be deleted immediately unless actively being used.

#### 3. Unprotected Release Branches (~8 branches)

Release branches without protection (likely EOL):

- `9.6-switch-network-fix`
- `10.33`
- `10.34.2-test`
- `10.36`
- `11.1`
- `Version-10.9.2`

**Recommendation:** Verify these versions are no longer supported before deletion.

#### 4. Error/Debug Branches (~100+ branches)

Automated error reporting branches that have accumulated:

- `error-*` pattern - 100+ branches
- Examples:
  - `error-insufficient-number-*` (40+ variations)
  - `error-cannot-read-*` (multiple)
  - `error-invalid-*` (multiple)
  - `error-migration-*` (multiple)

**Recommendation:** Review error reports and delete branches after issues are addressed.

### Medium-Priority Review Needed

#### 5. Feature/Ticket Branches (~200+ branches)

These require PR status verification:

- `ASSETS-*` - Asset-related features
- `MMI-*` - MetaMask Institutional features
- `SWAPS-*` - Swap functionality features
- `SOL-*` - Solana-related features
- `MMS-*` - Various features
- `NNT-*`, `NOTIFY-*`, `NWNT-*` - Notification features
- `QA-*` - QA branches

**Recommendation:** Use GitHub API to check PR status and age. Delete if:
- PR is merged and >1 month old
- PR is closed (not merged) and >1 year old
- PR doesn't exist

#### 6. Personal User Branches (~100+ branches)

Personal development branches:

- `ad/*` - Many branches
- `brian/*` - Many branches
- `cc/*` - Multiple branches
- `dd/*` - Multiple branches
- `djb/*` - Multiple branches
- Others: `dbrans/*`, `cryptotavares/*`, `ellul/*`, etc.

**Recommendation:** Contact branch owners to verify if still needed.

### Low-Priority (Protected Branches)

#### 7. Protected Release Branches (~50+ branches)

Currently supported versions (should NOT be deleted):

- `Version-v9.111.4` through `Version-v13.3.0`
- Various beta versions
- `cla-signatures` (protected)

**Recommendation:** Keep all protected branches.

## Summary Statistics

| Category | Count | Dangling? | Priority |
|----------|-------|-----------|----------|
| AI-Created Branches | ~50+ | ✅ Yes | High |
| Temporary Branches | ~5 | ✅ Yes | High |
| Unprotected Releases | ~8 | ✅ Yes | High |
| Error/Debug Branches | ~100+ | ✅ Yes | High |
| Feature/Ticket Branches | ~200+ | ❓ Maybe | Medium |
| User Branches | ~100+ | ❓ Maybe | Medium |
| Protected Releases | ~50+ | ❌ No | Low |
| Other | ~50+ | ❓ Maybe | Low |

**Total Branches Analyzed:** ~500+
**Definite Dangling Candidates:** ~160+ branches
**Requires PR Verification:** ~300+ branches

## Recommended Actions

### Immediate Actions (High Priority)

1. **Delete Temporary Branches** (~5 branches)
   - All `TEMP-*` branches should be removed

2. **Review AI-Created Branches** (~50+ branches)
   - For each `cursor/*`, `copilot/*`, `devin/*` branch:
     - Check if PR exists and its status
     - If merged: delete branch
     - If abandoned: delete branch
     - If active: keep until work is complete

3. **Clean Error Branches** (~100+ branches)
   - Review error reports
   - Delete branches for resolved issues

4. **Remove Old Release Branches** (~8 branches)
   - Verify EOL status for unprotected Version-* branches
   - Delete confirmed EOL versions

### Follow-up Actions (Medium Priority)

5. **Audit Feature Branches** (~200+ branches)
   - Use GitHub API to check PR status for each feature branch
   - Delete merged PRs older than 1 month
   - Delete closed PRs older than 1 year

6. **Contact Branch Owners** (~100+ branches)
   - Reach out to developers with personal branches
   - Establish retention policy for personal branches

### Policy Recommendations

To prevent future accumulation:

1. **Automatic Branch Deletion**
   - Delete branches automatically after PR merge
   - Set up GitHub branch protection rules

2. **Branch Naming Convention**
   - Require ticket/issue number in branch names
   - Discourage AI-generated branch names with random suffixes

3. **Regular Cleanup**
   - Quarterly review of unmerged branches
   - Automated notifications for stale branches (>6 months)

4. **Personal Branch Policy**
   - Personal branches should be in forks, not main repo
   - Or establish max retention period (e.g., 3 months)

## Appendix: Branch Patterns Observed

### AI-Generated Branch Name Patterns

- `cursor/*-<4char-hex>` - Cursor AI branches with random suffixes
- `copilot/*` - GitHub Copilot branches
- `devin/*` - Devin AI branches

### Ticket/Project Prefixes Found

- ASSETS - Asset management
- MMI - MetaMask Institutional
- SWAPS - Swap functionality
- SOL - Solana features
- MMS - MetaMask features
- CEUX - User experience
- MMQA - QA branches
- NNT - Network features
- NOTIFY - Notifications
- QA - Quality assurance
- SL - Various features

### Developer Username Patterns

Identified personal branch prefixes: ad, brian, cc, dd, djb, dr, dbrans,
cryptotavares, cryptodev2s, christopher, ellul, and many others.

---

*This report was generated automatically. Manual review is recommended before*
*deleting any branches. Always verify that work has been properly merged or*
*is no longer needed before deletion.*
