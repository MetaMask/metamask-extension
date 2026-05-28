# `tokensChainsCache` Removal — Updated Usage Report & Migration Guide

> **Date:** May 28, 2026
> **Audited against:** current `main` branch at time of writing
> **Reference PR:** [#42545 — remove tokensChainsCache usage from useTokenDisplayInfo][pr-42545]

---

## Background

`tokensChainsCache` is persisted state from `TokenListController` that stores ERC-20 token metadata (name, symbol, iconUrl) keyed by chain ID and contract address. It has **no migration path** in the new unified assets state (see `shared/lib/selectors/assets-migration.ts`), which means every read site must be migrated or removed before the state can be dropped.

The Assets team has begun this cleanup iteratively. [PR #42545][pr-42545] demonstrates the pattern: replace `tokensChainsCache` selector reads with either direct prop access or dynamic fetches via the `useTokensData` hook.

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

---

## Current Usages — Verified & Validated

### Legend
- ✅ **Still active** — file currently imports/uses a `tokensChainsCache`-backed selector
- ❌ **Removed** — file existed in previous report but no longer uses `tokensChainsCache`
- 🆕 **New** — file was not in the previous report

---

### Usages via `selectERC20TokensByChain` (raw multi-chain cache)

| # | File | CODEOWNERS Team | Status |
|---|------|----------------|--------|
| 1 | `ui/hooks/useTransactionDisplayData.js` | *(no specific owner)* | ✅ Active |
| 2 | `ui/components/multichain/import-tokens-modal/import-tokens-modal-confirm.js` | **@MetaMask/core-extension-ux** | ✅ Active |
| 3 | `ui/hooks/gator-permissions/useGatorPermissionTokenInfo.ts` | **@MetaMask/delegation** | 🆕 ✅ Active |
| 4 | `ui/components/multichain/asset-picker-amount/asset-picker-modal/Asset.tsx` | **@MetaMask/core-extension-ux** | ✅ Active |
| 5 | `ui/pages/asset/components/token-asset.tsx` | *(no specific owner)* | ✅ Active |
| 6 | `ui/pages/confirmations/.../gas-fee-token-icon.tsx` | **@MetaMask/confirmations** | 🆕 ✅ Active |
| 7 | `ui/pages/custom-token-import/custom-token-import.tsx` | *(no specific owner)* | 🆕 ✅ Active |
| 8 | `ui/components/app/assets/hooks/useTokenDisplayInfo.tsx` | **@MetaMask/metamask-assets** | ✅ Active *([PR #42545][pr-42545] in progress)* |

### Usages via `getTokenList` (current-chain flattened)

| # | File | CODEOWNERS Team | Status |
|---|------|----------------|--------|
| 9 | `ui/pages/asset/components/token-asset.tsx` | *(no specific owner)* | ✅ Active (also uses selectERC20TokensByChain) |
| 10 | `ui/components/app/assets/hooks/useTokenDisplayInfo.tsx` | **@MetaMask/metamask-assets** | ✅ Active *([PR #42545][pr-42545] in progress)* |
| 11 | `ui/hooks/useIsOriginalTokenSymbol.js` | *(no specific owner)* | ✅ Active |
| 12 | `ui/hooks/useAccountTotalFiatBalance.js` | *(no specific owner)* | ✅ Active |
| 13 | `ui/hooks/useTokensToSearch.js` | *(no specific owner)* | ✅ Active |
| 14 | `ui/components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal.tsx` | **@MetaMask/core-extension-ux** | ✅ Active |
| 15 | `ui/components/ui/nickname-popover/nickname-popover.component.js` | *(no specific owner)* | ✅ Active |
| 16 | `ui/components/ui/update-nickname-popover/update-nickname-popover.js` | *(no specific owner)* | ✅ Active |

### Usages via `getMetadataContractName` (single-token lookup)

| # | File | CODEOWNERS Team | Status |
|---|------|----------------|--------|
| 17 | `ui/components/app/confirm/info/row/hook.ts` | *(no specific owner)* | 🆕 ✅ Active |

### Direct `state.metamask.tokensChainsCache` access

| # | File | CODEOWNERS Team | Status |
|---|------|----------------|--------|
| 18 | `ui/hooks/bridge/useTokensWithFiltering.ts` | **@MetaMask/swaps-engineers** | ✅ Active |
| 19 | `ui/ducks/bridge/asset-selectors.ts` | **@MetaMask/swaps-engineers** | ✅ Active |

### Shared / Background (non-UI)

| # | File | CODEOWNERS Team | Notes |
|---|------|----------------|-------|
| 20 | `shared/lib/gator-permissions/gator-permissions-utils.ts` | **@MetaMask/delegation** | 🆕 ✅ Active — receives `erc20TokensByChain` as param |
| 21 | `shared/types/background.ts` | *(no specific owner)* | Type definition — remove when state is dropped |
| 22 | `app/scripts/constants/sentry-state.ts` | *(no specific owner)* | Sentry allowlist — remove when state is dropped |
| 23 | `app/scripts/metamask-controller.js` | *(no specific owner)* | Controller wiring — remove when state is dropped |
| 24 | `ui/selectors/selectors.js` | *(no specific owner)* | Selector definitions — remove when all consumers gone |

### Files from previous report that have been cleaned up ❌

| File | Previously Used |
|------|-----------------|
| `ui/hooks/useDisplayName.ts` | `selectERC20TokensByChain` |
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

## Teams Responsible for Remaining Removals

| Team | Files to Migrate | Count |
|------|-----------------|-------|
| **@MetaMask/metamask-assets** | `useTokenDisplayInfo.tsx` *([PR #42545][pr-42545] in progress)* | 1 |
| **@MetaMask/core-extension-ux** | `import-tokens-modal-confirm.js`, `Asset.tsx`, `asset-picker-modal.tsx` | 3 |
| **@MetaMask/swaps-engineers** | `useTokensWithFiltering.ts`, `asset-selectors.ts` | 2 |
| **@MetaMask/confirmations** | `gas-fee-token-icon.tsx` | 1 |
| **@MetaMask/delegation** | `useGatorPermissionTokenInfo.ts`, `gator-permissions-utils.ts` | 2 |
| **No specific CODEOWNER** | `useTransactionDisplayData.js`, `token-asset.tsx`, `custom-token-import.tsx`, `useIsOriginalTokenSymbol.js`, `useAccountTotalFiatBalance.js`, `useTokensToSearch.js`, `nickname-popover`, `update-nickname-popover`, `hook.ts` (confirm info row) | 9 |

**Total remaining production UI usages: 19 files**
(Plus 4 infrastructure files that auto-clean when state is dropped)

---

## Migration Guide — Best Practices for Removal

### Strategy 1: Outright Removal (preferred when possible)

In many cases the component doesn't actually need data from `tokensChainsCache` because the token metadata (name, symbol, image) is **already available upstream** — passed down as props from Redux state or another hook that already resolves this data.

**When to use:** The token object you're working with already has `.name`, `.symbol`, and `.image` populated (e.g. from `TokensController` state, from the import flow, or from a parent component).

**Example:** [PR #42545][pr-42545] — `useTokenDisplayInfo` was doing:
```typescript
// BEFORE: scanning tokensChainsCache for a name/image match
const tokenList = useSelector(getTokenList);
const erc20TokensByChain = useSelector(selectERC20TokensByChain);
// ...linear scan by symbol+address to find name/image

// AFTER: just use what's already on the token prop
const title = token.name || fallbackFromApi;
const tokenImage = token.image || fallbackFromApi;
```

**Likely candidates for outright removal:**
- `nickname-popover` / `update-nickname-popover` — only uses `getTokenList` for icon URL lookup; icon may already be available from the token object in context
- `useIsOriginalTokenSymbol` — validates symbol against the cached list, but may be obsolete if token detection provides canonical data
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
- `useTransactionDisplayData.js` — has token addresses from transaction data, needs display metadata
- `Asset.tsx` — has token addresses in the asset picker context
- `hook.ts` (confirm info row) — has contract address, needs display name
- `gator-permissions-utils.ts` — receives token address + chain ID, looks up name/symbol/icon

### Strategy 3: For Bridge/Swap selectors (direct state access)

For `ui/ducks/bridge/asset-selectors.ts` and `ui/hooks/bridge/useTokensWithFiltering.ts`, which access `state.metamask.tokensChainsCache` directly to build aggregate cross-chain token lists — the Swaps team should evaluate whether:
- The data can be sourced from `fetchBridgeTokens` (already partially done in `useTokensWithFiltering`)
- A new selector backed by the `/v3/assets` API or a controller-level cache can replace the raw state read

---

## Summary & Next Steps

| Status | Count |
|--------|-------|
| Already cleaned up | 11 files |
| In-progress ([PR #42545][pr-42545]) | 1 file |
| Remaining to migrate | 18 files |
| Infrastructure (auto-clean) | 4 files |

**Recommended actions:**
1. **Assets team** — land [PR #42545][pr-42545] (`useTokenDisplayInfo`)
2. **Tag teams in #metamask-performance** with this report and the migration patterns above
3. **Each team picks up their files** using Strategy 1 (outright removal) where possible, falling back to Strategy 2 (`useTokensData`) where a lookup is genuinely needed
4. **Files with no CODEOWNER** (9 files) — Assets team or Core Extension UX to coordinate ownership
5. **Once all UI consumers are gone** — remove the selectors from `selectors.js`, the type from `background.ts`, and the Sentry allowlist entry, completing the cleanup

[pr-42545]: https://github.com/MetaMask/metamask-extension/pull/42545
