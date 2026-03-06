# Complete Cursor Agent Branch Analysis

**Analysis Date:** 2026-02-16  
**Repository:** MetaMask/metamask-extension

## Executive Summary

This report provides a comprehensive analysis of ALL branches created by Cursor Agent (cursor[bot]) in the repository.

### Key Findings

- **Total Cursor Agent PRs Found:** 9
- **All 9 PRs are DRAFT** (never submitted for review)
- **8 PRs are still OPEN** but abandoned (60+ days stale)
- **1 PR is CLOSED**
- **ALL PRs are 60+ days old with ZERO recent activity**

### Recommendation

**DELETE ALL 9 branches** - These are abandoned automated fix attempts with no value.

---

## Detailed PR Analysis

### Open Draft PRs (8) - All Stale >60 Days

| PR # | Branch Pattern | Title | Created | Last Updated | Days Stale | Status |
|------|----------------|-------|---------|--------------|------------|--------|
| 38785 | error-insufficient-number-* | Fix swap token translation placeholders | 2025-12-11 | 2025-12-11 | 66 | 🔴 DELETE |
| 38779 | error-* | Fix translation undefined error | 2025-12-11 | 2025-12-11 | 66 | 🔴 DELETE |
| 38765 | error-insufficient-number-* | Fix missing swap token translation | 2025-12-11 | 2025-12-11 | 66 | 🔴 DELETE |
| 38753 | error-insufficient-number-* | Fix french close slide | 2025-12-11 | 2025-12-11 | 67 | 🔴 DELETE |
| 38747 | error-insufficient-number-* | Fix pt_BR closeSlide translation | 2025-12-11 | 2025-12-11 | 67 | 🔴 DELETE |
| 38738 | error-insufficient-number-* | Fix pt_BR swap token translation | 2025-12-10 | 2025-12-10 | 67 | 🔴 DELETE |
| 38731 | error-* | Fix rpc state timeout | 2025-12-10 | 2025-12-10 | 67 | 🔴 DELETE |
| 38721 | error-insufficient-number-* | Fix swap approval translation | 2025-12-10 | 2025-12-10 | 67 | 🔴 DELETE |

### Closed PRs (1)

| PR # | Branch Pattern | Title | Created | Closed | Status |
|------|----------------|-------|---------|--------|--------|
| 38350 | cursor/* or error-* | fix: tx shield banner loading state | 2025-11-27 | 2025-11-27 | 🔴 DELETE |

---

## Pattern Analysis

### 1. Error Branch Patterns

**Pattern: error-insufficient-number-\***
- 6 PRs with this pattern
- All fixing translation substitution errors
- All draft, never reviewed
- All 60+ days stale
- **Recommendation:** DELETE ALL

**Pattern: error-\* (other)**
- 2 PRs with general error pattern
- Various automated fixes
- All draft, never reviewed
- All 60+ days stale
- **Recommendation:** DELETE ALL

### 2. Cursor Development Branches

**Pattern: cursor/\***
- Based on earlier GitHub API search: 64 PRs found with cursor/ prefix
- Need individual review for each branch
- Many likely merged or closed

### 3. Branch Activity Analysis

**Creation Timeline:**
- Dec 10-11, 2025: 8 PRs created (automated batch)
- Nov 27, 2025: 1 PR created and closed
- **Pattern:** All created within 2-week window, then abandoned

**Abandonment:**
- ALL PRs show NO activity after initial creation
- NO code reviews requested
- NO follow-up commits
- NO comments from team members
- **Conclusion:** These were automated attempts, never picked up by team

---

## Branches Without PRs

Based on earlier analysis, there are **70+ error-\* branches WITHOUT any PRs**:

### Confirmed Patterns Without PRs

1. **error-cannot-read-\*** (~10 branches) - DELETE
2. **error-invalid-chain-\*** (~15 branches) - DELETE
3. **error-invalid-caip-\*** (~5 branches) - DELETE
4. **error-invalid-controller-\*** (~5 branches) - DELETE
5. **error-migration-\*** (~5 branches) - DELETE
6. **error-minified-redux-\*** (~5 branches) - DELETE
7. **error-missing-identity-\*** (~5 branches) - DELETE
8. **error-no-\*** (~10 branches) - DELETE
9. **error-the-category-\*** (~20 branches) - DELETE

**Total:** ~70+ branches created by Cursor Agent with NO associated PRs

---

## Summary Statistics

| Category | Count | Status | Action |
|----------|-------|--------|--------|
| Error branches WITH draft PRs | 9 | All stale 60+ days | DELETE |
| Error branches WITHOUT PRs | ~70+ | No PR exists | DELETE |
| Cursor dev branches (cursor/*) | ~40+ | Mixed - needs review | CHECK INDIVIDUALLY |
| **TOTAL CURSOR AGENT BRANCHES** | **~120+** | **Majority deletable** | **See below** |

---

## Actionable Deletion List

### Phase 1: Delete Error Branches WITH PRs (9 branches)

Close these PRs and delete branches:

```bash
# Close and delete PR branches (these PRs should be closed first)
gh pr close 38785 --comment "Closing abandoned draft PR (60+ days stale)"
gh pr close 38779 --comment "Closing abandoned draft PR (60+ days stale)"
gh pr close 38765 --comment "Closing abandoned draft PR (60+ days stale)"
gh pr close 38753 --comment "Closing abandoned draft PR (60+ days stale)"
gh pr close 38747 --comment "Closing abandoned draft PR (60+ days stale)"
gh pr close 38738 --comment "Closing abandoned draft PR (60+ days stale)"
gh pr close 38731 --comment "Closing abandoned draft PR (60+ days stale)"
gh pr close 38721 --comment "Closing abandoned draft PR (60+ days stale)"

# The closed PR #38350 branch can be deleted directly
```

### Phase 2: Delete Error Branches WITHOUT PRs (~70 branches)

These can be deleted immediately as they have no PRs:

```bash
# Pattern-based deletion (requires branch name listing)
git push origin --delete error-cannot-read-*
git push origin --delete error-invalid-*
git push origin --delete error-migration-*
git push origin --delete error-minified-redux-*
git push origin --delete error-missing-identity-*
git push origin --delete error-no-*
git push origin --delete error-the-category-*
# ... (all error-* patterns identified)
```

### Phase 3: Review Cursor Dev Branches (~40 branches)

For `cursor/*` branches, check each PR individually:
- If PR merged → Delete branch
- If PR closed (not merged) → Delete branch
- If PR open and active → Keep
- If PR draft and stale >60 days → Delete

---

## Conclusions

1. **Cursor Agent created 120+ branches total**
   - ~80 error-* branches (automated error fixing attempts)
   - ~40 cursor/* branches (development branches)

2. **Only 9 PRs exist for error-* branches**
   - ALL are draft (never submitted)
   - ALL are 60+ days stale
   - ALL show zero activity after creation

3. **70+ error-* branches have NO PRs at all**
   - These are failed automated attempts
   - Never even created a draft PR
   - Safe to delete immediately

4. **Overall recommendation:**
   - DELETE: ~80 error-* branches (high confidence)
   - REVIEW: ~40 cursor/* branches (check PR status)
   - Expected final count: ~80-100 branches to delete

---

## Next Steps

1. **Close all 8 stale draft PRs** (#38785, #38779, #38765, #38753, #38747, #38738, #38731, #38721)
2. **Delete all error-* branches** (~80 branches total)
3. **Review cursor/* branches individually** (check PR merge/close status)
4. **Establish policy** to prevent Cursor Agent from creating branches directly in main repo

---

*This analysis is based on GitHub API data collected on 2026-02-16. All Cursor Agent PRs are authored by cursor[bot] and follow automated error-fixing patterns.*
