# Cursor Agent Branches - Quick Reference

**Date:** 2026-02-16  
**Total Cursor Agent Branches:** ~120+

## Quick Stats

| Metric | Count |
|--------|-------|
| Total PRs by cursor[bot] | 9 |
| Open draft PRs (stale) | 8 |
| Closed PRs | 1 |
| Error branches WITH PRs | 9 |
| Error branches WITHOUT PRs | ~70 |
| Cursor dev branches (cursor/*) | ~40 |
| **Recommended for deletion** | **~80-100** |

## All 9 Cursor Agent PRs (ALL Stale 60+ Days)

| PR # | Status | Days | Action |
|------|--------|------|--------|
| [38785](https://github.com/MetaMask/metamask-extension/pull/38785) | Open Draft | 66 | Close & Delete |
| [38779](https://github.com/MetaMask/metamask-extension/pull/38779) | Open Draft | 66 | Close & Delete |
| [38765](https://github.com/MetaMask/metamask-extension/pull/38765) | Open Draft | 66 | Close & Delete |
| [38753](https://github.com/MetaMask/metamask-extension/pull/38753) | Open Draft | 67 | Close & Delete |
| [38747](https://github.com/MetaMask/metamask-extension/pull/38747) | Open Draft | 67 | Close & Delete |
| [38738](https://github.com/MetaMask/metamask-extension/pull/38738) | Open Draft | 67 | Close & Delete |
| [38731](https://github.com/MetaMask/metamask-extension/pull/38731) | Open Draft | 67 | Close & Delete |
| [38721](https://github.com/MetaMask/metamask-extension/pull/38721) | Open Draft | 67 | Close & Delete |
| [38350](https://github.com/MetaMask/metamask-extension/pull/38350) | Closed | 80 | Delete Branch |

**Pattern:** ALL created Dec 10-11, 2025. ZERO activity since. ALL abandoned.

## Error Branch Patterns to Delete

### With PRs (9 branches - close PR first)
- Associated with the 9 PRs above
- Close PR, then delete branch

### Without PRs (~70 branches - delete directly)
```
error-cannot-read-*           (~10 branches)
error-invalid-chain-*         (~10 branches)
error-invalid-caip-*          (~3 branches)
error-invalid-controller-*    (~2 branches)
error-migration-*             (~5 branches)
error-minified-redux-*        (~5 branches)
error-missing-identity-*      (~5 branches)
error-no-*                    (~10 branches)
error-the-category-*          (~20 branches)
```

## Cursor Dev Branches (~40)

Pattern: `cursor/*`

**Action Required:** Review individually
- Check if PR merged → Delete
- Check if PR closed → Delete
- Check if PR draft >60d → Delete
- Keep only active PRs

## One-Line Commands

### Close all stale draft PRs:
```bash
gh pr close 38785 38779 38765 38753 38747 38738 38731 38721 \
  --comment "Closing abandoned Cursor Agent draft (60+ days stale)"
```

### List all error-* branches:
```bash
gh api repos/MetaMask/metamask-extension/branches --paginate \
  | jq -r '.[] | select(.name | startswith("error-")) | .name'
```

### Check cursor/* branch status:
```bash
gh pr list --author "cursor[bot]" --state all --json number,state,headRefName,createdAt
```

## See Also

- **CURSOR_AGENT_BRANCHES.md** - Full analysis with all details
- **DANGLING_BRANCHES_REPORT.md** - Overall repository branch analysis

---

*Created: 2026-02-16 | All Cursor Agent branches analyzed*
