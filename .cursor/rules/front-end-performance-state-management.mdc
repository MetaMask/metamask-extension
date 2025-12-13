---
description: Front-End Performance Rules - State Management
globs: *selector*.ts,*selector*.js,*reducer*.ts,*reducer*.js,*ducks*.ts,*ducks*.js,*slice*.ts,*slice*.js
alwaysApply: false
---

# Front-End Performance Rules: State Management

This file covers Redux and state management optimization rules including reducer best practices, selector optimization, state normalization, and batching updates.

### Rule: Never Mutate State in Reducers

**DO:**
- Always create new objects/arrays for state updates
- Use spread operators or immutability helpers
- Use Redux Toolkit (uses Immer internally)

**DON'T:**
- Mutate state directly (most common cause of Redux bugs)

**Example - WRONG:**
```typescript
function todosReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_TODO':
      state.push(action.payload); // Mutates state!
      return state;
    default:
      return state;
  }
}
```

**Example - CORRECT:**
```typescript
function todosReducer(state = [], action) {
  switch (action.type) {
    case 'ADD_TODO':
      return [...state, action.payload];
    default:
      return state;
  }
}
```

### Rule: Reducers Must Not Have Side Effects

**DO:**
- Keep reducers pure (only depend on state and action arguments)
- Move side effects to action creators or middleware

**DON'T:**
- Include API calls, random values, or date calculations in reducers

**Example - WRONG:**
```typescript
function myReducer(state = initialState, action) {
  switch (action.type) {
    case 'FETCH_DATA':
      // Side effect: API call in reducer!
      fetch('/api/data')
        .then((response) => response.json())
        .then((data) => {
          state.data = data; // Also mutates state!
        });
      return state;
    default:
      return state;
  }
}
```

**Example - CORRECT:**
```typescript
function myReducer(state = initialState, action) {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
      };
    default:
      return state;
  }
}

// Side effect in action creator
function fetchData() {
  return (dispatch) => {
    fetch('/api/data')
      .then((response) => response.json())
      .then((data) => {
        dispatch({ type: 'SET_DATA', payload: data });
      });
  };
}
```

### Rule: Do Not Put Non-Serializable Values in State

**DO:**
- Store only plain objects, arrays, and primitives
- Keep state serializable for time-travel debugging and persistence

**DON'T:**
- Store Promises, Symbols, Maps/Sets, functions, or class instances

**Example - WRONG:**
```typescript
const initialState = {
  data: new Map(), // Map is not serializable
  callback: () => {}, // Function is not serializable
  promise: fetch('/api'), // Promise is not serializable
};
```

**Example - CORRECT:**
```typescript
const initialState = {
  data: {}, // Plain object
  items: [], // Plain array
  count: 0, // Primitive
};
```

### Rule: Batch Actions When Possible

**DO:**
- Combine multiple related actions into a single action when possible
- Reduces number of reducer calls and re-renders

**DON'T:**
- Dispatch multiple separate actions for related state updates

**Example - WRONG:**
```typescript
function updateUserAndPosts(user, posts) {
  return (dispatch) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
    dispatch({ type: 'UPDATE_POSTS', payload: posts });
  };
}
```

**Example - CORRECT:**
```typescript
function updateUserAndPosts(user, posts) {
  return {
    type: 'UPDATE_USER_AND_POSTS',
    payload: { user, posts },
  };
}

// Reducer handling combined action
function rootReducer(state = initialState, action) {
  switch (action.type) {
    case 'UPDATE_USER_AND_POSTS':
      return {
        ...state,
        user: action.payload.user,
        posts: action.payload.posts,
      };
    default:
      return state;
  }
}
```

### Rule: Normalize State Shape

**DO:**
- Use normalized state with `byId` and `allIds` patterns for complex data
- Avoid deeply nested structures
- Makes updates more efficient and prevents duplication

**DON'T:**
- Store deeply nested relational data

**Example - WRONG:**
```typescript
const state = {
  users: {
    byId: {
      user_1a2b: {
        id: 'user_1a2b',
        name: 'Alice',
        posts: [{ id: 'post_1a2b', title: 'Post 1' }],
      },
    },
  },
};
```

**Example - CORRECT:**
```typescript
const normalizedState = {
  users: {
    byId: {
      user_1a2b: { id: 'user_1a2b', name: 'Alice', postIds: ['post_1a2b'] },
    },
    allIds: ['user_1a2b'],
  },
  posts: {
    byId: {
      post_1a2b: { id: 'post_1a2b', title: 'Post 1' },
    },
    allIds: ['post_1a2b'],
  },
};
```

### Rule: Use Immer for Deep Updates

**DO:**
- Use Redux Toolkit (uses Immer internally)
- Write "mutating" logic that's actually immutable
- Simplifies complex state updates

**Example - CORRECT: Using Redux Toolkit with Immer**
```typescript
import { createSlice } from '@reduxjs/toolkit';

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    byId: {},
    allIds: [],
  },
  reducers: {
    addUser: (state, action) => {
      // Looks like mutation, but Immer makes it immutable
      const { id, name } = action.payload;
      state.byId[id] = { id, name };
      state.allIds.push(id);
    },
    updateUser: (state, action) => {
      const { id, name } = action.payload;
      // Direct "mutation" that's actually immutable
      state.byId[id].name = name;
    },
  },
});
```

### Rule: Batch State Updates

**DO:**
- Combine multiple state updates into a single update when possible
- Reduces number of re-renders

**DON'T:**
- Update state multiple times separately for related changes

**Example - WRONG:**
```typescript
const updateMultipleTokens = (updates: Array<{ tokenId: string; balance: string }>) => {
  updates.forEach(({ tokenId, balance }) => {
    setState(prev => ({
      ...prev,
      tokens: {
        ...prev.tokens,
        byId: {
          ...prev.tokens.byId,
          [tokenId]: { ...prev.tokens.byId[tokenId], balance },
        },
      },
    }));
  }); // Multiple re-renders!
};
```

**Example - CORRECT:**
```typescript
const updateMultipleTokens = (updates: Array<{ tokenId: string; balance: string }>) => {
  setState(prev => ({
    ...prev,
    tokens: {
      ...prev.tokens,
      byId: {
        ...prev.tokens.byId,
        ...updates.reduce((acc, { tokenId, balance }) => {
          acc[tokenId] = { ...prev.tokens.byId[tokenId], balance };
          return acc;
        }, {} as Record<string, Token>),
      },
    },
  })); // Single re-render!
};
```

### Rule: Avoid Identity Functions as Output Selectors

**DO:**
- Always transform data in output selector
- Use createDeepEqualSelector if you need deep equality

**DON'T:**
- Use identity functions in createSelector (provides no memoization benefit)

**Example - WRONG:**
```typescript
export const getInternalAccounts = createSelector(
  (state: AccountsState) =>
    Object.values(state.metamask.internalAccounts.accounts),
  (accounts) => accounts, // Identity function - no transformation!
);
```

**Example - CORRECT:**
```typescript
export const getInternalAccounts = createSelector(
  (state: AccountsState) => state.metamask.internalAccounts.accounts,
  (accountsObject) => {
    // Only create array when accountsObject actually changes
    const accounts = Object.values(accountsObject);
    return accounts;
  },
);

// OR: Use createDeepEqualSelector if you need deep equality
export const getInternalAccounts = createDeepEqualSelector(
  (state: AccountsState) => state.metamask.internalAccounts.accounts,
  (accountsObject) => Object.values(accountsObject),
);
```

### Rule: Select Only Needed Properties in Selectors

**DO:**
- Select only the specific properties needed from state
- Use granular input selectors

**DON'T:**
- Return entire state objects or large state slices

**Example - WRONG:**
```typescript
const selectAccountTreeStateForBalances = createSelector(
  (state: BalanceCalculationState) => state.metamask,
  (metamaskState) => metamaskState, // Returns entire metamask state!
);
```

**Example - CORRECT:**
```typescript
const selectAccountTreeStateForBalances = createSelector(
  [
    (state: BalanceCalculationState) => state.metamask.accountTree,
    (state: BalanceCalculationState) => state.metamask.accountGroupsMetadata,
    (state: BalanceCalculationState) => state.metamask.accountWalletsMetadata,
  ],
  (accountTree, accountGroupsMetadata, accountWalletsMetadata) => ({
    accountTree: accountTree ?? EMPTY_ACCOUNT_TREE,
    accountGroupsMetadata: accountGroupsMetadata ?? EMPTY_OBJECT,
    accountWalletsMetadata: accountWalletsMetadata ?? EMPTY_OBJECT,
  }),
);
```

### Rule: Use Granular Input Selectors

**DO:**
- Create granular input selectors for composition
- Build complex selectors from simple ones

**DON'T:**
- Access state directly with broad selectors (can't be composed efficiently)

**Example - WRONG:**
```typescript
const selectExpensiveComputation = createSelector(
  (state) => state.metamask, // Too broad
  (metamask) => {
    // Expensive computation using many properties
    return metamask.tokens
      .filter(t => t.balance > 0)
      .map(t => ({ ...t, computed: expensiveTransform(t) }))
      .sort((a, b) => b.balance - a.balance);
  },
);
```

**Example - CORRECT:**
```typescript
const selectTokens = (state) => state.metamask.tokens;
const selectTokenBalances = (state) => state.metamask.tokenBalances;

const selectExpensiveComputation = createSelector(
  [selectTokens, selectTokenBalances],
  (tokens, balances) => {
    // Only recomputes when tokens or balances change
    return tokens
      .filter(t => balances[t.address] > 0)
      .map(t => ({ ...t, computed: expensiveTransform(t) }))
      .sort((a, b) => balances[b.address] - balances[a.address]);
  },
);
```

### Rule: Use createDeepEqualSelector Sparingly

**DO:**
- Use createSelector by default
- Use createDeepEqualSelector only when inputs keep the same reference but nested values change
- Document why you chose createDeepEqualSelector

**DON'T:**
- Use createDeepEqualSelector for all selectors (isEqual runs on every evaluation, expensive for large payloads)

**Context:** updateMetamaskState applies background patches to Redux using Immer. Immer guarantees structural sharing: only the objects along the mutated path receive new references, while untouched branches retain their identity.

**When to use createSelector:**
- Works best when input selectors point directly at the branch that changes
- Most selectors can rely on reference changes produced by reducers

**When to use createDeepEqualSelector:**
- When patches touch other controllers but Redux still replaces the parent object you depend on
- When rebuilding complex aggregates (sorting, merging, normalizing) that always produce fresh structures but semantic contents often stay the same

**Example - CORRECT: createSelector (most cases)**
```typescript
export const getInternalAccountByAddress = createSelector(
  (state) => state.metamask.internalAccounts.accounts,
  (_state, address: string) => address,
  (accounts, address) => {
    return Object.values(accounts).find((account) =>
      isEqualCaseInsensitive(account.address, address),
    );
  },
);
```

**Example - CORRECT: createDeepEqualSelector (when needed)**
```typescript
export const getWalletsWithAccounts = createDeepEqualSelector(
  getMetaMaskAccountsOrdered,
  getAccountTree,
  getOrderedConnectedAccountsForActiveTab,
  getSelectedInternalAccount,
  getPinnedAccountsList,
  getHiddenAccountsList,
  (
    internalAccounts,
    accountTree,
    connectedAccounts,
    selectedAccount,
    pinnedAccounts,
    hiddenAccounts,
  ) => {
    return createConsolidatedWallets(
      internalAccounts,
      accountTree,
      connectedAccounts,
      selectedAccount,
      pinnedAccounts,
      hiddenAccounts,
      (groupAccounts) => groupAccounts,
    );
  },
);
```

**Guard rails:**
- If a deep selector becomes hot, profile it with React DevTools before shipping
- Document why you chose createDeepEqualSelector so future contributors can revisit the trade-off

### Rule: Combine Related Selectors into One Memoized Selector

**DO:**
- Combine multiple useSelector calls into a single memoized selector
- Reduce redundant subscriptions and re-renders

**DON'T:**
- Call multiple selectors in sequence (each creates separate subscription)

**Example - WRONG:**
```typescript
const {
  activeQuote,
  isQuoteGoingToRefresh,
  isLoading: isQuoteLoading,
} = useSelector(getBridgeQuotes);
const currency = useSelector(getCurrentCurrency);
const { insufficientBal } = useSelector(getQuoteRequest);
const fromChain = useSelector(getFromChain);
// ... 11+ more selectors
```

**Example - CORRECT:**
```typescript
const selectBridgeQuoteCardView = createSelector(
  [
    getBridgeQuotes,
    getCurrentCurrency,
    getQuoteRequest,
    getFromChain,
    getIntlLocale,
    getIsStxEnabled,
    getFromToken,
    getToToken,
    getSlippage,
    getIsSolanaSwap,
    getIsToOrFromNonEvm,
    getPriceImpactThresholds,
  ],
  (
    bridgeQuotes,
    currency,
    quoteRequest,
    fromChain,
    locale,
    isStxEnabled,
    fromToken,
    toToken,
    slippage,
    isSolanaSwap,
    isToOrFromNonEvm,
    priceImpactThresholds,
  ) => ({
    activeQuote: bridgeQuotes.activeQuote,
    isQuoteGoingToRefresh: bridgeQuotes.isQuoteGoingToRefresh,
    isQuoteLoading: bridgeQuotes.isLoading,
    currency,
    insufficientBal: quoteRequest.insufficientBal,
    fromChain,
    locale,
    isStxEnabled,
    fromToken,
    toToken,
    slippage,
    isSolanaSwap,
    isToOrFromNonEvm,
    priceImpactThresholds,
  }),
);

const MultichainBridgeQuoteCard = () => {
  const {
    activeQuote,
    isQuoteGoingToRefresh,
    isQuoteLoading,
    currency,
    insufficientBal,
    fromChain,
    locale,
    isStxEnabled,
    fromToken,
    toToken,
    slippage,
    isSolanaSwap,
    isToOrFromNonEvm,
    priceImpactThresholds,
  } = useSelector(selectBridgeQuoteCardView);
};
```

**Benefits:**
- Only one subscription; component rerenders once per state change instead of once per selector
- Shared memoization ensures combined output only changes when at least one dependency does
- Centralizes domain-specific shaping logic in selector layer

### Rule: Avoid Inline Selector Functions in useSelector

**DO:**
- Extract selector functions to memoized selectors
- Use useCallback for selector functions if needed

**DON'T:**
- Create selector functions inline in useSelector (creates new reference every render)

**Example - WRONG:**
```typescript
const Connections = () => {
  const subjectMetadata = useSelector((state) => {
    return getConnectedSitesList(state);
  });

  const connectedAccountGroups = useSelector((state) => {
    if (!showConnectionStatus || permittedAddresses.length === 0) {
      return [];
    }
    return getAccountGroupsByAddress(state, permittedAddresses);
  });
};
```

**Example - CORRECT:**
```typescript
// Option 1: Extract to memoized selector (preferred)
const selectConnectedAccountGroups = createSelector(
  [
    (state) => state,
    (_state, showConnectionStatus: boolean) => showConnectionStatus,
    (_state, _showConnectionStatus, permittedAddresses: string[]) => permittedAddresses,
  ],
  (state, showConnectionStatus, permittedAddresses) => {
    if (!showConnectionStatus || permittedAddresses.length === 0) {
      return [];
    }
    return getAccountGroupsByAddress(state, permittedAddresses);
  },
);

const Connections = () => {
  const subjectMetadata = useSelector(getConnectedSitesList);
  const connectedAccountGroups = useSelector((state) =>
    selectConnectedAccountGroups(state, showConnectionStatus, permittedAddresses)
  );
};

// Option 2: Use useCallback for selector function
const Connections = () => {
  const selectConnectedGroups = useCallback(
    (state) => {
      if (!showConnectionStatus || permittedAddresses.length === 0) {
        return [];
      }
      return getAccountGroupsByAddress(state, permittedAddresses);
    },
    [showConnectionStatus, permittedAddresses]
  );

  const connectedAccountGroups = useSelector(selectConnectedGroups);
};
```

### Rule: Avoid Multiple useSelector Calls for Same State Slice

**DO:**
- Select entire slice once or create single memoized selector

**DON'T:**
- Create multiple useSelector calls for the same state slice (creates unnecessary subscriptions)

**Example - WRONG:**
```typescript
const Routes = () => {
  const alertOpen = useAppSelector((state) => state.appState.alertOpen);
  const alertMessage = useAppSelector((state) => state.appState.alertMessage);
  const isLoading = useAppSelector((state) => state.appState.isLoading);
  const loadingMessage = useAppSelector((state) => state.appState.loadingMessage);
  // ... 20+ more selectors from same slice
};
```

**Example - CORRECT:**
```typescript
// Option 1: Select entire slice once
const Routes = () => {
  const appState = useAppSelector((state) => state.appState);
  const { alertOpen, alertMessage, isLoading, loadingMessage } = appState;
};

// Option 2: Create single memoized selector
const selectAppState = (state) => state.appState;
const selectAppStateSlice = createSelector(
  [selectAppState],
  (appState) => ({
    alertOpen: appState.alertOpen,
    alertMessage: appState.alertMessage,
    isLoading: appState.isLoading,
    loadingMessage: appState.loadingMessage,
    // ... other properties
  })
);

const Routes = () => {
  const appStateSlice = useAppSelector(selectAppStateSlice);
};
```

### Rule: Avoid Inefficient Use of Object.values() and Object.keys() in Selectors

**DO:**
- Store arrays alongside objects in state if frequently accessed
- Properly memoize object-to-array conversion
- Use createDeepEqualSelector for deeply nested structures
- Normalize state structure to avoid conversions

**DON'T:**
- Use Object.values() or Object.keys() in selectors without proper memoization (creates new array references on every call)

**Why:** When state is stored as objects keyed by ID, selectors frequently use Object.values() to convert to arrays. This creates new array references on every selector evaluation, even when underlying data hasn't changed, causing unnecessary re-renders.

**Example - WRONG:**
```typescript
export const getInternalAccounts = createSelector(
  (state: AccountsState) =>
    Object.values(state.metamask.internalAccounts.accounts), // New array every time!
  (accounts) => accounts, // Identity function doesn't help
);
```

**Solution 1: Store Arrays Alongside Objects**
```typescript
interface AccountsState {
  accounts: {
    byId: Record<string, Account>;
    allIds: string[]; // Maintained alongside byId
  };
}

// Selector uses pre-computed array
const selectAllAccounts = createSelector(
  (state) => state.accounts.allIds,
  (state) => state.accounts.byId,
  (allIds, byId) => allIds.map((id) => byId[id]),
);
```

**Solution 2: Proper Memoization**
```typescript
// Base selector returns the object
const selectAccountsObject = (state: AccountsState) =>
  state.metamask.internalAccounts.accounts;

// Memoized conversion selector
export const getInternalAccounts = createSelector(
  selectAccountsObject,
  (accountsObject) => {
    // Only creates array when accountsObject reference changes
    return Object.values(accountsObject);
  },
);
```

**Solution 3: Normalize State Structure**
```typescript
// Before: Nested objects
{
  metamask: {
    allNfts: {
      [account]: {
        [chainId]: Nft[]
      }
    }
  }
}

// After: Normalized with indexes
{
  metamask: {
    nfts: {
      byId: { [nftId]: Nft },
      allIds: string[],
      byAccountId: { [accountId]: string[] },
      byChainId: { [chainId]: string[] },
    }
  }
}

// Selector uses indexes instead of Object.values()
const selectNftsByAccount = createSelector(
  (state, accountId) => state.metamask.nfts.byAccountId[accountId] ?? [],
  (state) => state.metamask.nfts.byId,
  (nftIds, nftsById) => nftIds.map((id) => nftsById[id]),
);
```

### Rule: Avoid Deep Property Access in Selectors

**DO:**
- Use granular input selectors for each level
- Compose selectors from base selectors

**DON'T:**
- Access deeply nested properties directly (fragile to state structure changes)

**Example - WRONG:**
```typescript
const selectGroupAccounts = createSelector(
  (state, walletId, groupId) =>
    state.metamask.accountTree.wallets[walletId]?.groups[groupId]?.accounts ?? [],
  (accounts) => accounts,
);
```

**Example - CORRECT:**
```typescript
// Base selectors for each level
const selectAccountTree = (state) => state.metamask.accountTree;
const selectWallet = createSelector(
  [selectAccountTree, (_, walletId) => walletId],
  (accountTree, walletId) => accountTree.wallets[walletId],
);
const selectGroup = createSelector(
  [selectWallet, (_, __, groupId) => groupId],
  (wallet, groupId) => wallet?.groups[groupId],
);

// Composed selector
const selectGroupAccounts = createSelector(
  [selectGroup],
  (group) => group?.accounts ?? [],
);
```

### Rule: Avoid Repeated Object Traversal in Selectors

**DO:**
- Use shared base selector and composition
- Build derived selectors from base selectors

**DON'T:**
- Traverse the same nested object structure independently in multiple selectors

**Example - WRONG:**
```typescript
const selectAllWallets = createSelector(
  (state) => state.metamask.accountTree.wallets,
  (wallets) => Object.values(wallets),
);

const selectAllGroups = createSelector(
  (state) => state.metamask.accountTree.wallets,
  (wallets) => {
    return Object.values(wallets).flatMap((wallet) =>
      Object.values(wallet.groups),
    );
  },
);

const selectAllAccounts = createSelector(
  (state) => state.metamask.accountTree.wallets,
  (wallets) => {
    return Object.values(wallets).flatMap((wallet) =>
      Object.values(wallet.groups).flatMap((group) => group.accounts),
    );
  },
);
```

**Example - CORRECT:**
```typescript
// Single traversal, multiple derived selectors
const selectWalletsObject = (state) => state.metamask.accountTree.wallets;

const selectAllWallets = createSelector([selectWalletsObject], (wallets) =>
  Object.values(wallets),
);

const selectAllGroups = createSelector([selectAllWallets], (wallets) =>
  wallets.flatMap((wallet) => Object.values(wallet.groups)),
);

const selectAllAccounts = createSelector([selectAllGroups], (groups) =>
  groups.flatMap((group) => group.accounts),
);
```

### Rule: Avoid Selectors That Reorganize Nested State

**DO:**
- Store data in the needed format if both formats are needed frequently
- Normalize state to avoid reorganization

**DON'T:**
- Reorganize nested state structures on every selector call (expensive, creates new object references)

**Example - WRONG:**
```typescript
export const getNftContractsByAddressByChain = createSelector(
  getNftContractsByChainByAccount,
  (nftContractsByChainByAccount) => {
    // Expensive reorganization
    const userAccounts = Object.keys(nftContractsByChainByAccount);
    const allNftContracts = userAccounts
      .map((account) =>
        Object.keys(nftContractsByChainByAccount[account]).map((chainId) =>
          nftContractsByChainByAccount[account][chainId].map((contract) => ({
            ...contract,
            chainId,
          })),
        ),
      )
      .flat()
      .flat();

    return allNftContracts.reduce(
      (acc, contract) => {
        const { chainId, ...data } = contract;
        const chainIdContracts = acc[chainId] ?? {};
        acc[chainId] = chainIdContracts;
        chainIdContracts[data.address.toLowerCase()] = data;
        return acc;
      },
      {} as { [chainId: string]: { [address: string]: NftContract } },
    );
  },
);
```

**Example - CORRECT:**
```typescript
// Option 1: Store in both formats if both are needed frequently
interface NftState {
  byAccountByChain: { [account]: { [chainId]: NftContract[] } };
  byChainByAddress: { [chainId]: { [address]: NftContract } }; // Pre-computed
}

// Option 2: Normalize to avoid reorganization
interface NftState {
  contracts: {
    byId: { [contractId]: NftContract };
    byAccountId: { [accountId]: string[] };
    byChainId: { [chainId]: string[] };
    byAddress: { [address]: string[] };
  };
}
```

### Rule: Avoid Filtering/Searching Through Nested Objects

**DO:**
- Maintain lookup indexes in state
- Use O(1) lookups instead of O(n) searches

**DON'T:**
- Use Object.values().find() or Object.values().filter() to search (O(n), creates temporary arrays)

**Example - WRONG:**
```typescript
export const getInternalAccountByAddress = createSelector(
  (state) => state.metamask.internalAccounts.accounts,
  (_, address) => address,
  (accounts, address) => {
    return Object.values(accounts).find((account) =>
      isEqualCaseInsensitive(account.address, address),
    );
  },
);
```

**Example - CORRECT:**
```typescript
// State includes address-to-ID mapping
interface AccountsState {
  accounts: {
    byId: Record<string, Account>;
    byAddress: Record<string, string>; // address -> accountId
  };
}

const selectAccountByAddress = createSelector(
  (state, address) => state.metamask.internalAccounts.accounts.byAddress[address.toLowerCase()],
  (state) => state.metamask.internalAccounts.accounts.byId,
  (accountId, accountsById) => accountId ? accountsById[accountId] : undefined,
);
```

