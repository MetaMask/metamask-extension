import { isEqual } from 'lodash';
import { createSelectorCreator, lruMemoize, weakMapMemoize } from 'reselect';
import {
  shallowArrayEqual,
  shallowObjectEqual,
  fastDeepEqual,
} from './selector-equality-functions';

/**
 * Creates a selector with deep equality comparison using lodash `isEqual`.
 *
 * **⚠️ Use sparingly** - deep equality checks are expensive (O(n) for nested structures).
 *
 * ## When to Use
 * 1. **Deeply nested objects** - Input contains multiple levels of nesting where
 *    any level may change independently
 * 2. **Uncontrolled/unmemoized input sources** - Working with external data or legacy code
 *    where referential stability cannot be guaranteed
 * 3. **Complex transformations upstream** - Input selectors perform operations
 *    that create new object references on every call (e.g., `.map()`, `.filter()`,
 *    spread operators) but produce equivalent values
 *
 * ## When to Avoid
 * 1. **Referentially stable inputs** - If input selectors are already memoized
 *    or return stable references, use `createSelector` instead
 * 2. **Flat arrays** - Use {@link createShallowArrayEqualSelector} for arrays
 *    where element references are stable
 * 3. **Flat objects** - Use {@link createShallowObjectEqualSelector} for objects
 *    with stable property values
 * 4. **Structural differences are common** - Use {@link createFastDeepEqualSelector}
 *    when changes typically alter array length or object key count (faster short-circuit)
 * 5. **Large data structures** - Deep comparison cost grows with size; consider
 *    restructuring selectors or normalizing state instead
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
 *
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
 *    with reliable referential identity (e.g., normalized entities from state)
 * 2. **Many unique argument combinations** - Selector is called with different
 *    objects frequently; WeakMap avoids unbounded cache growth
 * 3. **Large state trees** - Memory pressure is a concern and cached results
 *    should be garbage-collected when source objects are no longer referenced
 *
 * ## When to Avoid
 * 1. **Primitive arguments** - WeakMap only accepts objects as keys; use
 *    {@link createLruSelector} for selectors with string/number parameters
 * 2. **Unstable references** - If input selectors create new objects on each call,
 *    the cache will never hit; use an equality-based selector instead
 * 3. **Small, bounded argument sets** - Standard LRU memoization is simpler and
 *    sufficient when argument variety is limited
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
 *
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
 *    filters) and is called with a bounded set of values
 * 2. **Repeated access patterns** - Same arguments are requested multiple times
 *    within a render cycle or across navigation
 * 3. **Expensive computations** - Result function is costly and caching multiple
 *    results provides meaningful performance benefit
 *
 * ## When to Avoid
 * 1. **Unbounded argument variety** - If arguments are highly unique (e.g., timestamps),
 *    cache will thrash; consider {@link createWeakMapSelector} for object keys
 * 2. **Single argument pattern** - If selector is always called with the same argument,
 *    standard `createSelector` (cache size 1) is sufficient
 * 3. **Memory-constrained environments** - Large cache sizes with large result
 *    objects increase memory footprint
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
 *
 * @param maxSize - Maximum number of cached results (default: 10)
 * @returns Selector creator with specified cache size
 */
export const createLruSelector = (maxSize = 10) =>
  createSelectorCreator(lruMemoize, { maxSize });

/**
 * Creates a selector with shallow array comparison for input equality.
 *
 * Compares arrays by length and element reference equality (O(n) where n = array length).
 * Faster than deep equality when array elements have stable references.
 *
 * ## When to Use
 * 1. **Arrays of stable objects** - Elements are memoized or come from normalized
 *    state where references are preserved across updates
 * 2. **Filtered/sliced results** - Upstream selector returns a new array reference
 *    but contains the same object references (e.g., `.filter()`, `.slice()`)
 * 3. **Computed array selections** - Result is an array derived from multiple inputs
 *    where the contained objects don't change frequently
 *
 * ## When to Avoid
 * 1. **Arrays of primitives that are recreated** - New arrays with same primitive
 *    values won't match; consider {@link createDeepEqualSelector}
 * 2. **Nested arrays/objects within elements** - Shallow comparison won't detect
 *    changes inside array elements; use {@link createFastDeepEqualSelector}
 * 3. **Unstable element references** - If elements are recreated on each selector
 *    call, shallow comparison provides no benefit
 *
 * @example
 * ```ts
 * // Filtering accounts - account objects are stable references from state
 * const getEvmAccounts = createShallowArrayEqualSelector(
 *   getInternalAccounts,
 *   (accounts) => accounts.filter((account) => isEvmAccountType(account.type)),
 * );
 *
 * // Transactions from TransactionController use immer, so object references
 * // remain stable when unchanged. Sorting creates a new array but element
 * // references are preserved - ideal for shallow array comparison.
 * const getTransactions = createShallowArrayEqualSelector(
 *   (state) => state.metamask?.transactions,
 *   (transactions) => {
 *     if (!transactions?.length) return EMPTY_ARRAY;
 *     return [...transactions].sort((a, b) => a.time - b.time);
 *   },
 * );
 * ```
 *
 * @see {@link shallowArrayEqual} - The underlying comparison function
 */
export const createShallowArrayEqualSelector = createSelectorCreator(
  lruMemoize,
  shallowArrayEqual,
);

/**
 * Creates a selector with shallow object comparison for input equality.
 *
 * Compares objects by key count and property reference equality (O(n) where n = key count).
 * Faster than deep equality when property values have stable references.
 *
 * ## When to Use
 * 1. **Flat configuration objects** - Objects with primitive or stable reference values
 *    that may be recreated with the same contents
 * 2. **Merged/spread objects** - Upstream selector combines objects via spread operator
 *    but underlying property values are referentially stable
 * 3. **Computed object selections** - Result is an object derived from state where
 *    property values don't change frequently
 *
 * ## When to Avoid
 * 1. **Nested objects** - Shallow comparison won't detect changes in nested properties;
 *    use {@link createFastDeepEqualSelector} or {@link createDeepEqualSelector}
 * 2. **Objects with array values** - Arrays are compared by reference only; if arrays
 *    are recreated, use {@link createDeepEqualSelector}
 * 3. **Dynamic key sets** - If object shape changes frequently (keys added/removed),
 *    comparison overhead increases
 *
 * @example
 * ```ts
 * // Wrapping state slices with fallbacks - object values are stable references
 * const selectRatesStateForBalances = createShallowObjectEqualSelector(
 *   getAssetsRates,
 *   getHistoricalPrices,
 *   (conversionRates, historicalPrices) => ({
 *     conversionRates: conversionRates ?? EMPTY_OBJECT,
 *     historicalPrices: historicalPrices ?? EMPTY_OBJECT,
 *   }),
 * );
 *
 * // The wrapped objects are stable references from state, so shallow comparison
 * // detects when the returned object is equivalent to the previous result.
 * ```
 *
 * @see {@link shallowObjectEqual} - The underlying comparison function
 */
export const createShallowObjectEqualSelector = createSelectorCreator(
  lruMemoize,
  shallowObjectEqual,
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
 *    array lengths or object key counts (items added/removed)
 * 2. **Deep equality needed with better average performance** - Need full deep comparison
 *    but want to optimize for the common case of structural differences
 * 3. **Mixed change patterns** - Some updates are structural (fast reject), others are
 *    value-only (falls back to deep comparison)
 *
 * ## When to Avoid
 * 1. **Changes are typically value-only** - If array lengths and key counts rarely change,
 *    the pre-checks add overhead; use {@link createDeepEqualSelector} directly
 * 2. **Shallow comparison is sufficient** - If data is flat, use
 *    {@link createShallowArrayEqualSelector} or {@link createShallowObjectEqualSelector}
 * 3. **Inputs are referentially stable** - If references don't change when values don't,
 *    use `createSelector` with default reference equality
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
 *
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
 *    that often equals the previous result even when inputs change
 * 2. **Derived primitive values** - Computing strings, numbers, or booleans where
 *    reference equality doesn't apply
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
 *
 * @see {@link createDeepEqualSelector} - For input equality comparison instead
 */
export const createResultEqualSelector = createSelectorCreator({
  memoize: lruMemoize,
  memoizeOptions: {
    resultEqualityCheck: isEqual,
  },
});
