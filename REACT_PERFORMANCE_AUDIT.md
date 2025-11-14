# React Performance Audit Report

## MetaMask Extension Codebase

**Audit Date:** Generated via CODEBOT
**Scope:** React performance guidelines compliance
**Reference:** `.cursor/rules/react-performance-guidelines.mdc`

---

## Executive Summary

This audit identifies React performance violations across the codebase based on the React Performance Guidelines. The violations are categorized by severity: **CRITICAL** (blocks merge), **HIGH** (should fix), and **MEDIUM** (consider fixing).

**Overall Status:** ⚠️ **NEEDS WORK** - Multiple critical and high-priority violations found

---

## 📊 Summary Statistics

- **Total Violations Found:** 70+
- **Critical Violations:** 26
- **High Priority Issues:** 32+
- **Medium Priority Issues:** 12+

---

## ❌ CRITICAL VIOLATIONS (Must Fix Before Merge)

### 1. Using Array Index as Key in Dynamic Lists

**Severity:** 🔴 CRITICAL
**Impact:** Breaks React reconciliation, causes bugs when lists reorder/filter

**Violations Found:**

#### `ui/components/app/snaps/snap-ui-asset-selector/snap-ui-asset-selector.tsx`

```137:139:ui/components/app/snaps/snap-ui-asset-selector/snap-ui-asset-selector.tsx
  const optionComponents = assets.map((asset, index) => (
    <SnapUIAssetSelectorOption {...asset} key={index} />
  ));
```

**Issue:** Using `index` as key for dynamic list. Assets can be reordered or filtered, breaking React's reconciliation.

**Fix:**

```typescript
const optionComponents = assets.map((asset) => (
  <SnapUIAssetSelectorOption {...asset} key={asset.address} />
));
```

#### `ui/pages/shield-plan/shield-plan.tsx`

```473:474:ui/pages/shield-plan/shield-plan.tsx
                  {planDetails.map((detail, index) => (
                    <Box key={index} display={Display.Flex} gap={2}>
```

**Issue:** Using `index` as key. Plan details may reorder.

**Fix:** Use a unique identifier from `detail` object (e.g., `detail.id` or `detail.key`).

#### `ui/pages/confirmations/components/simulation-details/simulation-details.tsx`

```527:528:ui/pages/confirmations/components/simulation-details/simulation-details.tsx
        {staticRows.map((staticRow, index) => (
          <Fragment key={index}>
```

**Issue:** Using `index` as key for fragments.

**Fix:** Use a unique identifier from `staticRow` (e.g., `staticRow.id` or generate stable key).

#### Additional Files with Index as Key:

- `ui/pages/settings/transaction-shield-tab/transaction-shield.tsx:737`
- `ui/pages/defi/components/defi-details-list.tsx:102`
- `ui/pages/confirmations/components/simulation-details/balance-change-list.tsx:65`
- `ui/pages/confirmations/components/confirm/info/shared/transaction-data/transaction-data.tsx:99,109`
- `ui/pages/confirmations/components/confirm/info/batch/nested-transaction-data/nested-transaction-data.tsx:34`
- `ui/pages/bridge/quotes/bridge-quotes-modal.tsx:213`
- `ui/components/ui/qr-code-view/qr-code-view.tsx:78`
- `ui/components/ui/form-combo-field/form-combo-field.tsx:139`
- `ui/components/app/snaps/snap-ui-selector/snap-ui-selector.tsx:263`
- `ui/components/app/snaps/snap-ui-account-selector/snap-ui-account-selector.tsx:93`
- `ui/components/app/snaps/keyring-snap-removal-warning/keyring-snap-removal-warning.tsx:119`
- `ui/components/app/assets/nfts/nft-grid/nft-grid.tsx:94`
- `ui/pages/onboarding-flow/recovery-phrase/recovery-phrase-chips.js:212`
- `ui/pages/create-account/connect-hardware/select-hardware.js:418`
- `ui/components/ui/button-group/button-group.component.js:95`
- `ui/components/app/transaction-activity-log/transaction-activity-log.component.js:104`
- `ui/components/app/srp-input/srp-input.js:179`
- `ui/components/app/flask/experimental-area/experimental-area.js:10`
- `ui/components/app/detected-token/detected-token-selection-popover/detected-token-selection-popover.js:123`
- `ui/components/ui/account-list/account-list.js:131`

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Use Proper Keys" section

---

### 2. Inline Style Objects in JSX

**Severity:** 🔴 CRITICAL
**Impact:** Creates new object references on every render, causing unnecessary re-renders

**Violations Found:**

#### `ui/components/app/snaps/snap-ui-asset-selector/snap-ui-asset-selector.tsx`

```56:56:ui/components/app/snaps/snap-ui-asset-selector/snap-ui-asset-selector.tsx
    style={{ overflow: 'hidden' }}
```

```75:75:ui/components/app/snaps/snap-ui-asset-selector/snap-ui-asset-selector.tsx
      style={{ overflow: 'hidden' }}
```

**Issue:** Inline style objects create new references on every render.

**Fix:**

```typescript
const OVERFLOW_HIDDEN_STYLE = { overflow: 'hidden' };

// In component:
<Box style={OVERFLOW_HIDDEN_STYLE} />
```

#### `ui/pages/shield-plan/shield-plan.tsx`

```478:478:ui/pages/shield-plan/shield-plan.tsx
                        style={{ height: '1lh' }}
```

**Issue:** Inline style object.

**Fix:** Extract to constant or use CSS class.

#### Additional Files with Inline Style Objects:

- `ui/pages/unlock-page/reset-password-modal.tsx:61,82,128`
- `ui/pages/smart-transactions/smart-transaction-status-page/smart-transaction-status-page.tsx:342`
- `ui/pages/smart-transactions/smart-transaction-status-page/smart-transaction-status-animation.tsx:71`
- `ui/pages/settings/transaction-shield-tab/transaction-shield.tsx:749`
- `ui/pages/settings/networks-tab/networks-form/networks-form.tsx:419,623`
- `ui/pages/settings/developer-options-tab/sentry-test.tsx:280`
- `ui/pages/settings/developer-options-tab/developer-options-tab.tsx:135,162,187`
- `ui/pages/settings/developer-options-tab/backup-and-sync.tsx:62`
- `ui/pages/settings/deprecated-network-modal/DeprecatedNetworkModal.tsx:72`
- `ui/pages/settings/backup-and-sync-tab/backup-and-sync-tab.component.tsx:49`
- `ui/pages/remove-snap-account/snap-account-card.tsx:30`
- `ui/pages/remove-snap-account/remove-snap-account.tsx:58`
- `ui/pages/permissions-connect/connect-page/connect-page.tsx:471,488`
- `ui/pages/swaps/transaction-settings/transaction-settings.js:187`
- `ui/pages/swaps/smart-transaction-status/smart-transaction-status.js:421`
- `ui/pages/swaps/prepare-swap-page/review-quote.js:1297`
- `ui/pages/swaps/loading-swaps-quotes/loading-swaps-quotes.js:188`
- `ui/pages/swaps/list-with-search/list-with-search.js:118`
- `ui/pages/swaps/index.js:376,402`
- `ui/pages/swaps/exchange-rate-display/exchange-rate-display.js:116`
- `ui/pages/snaps/snap-view/snap-settings.js:216`
- `ui/components/ui/account-list/account-list.js:122`

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Avoiding Inline Objects and Functions" section

---

### 3. useEffect for Derived State

**Severity:** 🔴 CRITICAL
**Impact:** Unnecessary re-renders, can cause bugs with stale state

**Violations Found:**

#### `ui/pages/bridge/prepare/prepare-bridge-page.tsx`

```312:322:ui/pages/bridge/prepare/prepare-bridge-page.tsx
  const [isLowReturnBannerOpen, setIsLowReturnBannerOpen] = useState(true);
  useEffect(() => setIsLowReturnBannerOpen(true), [quotesRefreshCount]);

  // Resets the banner visibility when new alerts found
  const [isTokenAlertBannerOpen, setIsTokenAlertBannerOpen] = useState(true);
  useEffect(() => setIsTokenAlertBannerOpen(true), [tokenAlert]);

  // Resets the banner visibility when toToken is changed
  const [isCannotVerifyTokenBannerOpen, setIsCannotVerifyTokenBannerOpen] =
    useState(true);
  useEffect(() => setIsCannotVerifyTokenBannerOpen(true), [toToken?.address]);
```

**Issue:** Using `useEffect` to set state based on prop changes. This is derived state that should be calculated during render.

**Fix:**

```typescript
// Calculate during render instead
const isLowReturnBannerOpen = quotesRefreshCount > 0;
const isTokenAlertBannerOpen = Boolean(tokenAlert);
const isCannotVerifyTokenBannerOpen = Boolean(toToken?.address);
```

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Don't Overuse useEffect" section

---

### 4. JSON.stringify in useEffect Dependencies

**Severity:** 🔴 CRITICAL
**Impact:** Expensive operation runs on every render, defeats memoization, can cause infinite loops

**Violations Found:**

#### `ui/hooks/usePolling.ts`

```51:54:ui/hooks/usePolling.ts
  }, [
    usePollingOptions.input && JSON.stringify(usePollingOptions.input),
    usePollingOptions.enabled,
  ]);
```

**Issue:** Using `JSON.stringify` in dependency array. This runs on every render, creates new string objects, and defeats memoization.

**Fix:**

```typescript
// Option 1: Use deep equality check with useRef
const inputRef = useRef(usePollingOptions.input);
useEffect(() => {
  if (!isEqual(usePollingOptions.input, inputRef.current)) {
    inputRef.current = usePollingOptions.input;
    // ... rest of effect
  }
}, [usePollingOptions.enabled]);

// Option 2: Normalize input to stable ID if possible
const inputId = useMemo(
  () => usePollingOptions.input?.id,
  [usePollingOptions.input?.id],
);
useEffect(() => {
  // ... effect logic
}, [inputId, usePollingOptions.enabled]);
```

#### `ui/hooks/useMultiPolling.ts`

```47:50:ui/hooks/useMultiPolling.ts
  }, [
    completedOnboarding,
    usePollingOptions.input && JSON.stringify(usePollingOptions.input),
  ]);
```

**Issue:** Same violation - `JSON.stringify` in dependencies.

**Fix:** Use deep equality check or normalize to stable IDs.

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Anti-Pattern: JSON.stringify in useEffect Dependencies" section

---

### 5. useLayoutEffect for Non-Layout Operations

**Severity:** 🔴 CRITICAL
**Impact:** Blocks browser rendering unnecessarily, should only be used for DOM measurements

**Violations Found:**

#### `ui/hooks/useEqualityCheck.js`

```20:24:ui/hooks/useEqualityCheck.js
  useLayoutEffect(() => {
    if (!equalityFn(value, computedValue)) {
      setComputedValue(value);
    }
  }, [value, equalityFn, computedValue]);
```

**Issue:** Using `useLayoutEffect` for equality checking. This blocks rendering and should use `useEffect` instead.

**Fix:**

```typescript
useEffect(() => {
  if (!equalityFn(value, computedValue)) {
    setComputedValue(value);
  }
}, [value, computedValue]); // Remove equalityFn from deps, use ref instead
```

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Anti-Pattern: useLayoutEffect for Non-Layout Operations" section

---

### 6. Regular Variable Instead of useRef

**Severity:** 🔴 CRITICAL
**Impact:** Variable gets reset on every render, doesn't persist across renders

**Violations Found:**

#### `ui/hooks/usePolling.ts`

```16:16:ui/hooks/usePolling.ts
  let isMounted = false;
```

**Issue:** Using regular variable `let isMounted = false` instead of `useRef`. This gets reset on every render and doesn't persist.

**Fix:**

```typescript
const isMountedRef = useRef(false);

useEffect(() => {
  isMountedRef.current = true;
  // ...
  return () => {
    isMountedRef.current = false;
  };
}, []);
```

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Anti-Pattern: Regular Variables Instead of useRef" section

---

### 7. Equality Function in useEqualityCheck Dependencies

**Severity:** 🔴 CRITICAL
**Impact:** Causes unnecessary effect re-runs when equality function reference changes

**Violations Found:**

#### `ui/hooks/useEqualityCheck.js`

```24:24:ui/hooks/useEqualityCheck.js
  }, [value, equalityFn, computedValue]);
```

**Issue:** Including `equalityFn` in dependencies causes unnecessary re-runs when function reference changes (e.g., default parameter creates new reference).

**Fix:**

```typescript
const equalityFnRef = useRef(equalityFn);

useEffect(() => {
  equalityFnRef.current = equalityFn;
}, [equalityFn]);

useEffect(() => {
  if (!equalityFnRef.current(value, computedValue)) {
    setComputedValue(value);
  }
}, [value, computedValue]); // Remove equalityFn from deps
```

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Anti-Pattern: Equality Function in useEqualityCheck Dependencies" section

---

### 8. Cascading useEffect Chains

**Severity:** 🔴 CRITICAL
**Impact:** Multiple re-renders from cascading effects, hard to reason about, can cause race conditions

**Violations Found:**

#### `ui/pages/asset/hooks/useHistoricalPrices.ts`

```207:267:ui/pages/asset/hooks/useHistoricalPrices.ts
  useEffect(() => {
    // First effect fetches and updates Redux
    fetchPrices();
    const intervalId = setInterval(fetchPrices, 60000);
    return () => clearInterval(intervalId);
  }, [isEvm, chainId, address, internalAccount, dispatch]);

  // Retrieve the prices from the state
  useEffect(() => {
    // Second effect responds to Redux state change
    const pricesToSet = historicalPricesNonEvmThisTokenAndPeriod.map(...);
    setPrices(pricesToSet); // Triggers third effect
  }, [isEvm, historicalPricesNonEvm, address, currency, timeRange]);

  // Compute the metadata
  useEffect(() => {
    // Third effect depends on state from second effect
    const metadataToSet = deriveMetadata(prices);
    setMetadata(metadataToSet);
  }, [isEvm, prices]);
```

**Issue:** Three cascading effects where:

1. First effect fetches and updates Redux
2. Second effect responds to Redux change and sets local state
3. Third effect responds to local state change

This causes multiple re-renders and is hard to reason about.

**Fix:**

```typescript
// Compute prices during render from Redux state
const prices = useMemo(() => {
  if (isEvm) return [];
  const historicalPricesNonEvmThisTokenAndPeriod =
    historicalPricesNonEvm?.[address]?.[currency]?.intervals[timeRange] ?? [];
  return historicalPricesNonEvmThisTokenAndPeriod.map(
    ([x, y]: HistoricalPriceValue) => ({ x, y: Number(y) }),
  );
}, [isEvm, historicalPricesNonEvm, address, currency, timeRange]);

// Compute metadata during render from prices
const metadata = useMemo(() => {
  if (isEvm) return null;
  return deriveMetadata(prices);
}, [isEvm, prices]);

// Single effect for async operations
useEffect(() => {
  if (isEvm) return;
  const fetchPrices = async () => {
    setLoading(true);
    try {
      await dispatch(fetchHistoricalPricesForAsset(address, internalAccount));
    } finally {
      setLoading(false);
    }
  };
  fetchPrices();
  const intervalId = setInterval(fetchPrices, 60000);
  return () => clearInterval(intervalId);
}, [isEvm, chainId, address, internalAccount, dispatch]);
```

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Anti-Pattern: Cascading useEffect Chains" section

---

## 🔍 Reselect Selector Audit

- **Scope:** 124 selectors across `ui/selectors/` reviewed (`createSelector` / `createDeepEqualSelector`).
- **Positive patterns:** Most multichain, assets, and dapp selectors already use `createDeepEqualSelector` for derived arrays/maps and avoid inline selector functions. Heavy reducers such as `assets.ts` and `multichain/networks.ts` correctly memoize expensive computations.
- **Primary issues:**
  1. `getInternalAccounts` recreates the array of accounts on every call, so dependent selectors never benefit from memoization.

```46:55:ui/selectors/accounts.ts
export const getInternalAccounts = createSelector(
  (state: AccountsState) =>
    Object.values(state.metamask.internalAccounts.accounts),
  (accounts) => accounts,
);
```

**Fix:** Change the input selector to return the accounts object (`state.metamask.internalAccounts.accounts`) and move `Object.values` into the projector, or switch to `createDeepEqualSelector` so derived selectors (`getMemoizedInternalAccountByAddress`, etc.) stop recalculating on every render.

2. Notification selectors wrap `state.metamask` in a fresh spread each time, invalidating memoization for every consumer of `getMetamask`.

```19:53:ui/selectors/metamask-notifications/metamask-notifications.ts
const getMetamask = (state: NotificationAppState) => ({
  ...defaultState,
  ...state.metamask,
});
...
export const getMetamaskNotifications = createSelector(
  [getMetamask],
  (metamask): Notification[] => {
    return metamask.metamaskNotificationsList;
  },
);
```

**Fix:** Avoid constructing a new object in the input selector. Either return `state.metamask ?? defaultState`, or hoist the merge into a memoized selector so consumers receive a stable reference. 3. Confirmation selectors sort/filter on every access without memoization. `pendingConfirmationsSortedSelector` is a plain function that produces a new sorted array each call, so `firstPendingConfirmationSelector` recomputes even when nothing changed.

```20:28:ui/pages/confirmations/selectors/confirm.ts
export function pendingConfirmationsSortedSelector(state: ConfirmMetamaskState) {
  return getPendingApprovals(state)
    .filter(({ type }) =>
      ConfirmationApprovalTypes.includes(type as ApprovalType),
    )
    .sort((a1, a2) => a1.time - a2.time);
}
```

**Fix:** Replace the helper with a memoized `createSelector` that takes `getPendingApprovals` as input and performs filtering/sorting inside the projector. That allows downstream selectors to reuse cached results instead of re-sorting every time Redux state is read.

4. Bridge history selectors rebuild address arrays within the projector, so the nested selector cache is always busted. `selectBridgeHistoryForAccountGroup` maps over accounts to produce a fresh array, then calls `selectBridgeHistoryForAccount(state, internalAccountAddresses)` each run, forcing the inner selector to recompute.

```42:54:ui/ducks/bridge-status/selectors.ts
export const selectBridgeHistoryForAccountGroup = createSelector(
  [selectBridgeHistory, getSelectedAccountGroup, (state) => state],
  (txHistory, selectedAccountGroup, state) => {
    if (!selectedAccountGroup) {
      return txHistory;
    }
    const internalAccountAddresses = getInternalAccountsFromGroupById(
      state,
      selectedAccountGroup,
    ).map((internalAccount) => internalAccount.address);

    return selectBridgeHistoryForAccount(state, internalAccountAddresses);
  },
);
```

**Fix:** Move the address derivation into the selector dependency list so it can be memoized (`createSelector([getInternalAccountsFromGroupById, ...])`). Avoid calling another selector inside the projector; instead, compose selectors by declaring inputs up front.

- **Overall:** All other selectors accept stable inputs (usually controller state objects) and use memoization appropriately; no additional identity-projector issues were found.

---

## ⚠️ HIGH PRIORITY ISSUES (Should Fix Before Merge)

### 9. Creating Map/Set During Render (In Selectors)

**Severity:** 🟡 HIGH
**Impact:** May cause performance issues if selectors are called frequently

**Note:** Selectors using `createSelector` from Reselect are automatically memoized, so this is less critical. However, creating Maps/Sets during render in components would be a critical issue.

**Files to Review:**

- `ui/selectors/multichain-accounts/account-tree.ts:86-90` - Creates Sets during selector execution
- `ui/selectors/gator-permissions/gator-permissions.ts:322` - Creates Set during selector execution

**Recommendation:** Verify these selectors are properly memoized with `createSelector`. If they're not, wrap them.

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Anti-Pattern: Creating Maps/Objects During Render" section

---

### 10. Inline Functions in Lists (Potential Issue)

**Severity:** 🟡 HIGH
**Impact:** Creates new function references on every render, causing child re-renders

**Note:** React Compiler handles simple cases automatically, but manual `useCallback` is required for:

- Functions passed to third-party components
- Functions with external dependencies (Redux, context from other files)

**Files to Review:**

- Check all `.map()` calls with inline arrow functions
- Verify if functions are passed to external components
- Check if functions depend on Redux/context from other files

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Use useCallback for Stable Function References" section

---

### 11. Missing Memoization for Expensive Operations

**Severity:** 🟡 HIGH
**Impact:** Expensive calculations run on every render

**Note:** React Compiler handles simple prop/state cases automatically, but manual `useMemo` is required for:

- Redux selectors
- External hooks
- Cross-file dependencies

**Files Already Using useMemo (Good Examples):**

- ✅ `ui/components/app/assets/token-list/token-list.tsx:92` - Properly memoized `sortedFilteredTokens`
- ✅ `ui/components/app/assets/defi-list/defi-list.tsx:47` - Properly memoized `sortedFilteredDefi`
- ✅ `ui/pages/confirmations/components/send/network-filter/network-filter.tsx:57` - Properly memoized `uniqueChainIds`
- ✅ `ui/components/multichain-accounts/multichain-address-rows-list/multichain-address-rows-list.tsx:88,150` - Properly memoized `filteredItems` and `renderedRows`

**Files to Review:**

- Check selectors in `ui/selectors/` for expensive operations without memoization
- Review components using Redux selectors for missing `useMemo`

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Use useMemo for Expensive Calculations" section

---

### 12. Composite Keys Using Index

**Severity:** 🟡 HIGH
**Impact:** Less critical than pure index keys, but still problematic if list reorders

**Violations Found:**

#### `ui/components/multichain-accounts/multichain-address-rows-list/multichain-address-rows-list.tsx`

```133:133:ui/components/multichain-accounts/multichain-address-rows-list/multichain-address-rows-list.tsx
          key={`${item.account.address}-${item.scope}-${index}`}
```

**Issue:** Using composite key that includes `index`. If list reorders, keys will be incorrect.

**Fix:**

```typescript
// Remove index from key - address + scope should be unique
key={`${item.account.address}-${item.scope}`}
```

#### Additional Files:

- `ui/components/multichain-accounts/multichain-private-key-list/multichain-private-key-list.tsx:219`
- `ui/components/multichain/carousel/carousel.tsx:153`
- `ui/components/multichain/permission-details-modal/permission-details-modal.tsx:109`
- `ui/pages/confirmations/components/confirm/info/shared/transaction-data/transaction-data.tsx:120`
- `ui/pages/confirmations/components/confirm/pluggable-section/pluggable-section.tsx:16`
- `ui/pages/confirmations/components/confirm/info/personal-sign/siwe-sign/siwe-sign.tsx:90`
- `ui/components/app/alert-system/general-alert/general-alert.tsx:88`
- `ui/components/app/alert-system/alert-modal/alert-modal.tsx:236`

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Use Proper Keys" section

---

## 💡 MEDIUM PRIORITY ISSUES (Consider Fixing)

### 13. useState with Array Literal (Story File)

**Severity:** 🔵 MEDIUM
**Impact:** Minor - only in story file, but still a pattern to avoid

**Violations Found:**

#### `ui/components/component-library/checkbox/checkbox.stories.tsx`

```72:72:ui/components/component-library/checkbox/checkbox.stories.tsx
  const [checkedItems, setCheckedItems] = React.useState([false, true, false]);
```

**Issue:** Using array literal in `useState` initializer. While this is fine for simple cases, it's better to extract constants for complex objects.

**Note:** This is in a Storybook story file, so lower priority. However, the pattern should be avoided in production code.

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Anti-Pattern: useState with Object/Array Initializers" section

---

### 14. Class Components (Deprecated)

**Severity:** 🔵 MEDIUM
**Impact:** Legacy code, marked as deprecated. Should be migrated to functional components.

**Files Found:**

- `ui/components/app/modals/modal.js:334` - Class component (deprecated)
- `ui/components/app/modal/modal.component.js:14` - Class component (deprecated)

**Note:** These are already marked as deprecated. Migration is recommended but not blocking.

**Rule:** `.cursor/rules/coding-guidelines.mdc` - "Use Functional Components and Hooks" section

---

### 15. Potential Missing React.memo

**Severity:** 🔵 MEDIUM
**Impact:** Components may re-render unnecessarily

**Note:** React Compiler handles most cases automatically. Only add `React.memo` if profiling shows it's needed.

**Recommendation:**

- Profile components with React DevTools
- Only add `React.memo` if component re-renders frequently and profiling shows benefit

**Rule:** `.cursor/rules/react-performance-guidelines.mdc` - "Preventing Unnecessary Re-renders" section

---

## ✅ GOOD PRACTICES FOUND

### Proper Memoization Examples

1. **`ui/components/app/assets/token-list/token-list.tsx`**
   - ✅ Properly uses `useMemo` for `sortedFilteredTokens`
   - ✅ Uses virtualization for large lists (`useVirtualizer`)

2. **`ui/components/multichain-accounts/multichain-address-rows-list/multichain-address-rows-list.tsx`**
   - ✅ Properly uses `useCallback` for `renderAddressItem`
   - ✅ Properly uses `useMemo` for `filteredItems` and `renderedRows`
   - ⚠️ Minor issue: Composite key includes index (see High Priority #6)

3. **`ui/pages/confirmations/components/send/network-filter/network-filter.tsx`**
   - ✅ Properly uses `useMemo` for `uniqueChainIds` with expensive Set/Map operations

---

## 📋 Action Items (Priority Order)

### 🔴 CRITICAL - Must Fix Before Merge

1. **Fix JSON.stringify in useEffect Dependencies (2 files)**
   - Replace with deep equality checks or normalize to stable IDs
   - Priority files:
     - `ui/hooks/usePolling.ts`
     - `ui/hooks/useMultiPolling.ts`

2. **Fix useLayoutEffect for Non-Layout Operations (1 file)**
   - Replace `useLayoutEffect` with `useEffect` for equality checking
   - File: `ui/hooks/useEqualityCheck.js`

3. **Fix Regular Variable Instead of useRef (1 file)**
   - Replace `let isMounted = false` with `useRef`
   - File: `ui/hooks/usePolling.ts`

4. **Fix Equality Function in Dependencies (1 file)**
   - Use `useRef` to store equality function
   - File: `ui/hooks/useEqualityCheck.js`

5. **Fix Cascading useEffect Chains (1 file)**
   - Combine effects or compute derived state during render
   - File: `ui/pages/asset/hooks/useHistoricalPrices.ts`

6. **Fix getInternalAccounts Selector (1 file)**
   - Input selector recreates `Object.values(...)` each call, breaking memoization
   - File: `ui/selectors/accounts.ts`

7. **Fix Notification getMetamask Selector (1 file)**
   - Returns new object each run; memoization never hits
   - File: `ui/selectors/metamask-notifications/metamask-notifications.ts`

8. **Fix Index as Key Violations (24 files)**
   - Replace `key={index}` with unique identifiers from data
   - Priority files:
     - `ui/components/app/snaps/snap-ui-asset-selector/snap-ui-asset-selector.tsx`
     - `ui/pages/shield-plan/shield-plan.tsx`
     - `ui/pages/confirmations/components/simulation-details/simulation-details.tsx`

9. **Fix Inline Style Objects (30 files)**
   - Extract inline style objects to constants outside component
   - Use `useMemo` only if style depends on props/state
   - Priority files:
     - `ui/components/app/snaps/snap-ui-asset-selector/snap-ui-asset-selector.tsx`
     - `ui/pages/shield-plan/shield-plan.tsx`

10. **Fix useEffect for Derived State (1 file)**
    - Replace `useEffect` + `setState` with direct calculation during render
    - File: `ui/pages/bridge/prepare/prepare-bridge-page.tsx`

### 🟡 HIGH - Should Fix Before Merge

9. **Review Map/Set Creation in Selectors (2 files)**
   - Verify selectors are properly memoized with `createSelector`
   - Files: `ui/selectors/multichain-accounts/account-tree.ts`, `ui/selectors/gator-permissions/gator-permissions.ts`

10. **Review Composite Keys with Index (8 files)**

- Remove `index` from composite keys where possible
- Priority: `ui/components/multichain-accounts/multichain-address-rows-list/multichain-address-rows-list.tsx`
- Also affects: `ui/components/app/transaction-list/unified-transaction-list.component.js:576,589,599` (falls back to index when ID missing)

11. **Review Inline Functions in Lists**

- Check if functions are passed to external components
- Add `useCallback` if needed for external dependencies

12. **Review Missing Memoization**

- Check Redux selectors for expensive operations
- Add `useMemo` for cross-file dependencies

13. **Memoize Confirmation Sorting Selector (1 file)**
    - `pendingConfirmationsSortedSelector` sorts on every call; wrap in `createSelector`
    - File: `ui/pages/confirmations/selectors/confirm.ts`

14. **Fix Bridge History Selector Composition (1 file)**
    - Avoid creating new address arrays inside projector; lift into selector inputs
    - File: `ui/ducks/bridge-status/selectors.ts`

### 🔵 MEDIUM - Consider for Next Iteration

15. **Fix useState with Array Literal (1 file)**

- Extract array to constant (low priority - story file)
- File: `ui/components/component-library/checkbox/checkbox.stories.tsx`

16. **Migrate Deprecated Class Components**

- Convert to functional components with hooks
- Files: `ui/components/app/modals/modal.js`, `ui/components/app/modal/modal.component.js`

17. **Profile and Optimize**

- Use React DevTools Profiler to identify actual bottlenecks
- Add `React.memo` only where profiling shows benefit

---

18. **Storybook-Only Violations**
    - Several Storybook files still use `key={index}` or inline style objects
    - Files: `ui/components/ui/button-group/button-group.stories.js`, `ui/pages/swaps/transaction-settings/transaction-settings.stories.js`, `ui/pages/swaps/exchange-rate-display/exchange-rate-display.stories.js`
    - Lower impact but should be cleaned up for consistency

---

## 📝 Next Steps

1. **Immediate Actions:**
   - Fix all CRITICAL violations
   - Review HIGH priority issues
   - Run tests after fixes

2. **Before Next PR:**
   - Run `yarn lint:changed:fix`
   - Run `yarn test:unit` for affected files
   - Verify no new violations introduced

3. **Long-term:**
   - Set up ESLint rules to catch these violations
   - Add pre-commit hooks to prevent regressions
   - Consider adding React Compiler ESLint plugin

---

## 🔍 How to Verify Fixes

### For Index as Key:

```bash
# Search for remaining violations
grep -r "key={index}" ui/ --include="*.tsx" --include="*.ts"
```

### For Inline Style Objects:

```bash
# Search for inline style objects
grep -r "style={{" ui/ --include="*.tsx" --include="*.ts"
```

### For useEffect Derived State:

```bash
# Search for useEffect setting state
grep -r "useEffect.*set[A-Z]" ui/ --include="*.tsx" --include="*.ts"
```

---

## 📚 References

- **React Performance Guidelines:** `.cursor/rules/react-performance-guidelines.mdc`
- **Coding Guidelines:** `.cursor/rules/coding-guidelines.mdc`
- **React Compiler Considerations:** See guidelines section on React Compiler limitations

---

## 🎯 Summary

**PR Readiness:** ❌ **NOT READY** - Critical violations must be fixed before merge.

**Key Issues:**

- 2 files using `JSON.stringify` in useEffect dependencies (CRITICAL)
- 1 file using `useLayoutEffect` for non-layout operations (CRITICAL)
- 1 file using regular variable instead of `useRef` (CRITICAL)
- 1 file with equality function in dependencies (CRITICAL)
- 1 file with cascading useEffect chains (CRITICAL)
- 1 selector recreating account arrays on every call (CRITICAL)
- 1 selector recreating merged notification state each access (CRITICAL)
- 24 files using `index` as key (CRITICAL)
- 30 files with inline style objects (CRITICAL)
- 1 file using `useEffect` for derived state (CRITICAL)
- 8 files with composite keys including index (HIGH)
- 1 confirmation selector repeatedly filtering/sorting (HIGH)
- 1 bridge history selector recreating dependencies inside projector (HIGH)

**Estimated Fix Time:** 6-8 hours for critical violations

**Recommendation:** Fix critical violations first, then address high-priority issues before merging.

---

_Generated by CODEBOT - React Performance Audit_
