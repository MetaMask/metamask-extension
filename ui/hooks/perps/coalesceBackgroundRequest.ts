/**
 * Module-level coalescing helper for perps background requests.
 *
 * Rationale: under rapid UI navigation (or mount/unmount cycles on the perps
 * activity page), the transaction-history hooks fire 4 concurrent HL REST
 * calls on every mount — getUserHistory, getOrderFills, getOrders, getFunding.
 * Each call consumes HL weight against the 1200 wgt/min per-IP budget. Without
 * coalescing, back-to-back mounts and parallel hook instances on the same
 * params produce duplicate REST traffic that can tip us over the 429 line.
 *
 * Two layers of dedup are provided: concurrent callers for the same key share
 * one in-flight Promise, and follow-up callers inside the TTL window get the
 * cached value without issuing a new request. 10 s matches the staleness
 * tolerance of the passive "Recent activity" preview on the perps home — the
 * only path that actually reads the TTL cache today. Top-level consumers
 * (`PerpsActivityPage`) pass `forceFreshOnMount` and bypass the cache
 * entirely.
 *
 * Explicit refetch paths (pull-to-refresh) bypass the cache via invalidate().
 * Scope-level teardown (account switch, testnet toggle, wallet lock,
 * sign-out) uses clearAllCoalescedRequests() to drop both the cache and
 * any in-flight promises so the next scope never awaits the previous
 * scope's data.
 */

const DEFAULT_TTL_MS = 10_000;

type CacheEntry<TValue> = { at: number; value: TValue };

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Coalesce a background request by key. Concurrent callers with the same key
 * share one in-flight Promise; callers within the TTL window get the cached
 * value.
 *
 * @param key - Stable key derived from the request method and its params.
 * @param fn - Thunk that issues the underlying request. Only called on miss.
 * @param ttlMs - Optional override for the short-cache TTL.
 * @returns Resolved value from the request (fresh or cached).
 */
export async function coalesceBackgroundRequest<TResult>(
  key: string,
  fn: () => Promise<TResult>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<TResult> {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<TResult> | undefined;
  if (cached && now - cached.at < ttlMs) {
    return cached.value;
  }

  const existing = inFlight.get(key) as Promise<TResult> | undefined;
  if (existing !== undefined) {
    return existing;
  }

  // Defer fn() invocation to a microtask so `inFlight.set` below has already
  // committed by the time the body runs. Without this, a synchronous throw in
  // fn() runs the `finally` cleanup before the entry is inserted (no-op delete),
  // and the subsequent set stores a permanently-rejected promise that every
  // future caller re-subscribes to. The body captures `promise` by closure for
  // the identity checks below — safe with `const` because the body runs on a
  // later microtask, after the binding has been initialized.
  const promise: Promise<TResult> = Promise.resolve().then(async () => {
    try {
      const value = await fn();
      // Only persist if this promise still owns the slot; invalidate() may
      // have evicted us mid-flight in favor of a newer request.
      if (inFlight.get(key) === promise) {
        cache.set(key, { at: Date.now(), value });
      }
      return value;
    } finally {
      if (inFlight.get(key) === promise) {
        inFlight.delete(key);
      }
    }
  });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Evict the cached entry for a key. Use before an explicit refetch to force
 * the next coalesceBackgroundRequest() to hit the backend instead of serving
 * the previous cached value.
 *
 * Intentionally leaves any in-flight promise alone: an in-flight request is
 * by definition the freshest server snapshot being computed right now, so
 * concurrent callers (e.g. a `refetch()` racing with a sibling hook's mount
 * fetch) should coalesce into the same request rather than fire a duplicate
 * HL call. Dropping the in-flight entry here was the root cause of duplicate
 * request bursts during rapid navigation.
 *
 * @param key - Key previously used with coalesceBackgroundRequest.
 */
export function invalidateCoalescedRequest(key: string): void {
  cache.delete(key);
}

/**
 * Drop every cached value and every in-flight promise.
 *
 * Called on scope boundaries where no previous-scope response should ever
 * land — account switch, testnet toggle, provider swap, wallet lock, and
 * sign-out. Unlike invalidateCoalescedRequest(), which preserves in-flight
 * promises (the in-flight snapshot is still the freshest data for the
 * same scope), a scope change makes the in-flight response definitionally
 * wrong, so it must be abandoned too.
 */
export function clearAllCoalescedRequests(): void {
  cache.clear();
  inFlight.clear();
}

/**
 * Test-only reset. Clears both the cache and any in-flight entries so each
 * test starts from a clean state.
 */
export function resetCoalesceCacheForTests(): void {
  clearAllCoalescedRequests();
}
