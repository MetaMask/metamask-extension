# `tokensChainsCache` Removal — Usage Report & Migration Guide

> **Date:** June 30, 2026 (audited against current `main`)
> **Related ticket:** [ASSETS-3281](https://consensyssoftware.atlassian.net/browse/ASSETS-3281)

---

## Background

`tokensChainsCache` is **in-memory state** on `TokenListController` that can hold ERC-20 token metadata (name, symbol, iconUrl) keyed by chain ID and contract address. The UI reads it via Redux (`state.metamask.tokensChainsCache`).

**From extension v13.39.0 onward**, the persistence model changed:

| Layer | Behavior |
|-------|----------|
| **Persisted controller state** | Always `{}`. `tokensChainsCache` has `persist: false` in controller metadata; [migration 190](../app/scripts/migrations/190.ts) moves any legacy data to `browser.storage.local` under `storageService:TokenListController:tokensChainsCache:{chainId}` and clears state. |
| **Assets-unify deprecation** | When `TokenListController` is listed in the `assetsUnifyState` remote feature flag’s `deprecatedControllers`, the controller keeps `tokensChainsCache` as `{}`, clears StorageService entries, and stops fetching. |

Remaining work is **removing or replacing runtime selector reads** before the controller and selectors can be deleted entirely.

The Assets team has begun this cleanup iteratively. The pattern is: replace `tokensChainsCache` selector reads with either direct prop access or dynamic fetches via the `useTokensData` hook.

---

## Selector Chain

All UI access flows through these selectors defined in `ui/selectors/selectors.js`:

```
state.metamask.tokensChainsCache
    ↓
selectERC20TokensByChain    → returns full multi-chain cache
    ↓
selectERC20Tokens           → returns data for current chain only
    ↓
getTokenList                → returns remote list (or static fallback if token detection off)
    ↓
getMemoizedMetadataContract → returns metadata for a single address
    ↓
getMetadataContractName     → returns .name for a single address
```

With an empty cache (default in 13.39.0+ persisted state, or when the controller is deprecated), these selectors return `{}` and downstream lookups become no-ops.

---

## Current Usages — Verified & Validated

### Legend

- ✅ **Active** — still on a live production path; migration or removal still worthwhile
- ✅ **Done** — no **migration** needed now (behavior is correct with empty cache). The file may still be in use; selector imports or branches remain and are tracked under [Cleanup (Phase 2)](#cleanup-phase-2)
- ❌ **Removed** — no longer imports or uses a `tokensChainsCache`-backed selector

---

### Usages via `selectERC20TokensByChain` (raw multi-chain cache)

| # | File | CODEOWNERS Team | Status |
|---|------|----------------|--------|
| 1 | `ui/hooks/useTransactionDisplayData.js` | *(no specific owner)* | ❌ Removed |
| 2 | `ui/components/multichain/import-tokens-modal/import-tokens-modal-confirm.js` | **@MetaMask/core-extension-ux** | ✅ Done — `ImportTokensModal` path (still opened from asset list); [token-management](../ui/pages/token-management/token-management.tsx) is the primary new import flow |
| 3 | `ui/hooks/gator-permissions/useGatorPermissionTokenInfo.ts` | **@MetaMask/delegation** | ✅ Active |
| 4 | `ui/components/multichain/asset-picker-amount/asset-picker-modal/Asset.tsx` | **@MetaMask/core-extension-ux** | ✅ Done — only used inside `AssetPickerModal` (bridge / Shield); not in unified send |
| 5 | `ui/pages/asset/components/token-asset.tsx` | *(no specific owner)* | ✅ Active |
| 6 | `ui/pages/confirmations/.../gas-fee-token-icon.tsx` | **@MetaMask/confirmations** | ✅ Active |
| 7 | `ui/pages/custom-token-import/custom-token-import.tsx` | *(no specific owner)* | ✅ Active — part of new token-management custom-import flow; uses cache as metadata fallback |
| 8 | `ui/components/app/assets/hooks/useTokenDisplayInfo.tsx` | **@MetaMask/metamask-assets** | ✅ Done — **file still used** for token list display; primary path uses `getAllTokens`; remaining `selectERC20TokensByChain` fallback is a no-op with empty cache |

### Usages via `getTokenList` (current-chain flattened)

| # | File | CODEOWNERS Team | Status |
|---|------|----------------|--------|
| 9 | `ui/pages/asset/components/token-asset.tsx` | *(no specific owner)* | ✅ Active (also uses `selectERC20TokensByChain`) |
| 10 | `ui/components/app/assets/hooks/useTokenDisplayInfo.tsx` | **@MetaMask/metamask-assets** | ✅ Done (no longer uses `getTokenList`) |
| 11 | `ui/hooks/useIsOriginalTokenSymbol.js` | *(no specific owner)* | ✅ Done — consumed via `TokenBalance` in `import-tokens-modal-confirm.js` and [`confirm-add-suggested-token.js`](../ui/pages/confirm-add-suggested-token/confirm-add-suggested-token.js); cache branch is a no-op |
| 12 | `ui/hooks/useAccountTotalFiatBalance.js` | *(no specific owner)* | ✅ Active |
| 13 | `ui/hooks/useTokensToSearch.js` | *(no specific owner)* | ✅ Done — only imported by `asset-picker-modal.tsx` (not unified send) |
| 14 | `ui/components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal.tsx` | **@MetaMask/core-extension-ux** | ✅ Done — not used in unified send; remains for bridge / Shield payment flows |
| 15 | `ui/components/ui/nickname-popover/nickname-popover.component.js` | *(no specific owner)* | ✅ Active |
| 16 | `ui/components/ui/update-nickname-popover/update-nickname-popover.js` | *(no specific owner)* | ✅ Active |

### Usages via `getMetadataContractName` (single-token lookup)

| # | File | CODEOWNERS Team | Status |
|---|------|----------------|--------|
| 17 | `ui/components/app/confirm/info/row/hook.ts` | *(no specific owner)* | ✅ Active |

### Direct `state.metamask.tokensChainsCache` access

| # | File | CODEOWNERS Team | Status |
|---|------|----------------|--------|
| 18 | `ui/hooks/bridge/useTokensWithFiltering.ts` | **@MetaMask/swaps-engineers** | ✅ Done — **file still used by bridge**; cache read is a no-op. **Cleanup:** see checklist |
| 19 | `ui/ducks/bridge/asset-selectors.ts` | **@MetaMask/swaps-engineers** | ✅ Done — **file still used by bridge**; cache branch is a no-op — `allTokens` covers metadata. **Cleanup:** see checklist |
| 20 | `ui/ducks/batch-sell/selectors.ts` | **@MetaMask/swaps-engineers** *(inferred)* | ✅ Done — **file still used by batch-sell**; cache fallback is a no-op. **Cleanup:** see checklist |

*No CODEOWNERS entry for `batch-sell/`; owner inferred as bridge-adjacent (`**/bridge/**` → @MetaMask/swaps-engineers).*

### Shared / Background (non-UI)

| # | File | CODEOWNERS Team | Notes |
|---|------|----------------|-------|
| 21 | `shared/lib/gator-permissions/gator-permissions-utils.ts` | **@MetaMask/delegation** | ✅ Active — receives `erc20TokensByChain` as param |
| 22 | `shared/types/background.ts` | *(no specific owner)* | Type definition — remove when state is dropped |
| 23 | `app/scripts/constants/sentry-state.ts` | *(no specific owner)* | Sentry allowlist — remove when state is dropped |
| 24 | `app/scripts/metamask-controller.js` | *(no specific owner)* | Background reads `tokenListController.state.tokensChainsCache` — remove when controller is dropped |
| 25 | `ui/selectors/selectors.js` | *(no specific owner)* | Selector definitions — remove when all consumers gone |

### Files already cleaned up ❌

| File | Previously Used |
|------|-----------------|
| `ui/hooks/useDisplayName.ts` | `selectERC20TokensByChain` |
| `ui/hooks/useTransactionDisplayData.js` | `selectERC20TokensByChain` |
| `ui/ducks/send/send.js` | `getTokenList` |
| `ui/pages/swaps/prepare-swap-page/prepare-swap-page.js` | `getTokenList` |
| `ui/pages/settings/settings-tab/settings-tab.container.js` | `getTokenList` |
| `ui/components/ui/identicon/identicon.component.js` | `getTokenList` |
| `ui/components/multichain/asset-picker-amount/asset-picker-amount.tsx` | `getTokenList` |
| `ui/components/multichain/pages/send/components/recipient-content.tsx` | `getTokenList` |
| `ui/components/app/detected-token/detected-token-details/detected-token-details.js` | `getTokenList` |
| `ui/pages/bridge/prepare/prepare-bridge-page.tsx` | `getTokenList` |
| `ui/pages/confirmations/.../hooks/useTokenDetails.ts` | `selectERC20TokensByChain` |
| `ui/components/multichain/pages/gator-permissions/.../review-gator-permission-item.tsx` | `selectERC20TokensByChain` |

---

## Team action summary

All remaining work falls into **two phases**:

| Phase | When | What |
|-------|------|------|
| **1 — Migration** | Now | **Active** files only — replace or remove `tokensChainsCache`-backed selectors with another data source (`useTokensData`, Strategy 1, etc.) |
| **2 — Cleanup** | After migration (and safe to defer for **Done** files today) | Remove every remaining selector import, dead branch, then global infra — **files stay**; only cache references are deleted |

**Done** status means **no migration** — behavior is already correct. Those teams still own **cleanup** items before `tokensChainsCache` can be removed from the codebase entirely.

| Team | Migration (now) | Cleanup (later) | Your action |
|------|-----------------|-----------------|-------------|
| **@MetaMask/confirmations** | `gas-fee-token-icon.tsx` — drop `selectERC20TokensByChain` or use existing fallbacks / `useTokensData` | — | **Migrate now** (1 file) |
| **@MetaMask/delegation** | `useGatorPermissionTokenInfo.ts`, `gator-permissions-utils.ts` — `useTokensData`; stop passing cache param | — | **Migrate now** (2 files) |
| **@MetaMask/metamask-assets** | — | `useTokenDisplayInfo.tsx` — remove stale `selectERC20TokensByChain` fallback | **Cleanup later**; coordinate **unowned** migration below |
| **@MetaMask/core-extension-ux** | — | `import-tokens-modal-confirm.js`, `Asset.tsx`, `asset-picker-modal.tsx`, `useTokensToSearch.js`, `useIsOriginalTokenSymbol.js` | **Cleanup later** (5 files) |
| **@MetaMask/swaps-engineers** | — | `useTokensWithFiltering.ts`, `asset-selectors.ts`, `batch-sell/selectors.ts` *(inferred owner — no CODEOWNERS entry for batch-sell)* — remove cache branches only; **do not delete files** | **Cleanup later** (3 files) |
| **No specific CODEOWNER** | `token-asset.tsx`, `custom-token-import.tsx`, `useAccountTotalFiatBalance.js`, nickname popovers, confirm info `hook.ts` | Same files — remove any leftover selector imports after migration | **Migrate now** (6 files); needs coordinating team (Assets or Core Extension UX) |
| **Platform / shared** | — | `selectors.js`, `background.ts`, `sentry-state.ts`, `metamask-controller.js`, `TokenListController` | **Global cleanup last** — after all team migration + per-file cleanup |

---

## Migration (Phase 1)

Required now for **Active** files only (verified against current `main`):

| File | Owner team | Selector / access | Suggested approach |
|------|------------|-------------------|-------------------|
| `ui/pages/confirmations/.../gas-fee-token-icon.tsx` | **@MetaMask/confirmations** | `selectERC20TokensByChain` | Remove selector; `PreferredAvatar` / native icon fallbacks already work — or `useTokensData` |
| `ui/pages/asset/components/token-asset.tsx` | **No specific CODEOWNER** | `getTokenList`, `selectERC20TokensByChain` | `useTokensData` or assets API |
| `ui/pages/custom-token-import/custom-token-import.tsx` | **No specific CODEOWNER** | `selectERC20TokensByChain` | `useTokensData` or on-chain / assets metadata only |
| `ui/hooks/useAccountTotalFiatBalance.js` | **No specific CODEOWNER** | `getTokenList` | Strategy 1 — token images from token objects |
| `ui/components/ui/nickname-popover/nickname-popover.component.js` | **No specific CODEOWNER** | `getTokenList` | Strategy 1 — icon from context / token object |
| `ui/components/ui/update-nickname-popover/update-nickname-popover.js` | **No specific CODEOWNER** | `getTokenList` | Strategy 1 — same as nickname-popover |
| `ui/components/app/confirm/info/row/hook.ts` | **No specific CODEOWNER** | `getMetadataContractName` | `useTokensData` or name from transaction/token context |
| `ui/hooks/gator-permissions/useGatorPermissionTokenInfo.ts` | **@MetaMask/delegation** | `selectERC20TokensByChain` | `useTokensData`; stop passing cache into utils |
| `shared/lib/gator-permissions/gator-permissions-utils.ts` | **@MetaMask/delegation** | `erc20TokensByChain` param | Remove param; use `useTokensData` at call site or imported-token data only |

Unowned files: coordinate with **@MetaMask/metamask-assets** or **@MetaMask/core-extension-ux**.

---

## Cleanup (Phase 2)

Not required for correct behavior today for **Done** files. **Must** be completed before deleting `selectERC20TokensByChain`, `getTokenList`, `getMetadataContractName`, and `TokenListController`.

### Per-file cleanup

No `useTokensData` migration — remove listed selector usage only (**files stay**).

| File | Owner team | Selector / access | What to remove |
|------|------------|-------------------|----------------|
| `ui/components/app/assets/hooks/useTokenDisplayInfo.tsx` | **@MetaMask/metamask-assets** | `selectERC20TokensByChain` | Import, `useSelector`, and `erc20TokensByChain?.[chainId]?.data` fallback in `title` / `tokenImage` |
| `ui/components/multichain/import-tokens-modal/import-tokens-modal-confirm.js` | **@MetaMask/core-extension-ux** | `selectERC20TokensByChain` | Import and `tokenListByChain` usage (`ImportTokensModal` path; still reachable from asset list) |
| `ui/components/multichain/asset-picker-amount/asset-picker-modal/Asset.tsx` | **@MetaMask/core-extension-ux** | `selectERC20TokensByChain` | Import and `cachedTokens` lookup |
| `ui/components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal.tsx` | **@MetaMask/core-extension-ux** | `getTokenList` | Import and `evmTokenMetadataByAddress` selector |
| `ui/hooks/useTokensToSearch.js` | **@MetaMask/core-extension-ux** | `getTokenList` | Import and `tokenList` in `useTokensToSearch` / `getRenderableTokenData` |
| `ui/hooks/useIsOriginalTokenSymbol.js` | **@MetaMask/core-extension-ux** | `getTokenList` | Import and cache read in `useEffect` (keep on-chain `getTokenSymbol` fallback); consumers: `TokenBalance` in `import-tokens-modal-confirm.js` and `confirm-add-suggested-token.js` |
| `ui/hooks/bridge/useTokensWithFiltering.ts` | **@MetaMask/swaps-engineers** | `state.metamask.tokensChainsCache` | `cachedTokens` selector, `cachedTokenList` / `isTokenListCached` branch; rely on `fetchBridgeTokens` only |
| `ui/ducks/bridge/asset-selectors.ts` | **@MetaMask/swaps-engineers** | `tokensChainsCache` in `getERC20AssetsWithBalance` | Selector input (~line 80) and `cacheToken` branch (~130–148); keep `allTokens` fallback |
| `ui/ducks/batch-sell/selectors.ts` | **@MetaMask/swaps-engineers** *(inferred)* | `state.metamask.tokensChainsCache` | Selector input (~305–323) and last-resort `tokenData` block (~351–367) |

After **Phase 1 migration**, remove any leftover selector imports from those nine Active files as part of cleanup.

### Global cleanup

Run only when grep shows **zero** production consumers of `selectERC20TokensByChain`, `getTokenList`, `getMetadataContractName`, and direct `tokensChainsCache` access.

| File | What to remove |
|------|----------------|
| `ui/selectors/selectors.js` | `selectERC20TokensByChain`, `selectERC20Tokens`, `getTokenList`, `getMemoizedMetadataContract`, `getMetadataContractName` |
| `shared/types/background.ts` | `tokensChainsCache` on background state type |
| `app/scripts/constants/sentry-state.ts` | `tokensChainsCache` allowlist entry |
| `app/scripts/metamask-controller.js` | Reads of `this.tokenListController.state.tokensChainsCache` (~3957, ~4079) |
| `TokenListController` + migration 190 storage keys | Drop controller wiring when no consumers remain |

**Consumer grep checklist (production UI):** `selectERC20TokensByChain` (7 files), `getTokenList` (7 files), `getMetadataContractName` (1 file), direct `state.metamask.tokensChainsCache` (3 files), plus definitions in `ui/selectors/selectors.js`.

---

## Migration Guide — Best Practices for Removal

### Strategy 1: Outright Removal (preferred when possible)

In many cases the component doesn't actually need data from `tokensChainsCache` because the token metadata (name, symbol, image) is **already available upstream** — passed down as props from Redux state or another hook that already resolves this data.

**When to use:** The token object you're working with already has `.name`, `.symbol`, and `.image` populated (e.g. from `TokensController` / `AssetsController` state, from the import flow, or from a parent component).

**Example:** `useTokenDisplayInfo` — current code still has fallback branches that are no-ops (cache is empty):

```typescript
// CURRENT: primary path uses getAllTokens; erc20TokensByChain fallback is a no-op
const allTokens = useSelector(getAllTokens);
const erc20TokensByChain = useSelector(selectERC20TokensByChain); // returns {}

const tokenData = Object.values(allTokens[token.chainId] ?? {})
  .flat()
  .find((t) => isEqualCaseInsensitive(t.address, token.address));

const title =
  tokenData?.name ||
  erc20TokensByChain?.[token.chainId]?.data?.[token.address.toLowerCase()]?.name || // dead branch
  token.symbol;

const tokenImage =
  tokenData?.image ||
  erc20TokensByChain?.[token.chainId]?.data?.[token.address.toLowerCase()]?.iconUrl || // dead branch
  token.image;
```

**Cleanup:** Remove the `selectERC20TokensByChain` import, selector call, and fallback branches:

```typescript
// AFTER CLEANUP: just use getAllTokens + token prop fallback
const allTokens = useSelector(getAllTokens);

const tokenData = Object.values(allTokens[token.chainId] ?? {})
  .flat()
  .find((t) => isEqualCaseInsensitive(t.address, token.address));

const title = tokenData?.name || token.symbol;
const tokenImage = tokenData?.image || token.image;
```

**Likely candidates for outright removal:**
- `nickname-popover` / `update-nickname-popover` — only uses `getTokenList` for icon URL lookup; icon may already be available from the token object in context
- `useAccountTotalFiatBalance` — uses `getTokenList` only for token images; images may already be on the token objects from `TokensController`

### Strategy 2: Migrate to `useTokensData` Hook

When token metadata genuinely needs to be looked up by address/chain (e.g. the component only has a contract address, not a full token object), replace the `tokensChainsCache` selector with the `useTokensData` hook.

**How it works:**
1. Build a CAIP-19 asset ID for each token: `eip155:<chainId>/erc20:<address>`
2. Pass the array of asset IDs to `useTokensData()`
3. The hook fetches from `https://tokens.api.cx.metamask.io/v3/assets` with automatic batching (25 per request), module-level caching, and in-flight deduplication

**Step-by-step:**

```typescript
import { useTokensData } from '../../hooks/useTokensData';
import { buildEvmCaip19AssetId } from '../../../shared/lib/multichain/buildEvmCaip19AssetId';

// 1. Build the CAIP-19 asset ID
const assetId = buildEvmCaip19AssetId(tokenAddress, chainId);

// 2. Fetch token metadata
const tokensData = useTokensData([assetId]);

// 3. Read from the result
const tokenInfo = tokensData[assetId.toLowerCase()];
const name = tokenInfo?.name ?? '';
const icon = tokenInfo?.iconUrl ?? '';
const symbol = tokenInfo?.symbol ?? '';
```

**Key details:**
- The hook handles batching automatically — pass as many asset IDs as needed
- Results are cached at the module level, so subsequent renders and other components reuse the same data
- Concurrent hook instances for the same batch share a single HTTP request (in-flight deduplication)
- Always lowercase the asset ID when looking up results (the API may return checksummed addresses)

**Likely candidates for `useTokensData` migration:**
- `gas-fee-token-icon.tsx` — has token address + chain ID, needs icon URL
- `token-asset.tsx` — asset detail page with address + chain
- `custom-token-import.tsx` — metadata fallback during custom import
- `hook.ts` (confirm info row) — has contract address, needs display name
- `gator-permissions-utils.ts` — receives token address + chain ID, looks up name/symbol/icon

### Strategy 3: Cleanup only (Done files / bridge / batch-sell)

See [Cleanup (Phase 2)](#cleanup-phase-2). **Not required for correct behavior today** on Done files. Required before global selectors and `TokenListController` can be deleted.

Bridge/batch-sell files **must not be deleted** — only remove `tokensChainsCache` branches listed in the per-file cleanup table.

---

## Summary

| Status | Count |
|--------|-------|
| Already cleaned up (selector removed) | 12 files |
| **Migration (Phase 1)** — Active, work required now | 9 files |
| **Cleanup (Phase 2)** — Done files + global infra | 9 per-file + 5 global |
| Done in usage tables (cleanup only, no migration) | 9 files |

**Next steps:** use the [Team action summary](#team-action-summary) for ownership. Complete **Migration (Phase 1)** first, then **Cleanup (Phase 2)** per-file items, then **Global cleanup** when grep shows zero consumers.
