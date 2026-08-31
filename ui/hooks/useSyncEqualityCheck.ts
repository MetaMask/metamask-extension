import { useState } from 'react';
import stringify from 'fast-json-stable-stringify';
import type { Json } from '@metamask/utils';

/**
 * Synchronous version of `useEqualityCheck` that provides referential stability without triggering unnecessary re-renders.
 *
 * Uses JSON serialization to detect changes (including mutations).
 * Calls `stringify` on every render, `JSON.parse` only when a mutation is detected.
 * Returns a new reference only when the serialized value differs.
 * Suitable for small objects/arrays. For large data, consider `useEqualityCheck` or `useMemo`.
 *
 * @param value - Must be JSON-serializable. No support for `undefined`, functions, `BigInt`, circular refs, or `Date` objects.
 * @returns Referentially stable value
 * @see {@link useEqualityCheck} - async version that triggers re-renders
 * @example
 * ```tsx
 * const stableInput = useSyncEqualityCheck({ chainId, networkClientId });
 * useEffect(() => {
 *   startPolling(stableInput);
 *   return () => stopPolling();
 * }, [stableInput]);
 * ```
 */
export function useSyncEqualityCheck<Value extends Json>(value: Value): Value {
  const currentSnapshot = stringify(value);
  const [cache, setCache] = useState<{ snapshot: string; value: Value }>(() => ({
    snapshot: currentSnapshot,
    value,
  }));

  if (currentSnapshot !== cache.snapshot) {
    setCache({
      snapshot: currentSnapshot,
      value: Object.is(value, cache.value)
        ? (JSON.parse(currentSnapshot) as Value)
        : value,
    });
  }

  return cache.value;
}

export default useSyncEqualityCheck;
