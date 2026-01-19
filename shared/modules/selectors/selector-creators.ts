import { isEqual } from 'lodash';
import {
  createSelectorCreator,
  lruMemoize,
  weakMapMemoize,
  type CreateSelectorFunction,
} from 'reselect';
import { shallowEqual, fastDeepEqual } from './selector-equality-functions';

// ============================================================================
// Selector Factory
// ============================================================================
//
// Use `createSelectorWith` to build custom selector creators with specific
// equality and memoization behavior. For common patterns, use the pre-configured
// selector creators exported below (e.g., `createDeepEqualSelector`).

/**
 * Equality comparison strategies for selector inputs or results.
 *
 * Choose based on your data's referential stability and structure:
 *
 * | Mode        | Complexity | Best For                                           |
 * |-------------|------------|---------------------------------------------------|
 * | `Reference` | O(1)       | Immer state, memoized selectors, primitives        |
 * | `Shallow`   | O(n)       | Arrays/objects with stable element references      |
 * | `FastDeep`  | O(n)-O(n×d)| Structural changes common (length/key count)       |
 * | `Deep`      | O(n×d)     | Unstable nested data (last resort)                 |
 *
 * **Decision tree:**
 * 1. Are inputs referentially stable (immer, memoized)? → `Reference`
 * 2. Is the container recreated but elements stable? → `Shallow`
 * 3. Do structural changes (add/remove) happen often? → `FastDeep`
 * 4. None of the above? → `Deep` (but consider refactoring first)
 */
export const EqualityMode = {
  /** Strict equality (`===`). O(1). Use when references are stable. */
  Reference: 'reference',
  /** Compares arrays by elements, objects by values. O(n). */
  Shallow: 'shallow',
  /** Full recursive comparison via lodash `isEqual`. O(n×d). Expensive. */
  Deep: 'deep',
  /** Checks length/keys first, then deep compare. O(n) best case. */
  FastDeep: 'fast-deep',
} as const;

export type EqualityMode = (typeof EqualityMode)[keyof typeof EqualityMode];

/**
 * Memoization strategies for selector caching.
 *
 * | Mode   | Cache Size | Memory     | Best For                              |
 * |--------|------------|------------|---------------------------------------|
 * | `Lru`  | Bounded    | Predictable| Most selectors, parameterized lookups |
 * | `Weak` | Unbounded  | Auto-GC    | Many unique object keys               |
 *
 * **Decision tree:**
 * 1. Do you pass objects as selector arguments? → Consider `Weak`
 * 2. Is the argument set bounded (e.g., chain IDs)? → `Lru` with `maxSize`
 * 3. Default case? → `Lru` (size 1)
 */
export const MemoizeMode = {
  /** LRU cache with configurable size. Predictable memory usage. */
  Lru: 'lru',
  /** WeakMap-based. Auto garbage collection when object keys are dereferenced. */
  Weak: 'weakmap',
} as const;

export type MemoizeMode = (typeof MemoizeMode)[keyof typeof MemoizeMode];

/**
 * Configuration options for {@link createSelectorWith}.
 *
 * All options are optional and have sensible defaults matching reselect's
 * standard `createSelector` behavior.
 */
export type SelectorOptions = {
  /**
   * How to compare input selector results to determine if recalculation is needed.
   *
   * - `Reference`: Only recalculate if `prevInput !== nextInput`
   * - `Shallow`: Recalculate if any element/property reference changed
   * - `Deep`/`FastDeep`: Recalculate only if values actually differ
   *
   * @default EqualityMode.Reference
   */
  inputEquality?: EqualityMode;

  /**
   * How to compare selector results to determine if a new reference should
   * be returned to consumers. Prevents unnecessary re-renders when the
   * computed result is equivalent to the cached result.
   *
   * Set this when your result function may produce equal-but-not-identical
   * outputs (e.g., filtering to same subset, computing same aggregate).
   *
   * @default undefined — always return new result when inputs change
   */
  resultEquality?: EqualityMode;

  /**
   * Cache eviction strategy.
   *
   * - `Lru`: Fixed-size cache, evicts least-recently-used entries
   * - `Weak`: Unlimited cache, auto-cleans when keys are garbage collected
   *
   * @default MemoizeMode.Lru
   */
  memoize?: MemoizeMode;

  /**
   * Maximum entries in the LRU cache. Only applies when `memoize` is `Lru`.
   *
   * Increase for parameterized selectors called with multiple argument
   * combinations (e.g., `getTokensForChain(state, chainId)`).
   *
   * @default 1
   */
  maxSize?: number;
};

/**
 * Maps equality mode to its comparison function implementation.
 *
 * @internal
 */
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
 * Creates a reselect-compatible selector creator with custom equality and
 * memoization behavior.
 *
 * Use this factory when you need a combination not covered by the pre-configured
 * creators, or when you want explicit control over selector behavior.
 *
 * @param options - Configuration for equality checks and memoization
 * @returns A `createSelector`-compatible function
 * @example Basic usage
 * ```ts
 * // Shallow input equality (like createShallowEqualSelector)
 * const createShallowSelector = createSelectorWith({
 *   inputEquality: EqualityMode.Shallow,
 * });
 *
 * const getVisibleAccounts = createShallowSelector(
 *   getAccounts,
 *   getVisibilityFilter,
 *   (accounts, filter) => accounts.filter(matchesFilter(filter)),
 * );
 * ```
 * @example Result equality to prevent re-renders
 * ```ts
 * // Result may be equivalent even when inputs change
 * const createStableResultSelector = createSelectorWith({
 *   resultEquality: EqualityMode.Shallow,
 * });
 *
 * const getActiveChainIds = createStableResultSelector(
 *   getNetworks,
 *   (networks) => networks.filter((n) => n.active).map((n) => n.chainId),
 * );
 * ```
 * @example Parameterized selector with larger cache
 * ```ts
 * const createMultiChainSelector = createSelectorWith({
 *   memoize: MemoizeMode.Lru,
 *   maxSize: 20, // Cache results for up to 20 different chainIds
 * });
 *
 * const getTokensForChain = createMultiChainSelector(
 *   getAllTokens,
 *   (_state, chainId: Hex) => chainId,
 *   (tokens, chainId) => tokens[chainId] ?? [],
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

// ============================================================================
// Pre-configured Selector Creators
// ============================================================================
// The following are convenient pre-configured selector creators for common
// patterns. For custom combinations, use `createSelectorWith()` directly.

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
export const createDeepEqualSelector = createSelectorWith({
  inputEquality: EqualityMode.Deep,
});

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
 * {@link createParameterizedSelector} for selectors with string/number parameters
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
export const createWeakMapSelector = createSelectorWith({
  memoize: MemoizeMode.Weak,
});

/**
 * Creates a selector with a configurable LRU cache for parameterized selectors.
 *
 * Standard `createSelector` caches only the most recent result. Parameterized
 * selectors (those receiving dynamic arguments like IDs or filters) need a
 * multi-slot cache to avoid thrashing when called with different arguments.
 *
 * ## When to Use
 * 1. **Selectors with dynamic arguments** - Called with varying parameters
 * (e.g., `getTokenByAddress(state, address)`, `getAccountById(state, id)`)
 * 2. **Bounded argument sets** - The variety of arguments is limited and predictable
 * (e.g., chain IDs, account indices)
 * 3. **Repeated access patterns** - Same arguments are requested multiple times
 * within a render cycle or across navigation
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
 * const createChainSelector = createParameterizedSelector(20);
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
 * @see {@link createParameterizedShallowEqualSelector} - With shallow input equality
 * @see {@link createParameterizedDeepEqualSelector} - With deep input equality
 */
export const createParameterizedSelector = (maxSize = 10) =>
  createSelectorWith({ memoize: MemoizeMode.Lru, maxSize });

/**
 * Creates a parameterized selector with shallow equality comparison for inputs.
 *
 * Combines multi-slot LRU caching (for varying arguments) with shallow equality
 * (for inputs where the container is recreated but elements are stable).
 *
 * ## When to Use
 * 1. **Parameterized selectors with filtered/mapped inputs** - Inputs come from
 * upstream selectors that filter or map collections
 * 2. **Spread objects as parameters** - Objects passed as arguments are recreated
 * but property values are referentially stable
 *
 * @example
 * ```ts
 * const createAccountSelector = createParameterizedShallowEqualSelector(10);
 *
 * const getAccountTokensByNetwork = createAccountSelector(
 *   getFilteredTokens,    // May recreate array but elements are stable
 *   (_state, networkId: string) => networkId,
 *   (tokens, networkId) => tokens.filter((t) => t.networkId === networkId),
 * );
 * ```
 * @param maxSize - Maximum number of cached results (default: 10)
 * @returns Selector creator with shallow input equality and LRU cache
 * @see {@link createParameterizedSelector} - With reference equality (faster)
 * @see {@link createParameterizedDeepEqualSelector} - With deep equality
 */
export const createParameterizedShallowEqualSelector = (maxSize = 10) =>
  createSelectorWith({
    inputEquality: EqualityMode.Shallow,
    memoize: MemoizeMode.Lru,
    maxSize,
  });

/**
 * Creates a parameterized selector with deep equality comparison for inputs.
 *
 * Combines multi-slot LRU caching (for varying arguments) with deep equality
 * (for inputs that are recreated with equivalent nested values).
 *
 * **⚠️ Use sparingly** - deep equality checks are expensive (O(n×d)).
 *
 * ## When to Use
 * 1. **Parameterized selectors with unstable nested inputs** - Inputs are deeply
 * nested objects that may be recreated with the same values
 * 2. **External/uncontrolled data sources** - Working with data where referential
 * stability cannot be guaranteed
 *
 * ## When to Avoid
 * 1. **Shallow comparison is sufficient** - Use {@link createParameterizedShallowEqualSelector}
 * 2. **Inputs are referentially stable** - Use {@link createParameterizedSelector}
 *
 * @example
 * ```ts
 * const createConfigSelector = createParameterizedDeepEqualSelector(5);
 *
 * const getNetworkConfig = createConfigSelector(
 *   getComputedConfigs,   // Deeply nested, recreated each time
 *   (_state, chainId: Hex) => chainId,
 *   (configs, chainId) => configs[chainId] ?? DEFAULT_CONFIG,
 * );
 * ```
 * @param maxSize - Maximum number of cached results (default: 10)
 * @returns Selector creator with deep input equality and LRU cache
 * @see {@link createParameterizedSelector} - With reference equality (faster)
 * @see {@link createParameterizedShallowEqualSelector} - With shallow equality
 */
export const createParameterizedDeepEqualSelector = (maxSize = 10) =>
  createSelectorWith({
    inputEquality: EqualityMode.Deep,
    memoize: MemoizeMode.Lru,
    maxSize,
  });

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
export const createShallowEqualSelector = createSelectorWith({
  inputEquality: EqualityMode.Shallow,
});

/**
 * Creates a selector with shallow equality for both inputs and results.
 *
 * Compares inputs and results by reference at one level deep:
 * - Arrays: by length and element references
 * - Objects: by key count and property references
 *
 * ## When to Use
 * 1. **Immer-backed state** - Inputs come from controllers using immer where
 * object references are stable when unchanged
 * 2. **Filtered/shaped collections** - Result is a new array/object wrapper
 * but contained elements have stable references
 * 3. **Preventing downstream re-renders** - Result may be equivalent even
 * when the selector recomputes
 *
 * ## When to Avoid
 * 1. **Deeply nested changes** - Shallow comparison won't detect changes
 * inside nested objects; use {@link createDeepEqualSelector}
 * 2. **Primitive results** - No benefit for strings/numbers/booleans
 *
 * @example
 * ```ts
 * // Transactions from immer have stable refs. Filtering creates a new object
 * // but values are same refs - shallow result equality catches this.
 * const getUnapprovedTransactions = createShallowEqualInputAndResultSelector(
 *   getTransactions,
 *   getCurrentChainId,
 *   (transactions, chainId) => {
 *     const unapproved: Record<string, Transaction> = {};
 *     for (const tx of transactions) {
 *       if (tx.status === 'unapproved' && tx.chainId === chainId) {
 *         unapproved[tx.id] = tx;
 *       }
 *     }
 *     return unapproved;
 *   },
 * );
 * ```
 * @see {@link createSelectorWith} - For custom equality combinations
 */
export const createShallowEqualInputAndResultSelector = createSelectorWith({
  inputEquality: EqualityMode.Shallow,
  resultEquality: EqualityMode.Shallow,
});

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
export const createFastDeepEqualSelector = createSelectorWith({
  inputEquality: EqualityMode.FastDeep,
});

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
export const createResultEqualSelector = createSelectorWith({
  resultEquality: EqualityMode.Deep,
});

/**
 * Creates a selector with shallow equality for results only.
 *
 * Uses reference equality for inputs (fast) but shallow equality for results.
 * Useful when inputs are already stable (from immer) but the result function
 * creates new arrays/objects that may be shallowly equivalent.
 *
 * ## When to Use
 * 1. **Stable inputs, recreated results** - Input selectors return stable refs
 * but result function creates new array/object wrappers
 * 2. **Mapped/filtered outputs** - Result is `.map()` or `.filter()` output
 * with stable element references
 * 3. **Spread objects** - Result combines inputs via spread but values are stable
 *
 * ## When to Avoid
 * 1. **Unstable inputs** - If inputs need equality checking, use
 * {@link createShallowEqualInputAndResultSelector}
 * 2. **Deeply nested results** - Shallow comparison won't detect nested changes
 *
 * @example
 * ```ts
 * // Inputs are stable from immer, but sorting creates new array
 * const getSortedAccounts = createShallowResultSelector(
 *   getInternalAccounts,
 *   (accounts) => [...accounts].sort((a, b) => a.name.localeCompare(b.name)),
 * );
 * ```
 * @see {@link createShallowEqualInputAndResultSelector} - When inputs also need shallow equality
 */
export const createShallowResultSelector = createSelectorWith({
  resultEquality: EqualityMode.Shallow,
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
