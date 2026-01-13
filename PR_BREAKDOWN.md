# PR Breakdown: Bridge Token-Centric Refactoring

## Overview

This refactoring moves bridge functionality from chain-centric to token-centric architecture. All chain information is now derived directly from tokens instead of maintaining separate chain state

### High-Level Goals

**Primary Goal**: Depend on tokens to determine the to/from `chainId` instead of maintaining separate chain state.

This refactoring establishes the foundation for a future simplification where we will **only manage tokens instead of chains**. By deriving all chain information from tokens now, we eliminate the need to maintain parallel chain state and make the codebase more maintainable and less error-prone.

**Benefits**:

- **Single source of truth**: Chain information comes from tokens, eliminating redundant state
- **Simpler mental model**: Tokens contain all necessary information (including `chainId`)
- **Future-proof**: Sets up for a future refactor where we only manage tokens, not chains
- **Reduced complexity**: Fewer selectors, less state synchronization, fewer edge cases

**Approach**: 2 PRs organized by architectural layer (Foundation → Implementation)

---

## PR 1: Foundation - Types, State, Selectors & Utilities

**Goal**: Establish complete foundation layer that everything else depends on

### Changes

#### Type System Changes

- **Breaking**: `BridgeToken.assetId` is now required (previously optional)
- **Breaking**: `BridgeToken.chainId` type simplified to `Hex | CaipChainId` (removed `number | ChainId`)
- **Breaking**: Removed deprecated `BridgeToken.string` field
- **Breaking**: `SlippageContext` simplified to only require `fromToken` and `toToken`
- **Removed**: `ChainIdPayload` type
- Update `TokenPayload` type

#### State Management Changes

- **Breaking**: Removed `toChainId` from `BridgeState` - now derived from `toToken.chainId`
- **Breaking**: Removed `setActiveNetwork` action from `actions.ts`
- **Breaking**: `getFromChains` selector now returns array of `chainId` strings instead of `NetworkConfiguration` objects
- Remove `toChainId` from state
- Update `getToChainId` to derive from `toToken.chainId`
- Update `getFromChainId` to derive from `fromToken.chainId`
- Update `getFromChain` and `getToChain` selectors (they now derive from tokens)
- Update actions/reducers that set `toChainId`
- Remove `setActiveNetwork` action from `actions.ts` (if it exists)
- Simplify `getFromChains` selector to return array of `chainId` strings instead of `NetworkConfiguration` objects
- Update all selectors that depend on `getFromChains` to work with chainId array (e.g., `getNetworkFilterOrTopChain`)

#### Utility Function Changes

- **Breaking**: `toAssetId()` now throws errors instead of returning `undefined`
- **Breaking**: `toBridgeToken()` now always returns `BridgeToken` (not nullable)
- **Breaking**: `getDefaultToToken()` now throws errors instead of returning `null`
- **Breaking**: `isQuoteExpiredOrInvalid()` now takes `chainId` strings instead of chain objects
- **Changed**: `toBridgeToken()` now auto-formats `chainId` (CAIP for non-EVM, Hex for EVM)
- **Changed**: `getDefaultToToken()` now derives `targetChainId` from `fromToken.chainId`
- **Changed**: `calculateSlippage()` now uses `isCrossChain` helper from bridge-controller
- **Removed**: `isNetworkAdded` utility function
- Update `getSlippageReason` function

#### New Features

- **Added**: `BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP` constant for network image mapping
- **Added**: `getBalanceAmount` method to `MetamaskController` for fetching token balances

**Testing**: Unit tests for all utilities, selector tests, type checking

---

## PR 2: Implementation - Hooks, Components & Cleanup

**Goal**: Update all hooks and components to use the new foundation

### Changes

#### Hook API Changes

- **Breaking**: `useSmartSlippage` now only requires `fromToken` and `toToken` (removed `fromChain`, `toChain`, `isSwap` parameters)
- **Breaking**: `useIsSendBundleSupported` now takes `fromChainId: BridgeToken['chainId']` instead of `fromChain` object
- **Breaking**: `useGasIncluded7702` now takes `fromChainId: BridgeToken['chainId']` instead of `fromChain` object
- **Changed**: `useIsTxSubmittable` removed `fromChainId` validation check
- **Changed**: `useTokenAlerts` simplified to only use `toToken` (removed `fromToken`, `fromChain`, `toChain` dependencies)
- **Changed**: `useBridgeExchangeRates` now derives chain IDs from tokens directly
- **Changed**: `useBridging` now uses `fromToken.chainId` directly instead of `getFromChain().chainId`
- **Removed**: `useBridging` no longer uses `lastSelectedChainId` or `providerConfig`
- **Removed**: All hooks no longer use `useMultichainSelector` or multichain selectors

**Simple Hooks**:

- `useIsTxSubmittable`: Remove `fromChainId` check
- `useTokenAlerts`: Simplify to only use `toToken`
- `useBridgeExchangeRates`: Derive chain IDs from tokens (use `fromToken.chainId` instead of `getFromChain`)

**Complex Hooks**:

- `useSmartSlippage`: Simplify parameters, use updated slippage utilities
- `useIsSendBundleSupported`: Change parameter to `fromChainId` (from `fromToken.chainId`)
- `useGasIncluded7702`: Change parameter to `fromChainId` (from `fromToken.chainId`)
- `useBridging`: Use `fromToken.chainId` directly instead of `getFromChain().chainId`, remove multichain dependencies

**Hook Dependencies**:

- Update `useBridgeQueryParams` if needed
- Any other hooks that use `getFromChain` - replace with `fromToken.chainId` directly
- Update hooks that use `fromChains` to work with chainId array instead of NetworkConfiguration objects

#### Component API Changes

- **Breaking**: `BridgeAssetPickerButton` now requires `asset` prop (previously optional) and removed `networkImageSrc` prop
- **Breaking**: `BridgeInputGroup` now requires `token` prop (previously nullable)
- **Changed**: `BridgeQuotesModal` now derives `nativeCurrency` from `fromToken.chainId` instead of multichain selector
- **Changed**: `BridgeAssetPickerButton` now derives network image from `asset.chainId` using `BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP`
- **Changed**: `BridgeInputGroup` now uses `token.chainId` directly, removed multichain selectors
- **Changed**: `CrossChainSwap` now derives `selectedNetworkClientId` from `fromToken.chainId` instead of using selector
- **Changed**: `DestinationAccountListItem` now uses `NETWORK_TO_SHORT_NETWORK_NAME_MAP` for network names
- **Changed**: `PrepareBridgePage` now uses `fromToken.chainId` directly instead of `getFromChain().chainId`
- **Removed**: `BridgeInputGroup` removed conditional button rendering for empty token state
- **Removed**: `CrossChainSwap` no longer uses `getSelectedNetworkClientId` selector
- **Removed**: All components no longer use `useMultichainSelector` or multichain selectors

**Component Updates**:

- `BridgeQuotesModal`: Derive `nativeCurrency` from `fromToken.chainId`
- `BridgeAssetPickerButton`: Remove `networkImageSrc` prop, derive from `asset.chainId`, make `asset` required
- `BridgeInputGroup`: Use `token.chainId` directly, remove multichain selectors, update block explorer logic
- `CrossChainSwap`:
  - Remove dependency on `selectedNetworkClientId` selector
  - Derive `selectedNetworkClientId` from `fromToken.chainId` using `getNetworkConfigurationIdByChainId`
  - Use `fromToken.chainId` instead of `getFromChain().chainId`
- `DestinationAccountListItem`: Use `NETWORK_TO_SHORT_NETWORK_NAME_MAP`
- `PrepareBridgePage`:
  - Replace `getFromChain().chainId` with `fromToken.chainId` directly
  - Update any usage of `fromChains` to work with chainId array
  - Remove any remaining multichain selector usage

#### Selector Updates

- **Changed**: `getFromChains` selector now sorts by `chainRanking` flag from bridge feature flags
  - This ensures chains are ordered by their ranking when returned as chainId array

#### Removed Dependencies

- **Removed**: All hooks and components no longer use `useMultichainSelector` or multichain selectors
- **Removed**: All remaining imports of multichain selectors
- **Removed**: `getFromChain` selector if no longer needed
- **Removed**: Temporary `getLastUpdatedFromVersion` change (or make permanent)
- Remove unused code
- Remove `selectedNetworkClientId` selector usage where replaced with direct derivation

**Testing**: Hook unit tests, component unit tests, integration tests, visual regression tests, E2E tests

---

## Dependency Graph

```
PR 1 (Foundation)
  ↓
PR 2 (Implementation - Hooks & Components)
```

## Benefits of This Approach

1. **No intermediate broken states**: Each PR is complete and working
2. **Clear separation**: Foundation changes vs. implementation changes
3. **Faster delivery**: 2 PRs merge faster than many smaller PRs
4. **Easier to review**: Each PR has a clear, complete scope
5. **Better testing**: Each PR can be fully tested end-to-end
6. **Natural split**: Foundation → Implementation follows architectural layers

## Alignment with Plan

### Part 1: Remove toChainId, use getBalanceAmount, remove selectedNetworkClientId dependency, use fromToken.chainId

- **PR 1**: Remove `toChainId` from state, add `getBalanceAmount` method
- **PR 2**: Hooks and components use `fromToken.chainId` instead of `getFromChain().chainId`, components remove `selectedNetworkClientId` dependency

### Part 2: Remove setActiveNetwork from actions.ts, simplify fromChains to just chainIds, sort by chainRanking

- **PR 1**: Remove `setActiveNetwork` action, simplify `getFromChains` to return chainId array
- **PR 2**: Add `chainRanking` sorting to `getFromChains`, hooks and components update to work with chainId array
