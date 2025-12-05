# Tokens Chains Cache - Selectors Usage Documentation

## Overview

This document provides a comprehensive analysis of the `tokensChainsCache` state and its related selectors in the MetaMask extension, including all components that are directly or indirectly affected by these selectors.

## Primary Selectors

### 1. `selectERC20TokensByChain`
```javascript
export const selectERC20TokensByChain = createDeepEqualSelector(
  (state) => state.metamask.tokensChainsCache,
  (erc20TokensByChain) => erc20TokensByChain,
);
```
- **Purpose**: Returns the entire `tokensChainsCache` object containing ERC-20 tokens organized by chain
- **Returns**: `Object` - Complete tokens cache with chain ID keys

### 2. `selectERC20Tokens`
```javascript
export const selectERC20Tokens = createDeepEqualSelector(
  getCurrentChainId,
  (state) => state.metamask.tokensChainsCache,
  (chainId, erc20Tokens) => erc20Tokens?.[chainId]?.data || {},
);
```
- **Purpose**: Returns ERC-20 tokens for the currently selected chain only
- **Returns**: `Object` - Token data for current chain
- **Dependencies**: `getCurrentChainId`

## Derived Selectors

### 3. `getTokenList`
```javascript
export const getTokenList = createSelector(
  selectERC20Tokens,
  getIsTokenDetectionInactiveOnMainnet,
  (remoteTokenList, isTokenDetectionInactiveOnMainnet) => {
    return isTokenDetectionInactiveOnMainnet
      ? STATIC_MAINNET_TOKEN_LIST
      : remoteTokenList;
  },
);
```
- **Purpose**: Returns the token list for UI usage (remote or static based on token detection settings)
- **Dependencies**: `selectERC20Tokens`, `getIsTokenDetectionInactiveOnMainnet`
- **Returns**: `Object` - Token list for current chain

### 4. `getMemoizedMetadataContract`
```javascript
export const getMemoizedMetadataContract = createSelector(
  (state, _address) => getTokenList(state),
  (_state, address) => address,
  (tokenList, address) => tokenList[address?.toLowerCase()],
);
```
- **Purpose**: Returns metadata for a specific token contract address
- **Dependencies**: `getTokenList`
- **Returns**: `Object` - Token metadata for specific address

## Component Usage Analysis

### Direct Usage of Primary Selectors

| Component | `selectERC20TokensByChain` | `selectERC20Tokens` | Purpose |
|-----------|------------------------|-------------------|---------|
| `ui/pages/asset/components/token-asset.tsx` | ✅ | ❌ | Token asset display page |
| `ui/components/multichain/pages/gator-permissions/components/review-gator-permission-item.tsx` | ✅ | ✅ | Permission review for tokens |
| `ui/pages/confirmations/components/confirm/info/hooks/useTokenDetails.ts` | ✅ | ✅ | Token details in confirmations |
| `ui/pages/confirmations/components/confirm/info/shared/gas-fee-token-icon/gas-fee-token-icon.tsx` | ✅ | ✅ | Gas fee token icon display |
| `ui/hooks/useTransactionDisplayData.js` | ✅ | ✅ | Transaction display data hook |
| `ui/hooks/useDisplayName.ts` | ✅ | ✅ | Display name resolution |
| `ui/components/multichain/asset-picker-amount/asset-picker-modal/Asset.tsx` | ✅ | ✅ | Asset picker component |
| `ui/components/app/assets/hooks/useTokenDisplayInfo.tsx` | ✅ | ❌ | Token display information hook |
| `ui/components/multichain/import-tokens-modal/import-tokens-modal-confirm.js` | ✅ | ✅ | Token import confirmation |

### Derived Selector Usage - `getTokenList`

| Component | Usage Type |
|-----------|------------|
| `ui/pages/asset/components/token-asset.tsx` | Direct |
| `ui/pages/bridge/prepare/prepare-bridge-page.tsx` | Direct |
| `ui/components/ui/nickname-popover/nickname-popover.component.js` | Direct |
| `ui/ducks/send/send.js` | Direct |
| `ui/components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal.tsx` | Direct |
| `ui/pages/swaps/prepare-swap-page/prepare-swap-page.js` | Direct |
| `ui/components/app/assets/hooks/useTokenDisplayInfo.tsx` | Direct |
| `ui/hooks/useAccountTotalFiatBalance.js` | Direct |
| `ui/pages/settings/settings-tab/settings-tab.container.js` | Direct |
| `ui/components/ui/identicon/identicon.component.js` | Direct |
| `ui/components/multichain/asset-picker-amount/asset-picker-amount.tsx` | Direct |
| `ui/components/multichain/pages/send/components/recipient-content.tsx` | Direct |
| `ui/hooks/useTokensToSearch.js` | Direct |
| `ui/components/app/detected-token/detected-token-details/detected-token-details.js` | Direct |
| `ui/hooks/useIsOriginalTokenSymbol.js` | Direct |
| `ui/components/ui/update-nickname-popover/update-nickname-popover.js` | Direct |

## Impact Assessment

### High Impact Components (Critical UI)
- **Asset Display**: `token-asset.tsx`, `Asset.tsx` - Core token display functionality
- **Transaction Flow**: `useTransactionDisplayData.js`, confirmation components
- **Asset Selection**: Asset picker components, swap/send pages
- **Balance Display**: `useAccountTotalFiatBalance.js`

### Medium Impact Components (Enhanced UX)
- **Token Information**: Display name, identicon, metadata
- **Search/Filtering**: Token search functionality
- **Permissions**: Gator permissions review
- **Settings**: Token management in settings

### Low Impact Components (Utilities)
- **Utility Hooks**: Token validation, symbol checking, and metadata utilities

