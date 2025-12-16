import { isEqual } from 'lodash';
import {
  createSelectorCreator,
  lruMemoize,
  weakMapMemoize,
  type CreateSelectorFunction,
} from 'reselect';
import { shallowEqual, fastDeepEqual } from './selector-equality-functions';

// Note: createSelectorCreator is still needed for createSelectiveDeepEqualSelector
// which requires custom equality logic that can't be expressed via the factory.

// ============================================================================
// Selector Factory
// ============================================================================

/**
 * Equality comparison strategy for selector inputs or results.
 *
 * - `Reference` - Strict equality (`===`). Fastest, use when references are stable.
 * - `Shallow` - Compares arrays by elements, objects by property values (one level deep).
 * - `Deep` - Full recursive comparison via lodash `isEqual`. Most expensive.
 * - `FastDeep` - Optimized deep equality that short-circuits on structural differences.
 */
export const EqualityMode = {
  Reference: 'reference',
  Shallow: 'shallow',
  Deep: 'deep',
  FastDeep: 'fast-deep',
} as const;

export type EqualityMode = (typeof EqualityMode)[keyof typeof EqualityMode];

/**
 * Memoization strategy for the selector.
 *
 * - `Lru` - Least-recently-used cache (default). Best for most use cases.
 * - `Weak` - WeakMap-based caching. Keys are garbage-collected when no longer referenced.
 */
export const MemoizeMode = {
  Lru: 'lru',
  Weak: 'weakmap',
} as const;

export type MemoizeMode = (typeof MemoizeMode)[keyof typeof MemoizeMode];

/**
 * Configuration options for {@link createSelectorWith}.
 */
export type SelectorOptions = {
  /**
   * Equality comparison for input selectors.
   * Determines when the result function should be re-executed.
   *
   * @default EqualityMode.Reference
   */
  inputEquality?: EqualityMode;

  /**
   * Equality comparison for the result.
   * When set, compares new results against cached results to prevent
   * unnecessary downstream re-renders even when inputs change.
   *
   * @default undefined (disabled)
   */
  resultEquality?: EqualityMode;

  /**
   * Memoization strategy.
   *
   * @default MemoizeMode.Lru
   */
  memoize?: MemoizeMode;

  /**
   * Maximum cache size for LRU memoization.
   * Only applies when `memoize: MemoizeMode.Lru`.
   *
   * @default 1
   */
  maxSize?: number;
};

/** Maps equality mode to comparison function */
const equalityFunctions: Record<
  EqualityMode,
  (a: unknown, b: unknown) => boolean
> = {
  [EqualityMode.Reference]: (a, b) => a === b,
  [EqualityMode.Shallow]: shallowEqual,
  [EqualityMode.Deep]: isEqual,
  [EqualityMode.FastDeep]: fastDeepEqual,
};

/**
 * Factory for creating customized selector creators with composable options.
 *
 * This is the recommended way to create selectors with non-default behavior.
 * It provides a unified API for configuring input equality, result equality,
 * memoization strategy, and cache size.
 *
 * ## Quick Reference
 *
 * | Option | Values | Default | Use Case |
 * |--------|--------|---------|----------|
 * | `inputEquality` | `EqualityMode.*` | `Reference` | Compare inputs to decide recalculation |
 * | `resultEquality` | `EqualityMode.*` | `undefined` | Compare results to prevent re-renders |
 * | `memoize` | `MemoizeMode.*` | `Lru` | Cache eviction strategy |
 * | `maxSize` | `number` | `1` | LRU cache capacity |
 *
 * ## When to Use Each Option
 *
 * ### Input Equality
 * - `Reference` (default): Inputs are stable references (immer, normalized state)
 * - `Shallow`: Inputs are recreated arrays/objects with stable elements
 * - `Deep`: Inputs are deeply nested and may be recreated with same values
 * - `FastDeep`: Like `Deep` but optimized when structural changes are common
 *
 * ### Result Equality
 * - `undefined` (default): Result changes whenever inputs change
 * - `Shallow`/`Deep`: Result may be equivalent even when inputs differ,
 * e.g., aggregations, derived booleans, filtered subsets
 *
 * @param options - Configuration for the selector creator
 * @returns A selector creator function compatible with reselect's `createSelector`
 * @example
 * ```ts
 * // Deep input equality (replaces createDeepEqualSelector)
 * const createDeepInputSelector = createSelectorWith({
 *   inputEquality: EqualityMode.Deep,
 * });
 *
 * // Shallow input + result equality
 * const createStableSelector = createSelectorWith({
 *   inputEquality: EqualityMode.Shallow,
 *   resultEquality: EqualityMode.Deep,
 * });
 *
 * // Large LRU cache for parameterized selectors
 * const createCachedSelector = createSelectorWith({
 *   memoize: MemoizeMode.Lru,
 *   maxSize: 50,
 * });
 *
 * // WeakMap for selectors called with many distinct objects
 * const createWeakSelector = createSelectorWith({
 *   memoize: MemoizeMode.Weak,
 * });
 * ```
 * @example
 * ```ts
 * // Practical usage: account balance aggregation
 * const createBalanceSelector = createSelectorWith({
 *   inputEquality: EqualityMode.Shallow,
 *   resultEquality: EqualityMode.Deep,
 * });
 *
 * const getTotalBalance = createBalanceSelector(
 *   getVisibleAccounts,
 *   (accounts) => accounts.reduce((sum, a) => sum + BigInt(a.balance), 0n),
 * );
 * ```
 */
export function createSelectorWith(
  options: SelectorOptions = {},
): CreateSelectorFunction {
  const {
    inputEquality = EqualityMode.Reference,
    resultEquality,
    memoize = MemoizeMode.Lru,
    maxSize,
  } = options;

  const memoizeFn = memoize === MemoizeMode.Weak ? weakMapMemoize : lruMemoize;
  const inputEqualityFn = equalityFunctions[inputEquality];

  // Build memoize options
  const memoizeOptions: {
    maxSize?: number;
    equalityCheck?: (a: unknown, b: unknown) => boolean;
    resultEqualityCheck?: (a: unknown, b: unknown) => boolean;
  } = {
    equalityCheck: inputEqualityFn,
  };

  if (memoize === MemoizeMode.Lru && maxSize !== undefined) {
    memoizeOptions.maxSize = maxSize;
  }

  if (resultEquality) {
    memoizeOptions.resultEqualityCheck = equalityFunctions[resultEquality];
  }

  return createSelectorCreator(memoizeFn, memoizeOptions);
}


/**
 * Creates a selector with deep equality comparison using lodash `isEqual`.
 *
 * **⚠️ Use sparingly** - deep equality checks are expensive (O(n) for nested structures).
 *
 * ## When to Use
 * 1. **Deeply nested objects** - Input contains multiple levels of nesting where
 * any level may change independently
 * 2. **Uncontrolled/unmemoized input sources** - Working with external data or legacy code
 * where referential stability cannot be guaranteed
 * 3. **Complex transformations upstream** - Input selectors perform operations
 * that create new object references on every call (e.g., `.map()`, `.filter()`,
 * spread operators) but produce equivalent values
 *
 * ## When to Avoid
 * 1. **Referentially stable inputs** - If input selectors are already memoized
 * or return stable references, use `createSelector` instead
 * 2. **Flat arrays** - Use {@link createShallowArrayEqualSelector} for arrays
 * where element references are stable
 * 3. **Flat objects** - Use {@link createShallowObjectEqualSelector} for objects
 * with stable property values
 * 4. **Structural differences are common** - Use {@link createFastDeepEqualSelector}
 * when changes typically alter array length or object key count (faster short-circuit)
 * 5. **Large data structures** - Deep comparison cost grows with size; consider
 * restructuring selectors or normalizing state instead
 *
 * @example
 * ```ts
 * // Merging multiple sources into a nested object - spread operators create new
 * // references at every level, even when underlying values haven't changed.
 * const getFullTxData = createDeepEqualSelector(
 *   getTxData,
 *   getTransaction,
 *   (txData, transaction) => {
 *     // Each spread creates new object references
 *     let fullTxData = { ...txData, ...transaction };
 *     if (transaction?.simulationFails) {
 *       fullTxData.simulationFails = { ...transaction.simulationFails };
 *     }
 *     return fullTxData;
 *   },
 * );
 * ```
 * @see {@link createSelector} - Preferred default; uses reference equality
 */
export const createDeepEqualSelector = createSelectorCreator(
  lruMemoize,
  isEqual,
);

/**
 * Creates a selector using WeakMap-based memoization.
 *
 * WeakMap keys are garbage-collected when no longer referenced, making this
 * more memory-efficient than LRU for selectors called with many distinct objects.
 *
 * ## When to Use
 * 1. **Stable object references as arguments** - Input selectors return objects
 * with reliable referential identity (e.g., normalized entities from state)
 * 2. **Many unique argument combinations** - Selector is called with different
 * objects frequently; WeakMap avoids unbounded cache growth
 * 3. **Large state trees** - Memory pressure is a concern and cached results
 * should be garbage-collected when source objects are no longer referenced
 *
 * ## When to Avoid
 * 1. **Primitive arguments** - WeakMap only accepts objects as keys; use
 * {@link createLruSelector} for selectors with string/number parameters
 * 2. **Unstable references** - If input selectors create new objects on each call,
 * the cache will never hit; use an equality-based selector instead
 * 3. **Small, bounded argument sets** - Standard LRU memoization is simpler and
 * sufficient when argument variety is limited
 *
 * @example
 * ```ts
 * // InternalAccount objects from state have stable references - ideal for WeakMap.
 * // Each account object acts as a unique cache key; results auto-cleanup when
 * // the account is removed from state and garbage-collected.
 * const selectAccountTokens = createWeakMapSelector(
 *   (state) => state.metamask.allTokens,
 *   (_state, account: InternalAccount) => account,
 *   (allTokens, account) => {
 *     // Aggregate tokens across all chains for this account
 *     return Object.values(allTokens).flatMap(
 *       (chainTokens) => chainTokens[account.address] ?? [],
 *     );
 *   },
 * );
 * ```
 * @see {@link createSelector} - Preferred default; uses reference equality with LRU
 */
export const createWeakMapSelector = createSelectorCreator(weakMapMemoize);

/**
 * Creates a selector with a configurable LRU cache size for parameterized selectors.
 *
 * Standard `createSelector` caches only the most recent result. This creator
 * maintains multiple cached results, evicting the least-recently-used when full.
 *
 * ## When to Use
 * 1. **Parameterized selectors** - Selector receives dynamic arguments (e.g., IDs,
 * filters) and is called with a bounded set of values
 * 2. **Repeated access patterns** - Same arguments are requested multiple times
 * within a render cycle or across navigation
 * 3. **Expensive computations** - Result function is costly and caching multiple
 * results provides meaningful performance benefit
 *
 * ## When to Avoid
 * 1. **Unbounded argument variety** - If arguments are highly unique (e.g., timestamps),
 * cache will thrash; consider {@link createWeakMapSelector} for object keys
 * 2. **Single argument pattern** - If selector is always called with the same argument,
 * standard `createSelector` (cache size 1) is sufficient
 * 3. **Memory-constrained environments** - Large cache sizes with large result
 * objects increase memory footprint
 *
 * @example
 * ```ts
 * // Cache results for multiple chain IDs accessed during render.
 * // allTokens structure: { [chainId]: { [address]: Token[] } }
 * const createChainSelector = createLruSelector(20);
 *
 * const selectTokensForChain = createChainSelector(
 *   (state) => state.metamask.allTokens,
 *   getSelectedAddress,
 *   (_state, chainId: Hex) => chainId,
 *   (allTokens, selectedAddress, chainId) =>
 *     allTokens[chainId]?.[selectedAddress] ?? EMPTY_ARRAY,
 * );
 *
 * // Multiple components render tokens for different chains without cache misses:
 * // selectTokensForChain(state, '0x1');   // Mainnet - cached
 * // selectTokensForChain(state, '0x89');  // Polygon - cached
 * // selectTokensForChain(state, '0x1');   // Mainnet - cache hit
 * ```
 * @param maxSize - Maximum number of cached results (default: 10)
 * @returns Selector creator with specified cache size
 */
export const createLruSelector = (maxSize = 10) =>
  createSelectorCreator(lruMemoize, { maxSize });

/**
 * Creates a selector with shallow equality comparison for inputs.
 *
 * Automatically handles both arrays and objects:
 * - Arrays: Compares by length and element reference equality
 * - Objects: Compares by key count and property reference equality
 *
 * This is the recommended shallow equality selector for mixed input types.
 * Replaces {@link createShallowArrayEqualSelector} and {@link createShallowObjectEqualSelector}.
 *
 * ## When to Use
 * 1. **Filtered/mapped collections** - Upstream selector returns new array/object
 * references but contained elements have stable references
 * 2. **Spread/merged objects** - Objects combined via spread where property values
 * are referentially stable
 * 3. **Mixed input types** - Some inputs are arrays, others are objects
 *
 * ## When to Avoid
 * 1. **Nested structures** - Shallow comparison won't detect changes in nested
 * properties; use {@link createFastDeepEqualSelector} or {@link createDeepEqualSelector}
 * 2. **Unstable element references** - If elements are recreated on each call,
 * shallow comparison provides no benefit
 *
 * @example
 * ```ts
 * // Works with both array and object inputs
 * const getAccountsWithConfig = createShallowEqualSelector(
 *   getFilteredAccounts,  // Array - compared by element refs
 *   getNetworkConfig,     // Object - compared by property refs
 *   (accounts, config) => accounts.map((a) => ({ ...a, network: config })),
 * );
 * ```
 * @see {@link shallowEqual} - The underlying comparison function
 * @see {@link createSelectorWith} - For combining with result equality
 */
export const createShallowEqualSelector = createSelectorCreator(
  lruMemoize,
  shallowEqual,
);

/**
 * Creates a selector with optimized deep equality that short-circuits on
 * structural differences before performing full lodash `isEqual` comparison.
 *
 * Checks array length and object key count first, avoiding expensive deep traversal
 * when structural differences exist. Falls back to `isEqual` only when structures match.
 *
 * ## When to Use
 * 1. **Structural changes are common** - Data frequently changes in ways that alter
 * array lengths or object key counts (items added/removed)
 * 2. **Deep equality needed with better average performance** - Need full deep comparison
 * but want to optimize for the common case of structural differences
 * 3. **Mixed change patterns** - Some updates are structural (fast reject), others are
 * value-only (falls back to deep comparison)
 *
 * ## When to Avoid
 * 1. **Changes are typically value-only** - If array lengths and key counts rarely change,
 * the pre-checks add overhead; use {@link createDeepEqualSelector} directly
 * 2. **Shallow comparison is sufficient** - If data is flat, use
 * {@link createShallowArrayEqualSelector} or {@link createShallowObjectEqualSelector}
 * 3. **Inputs are referentially stable** - If references don't change when values don't,
 * use `createSelector` with default reference equality
 *
 * @example
 * ```ts
 * // Account groups change structurally when accounts are added/removed
 * const getAccountGroupsWithAccounts = createFastDeepEqualSelector(
 *   getAllAccountGroups,
 *   getInternalAccounts,
 *   (accountGroups, internalAccounts) => {
 *     // Adding/removing accounts changes array lengths - fast short-circuit
 *     // Editing account metadata keeps structure same - falls back to deep compare
 *     return accountGroups.map((group) => ({
 *       ...group,
 *       accounts: group.accounts
 *         .map((id) => internalAccounts.find((a) => a.id === id))
 *         .filter(Boolean),
 *     }));
 *   },
 * );
 * ```
 * @see {@link fastDeepEqual} - The underlying comparison function
 * @see {@link createDeepEqualSelector} - Alternative without structural pre-checks
 */
export const createFastDeepEqualSelector = createSelectorCreator(
  lruMemoize,
  fastDeepEqual,
);

/**
 * Creates a selector that compares results (outputs) rather than inputs.
 *
 * Standard selectors memoize based on input equality. This creator additionally
 * checks if the new result equals the previous result, returning the cached
 * result if equal. Prevents downstream re-renders when computation produces
 * equivalent but not identical results.
 *
 * ## When to Use
 * 1. **Transformations that may produce equal results** - Selector computes a value
 * that often equals the previous result even when inputs change
 * 2. **Derived primitive values** - Computing strings, numbers, or booleans where
 * reference equality doesn't apply
 * 3. **Aggregations** - Sum, count, or other reductions that may produce same value
 *
 * ## When to Avoid
 * 1. **Large result objects** - Deep comparison of results adds overhead
 * 2. **Results always differ when inputs differ** - No benefit if results always change
 * 3. **Primitive results** - Primitives are already compared by value
 *
 * @example
 * ```ts
 * // Total balance may be the same even when individual balances shift
 * const getTotalBalance = createResultEqualSelector(
 *   getAccountBalances,
 *   (balances) => {
 *     return Object.values(balances).reduce((sum, b) => sum + BigInt(b), 0n);
 *   },
 * );
 *
 * // Derived status may not change even when underlying data updates
 * const getNetworkStatus = createResultEqualSelector(
 *   getNetworkState,
 *   (networkState) => ({
 *     isConnected: networkState.status === 'connected',
 *     chainId: networkState.chainId,
 *   }),
 * );
 * ```
 * @see {@link createDeepEqualSelector} - For input equality comparison instead
 */
export const createResultEqualSelector = createSelectorCreator({
  memoize: lruMemoize,
  memoizeOptions: {
    resultEqualityCheck: isEqual,
  },
});

/**
 * Creates a selector creator that applies deep equality selectively to specified inputs.
 *
 * By default, uses reference equality (fast) for all inputs. For inputs at indices
 * specified in `deepEqualInputs`, uses lodash `isEqual` (thorough but slower).
 * This is optimal when most inputs are referentially stable (e.g., from immer patches)
 * but some inputs are computed and may recreate equivalent objects.
 *
 * ## When to Use
 * 1. **Mixed input stability** - Some inputs come from stable state (use reference
 * equality), others are computed and may recreate objects (need deep equality)
 * 2. **Avoiding full deep equality overhead** - Only pay the deep comparison cost
 * for inputs that actually need it
 * 3. **Combining stable and unstable selectors** - When nesting selectors would be awkward
 *
 * ## When to Avoid
 * 1. **All inputs are stable** - Use `createSelector` (default reference equality)
 * 2. **All inputs need deep equality** - Use {@link createDeepEqualSelector}
 * 3. **Simple cases** - Nesting selectors (Option 1 in docs) is often clearer
 *
 * @param deepEqualInputs - Array of input indices (0-based) that should use deep equality
 * @returns A selector creator function
 * @example
 * ```ts
 * // Input 0 (accounts) is stable from state, input 1 (config) is computed
 * const createMixedSelector = createSelectiveDeepEqualSelector([1]);
 *
 * const getAccountsWithConfig = createMixedSelector(
 *   getInternalAccounts,      // Index 0: reference equality (stable from immer)
 *   getComputedNetworkConfig, // Index 1: deep equality (may recreate objects)
 *   (accounts, config) => accounts.filter((a) => a.chainId === config.chainId),
 * );
 * ```
 * @example
 * ```ts
 * // Multiple unstable inputs at indices 1 and 2
 * const createMultiDeepSelector = createSelectiveDeepEqualSelector([1, 2]);
 *
 * const getComplexData = createMultiDeepSelector(
 *   getStableState,     // Index 0: reference equality
 *   getComputedArrayA,  // Index 1: deep equality
 *   getComputedArrayB,  // Index 2: deep equality
 *   (state, arrayA, arrayB) => ({ ...state, arrayA, arrayB }),
 * );
 * ```
 */
export const createSelectiveDeepEqualSelector = (deepEqualInputs: number[]) => {
  deepEqualInputs.sort();

  const selectiveArrayEqual = (a: unknown[], b: unknown[]) => {
    if (a === b) {
      return true;
    }
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length; i += 1) {
      if (
        deepEqualInputs.shift() === i ? !isEqual(a[i], b[i]) : a[i] !== b[i]
      ) {
        return false;
      }
    }
    return true;
  };

  return createSelectorCreator(lruMemoize, selectiveArrayEqual);
};
