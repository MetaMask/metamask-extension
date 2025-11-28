import { useRef } from 'react';
import stringify from 'fast-json-stable-stringify';

/**
 * Synchronous version of `useEqualityCheck` that provides referential stability without triggering unnecessary re-renders.
 *
 * Uses JSON serialization to detect changes (including mutations).
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
export function useSyncEqualityCheck<Value>(value: Value): Value {
  const snapshotRef = useRef<string>(stringify(value));
  const valueRef = useRef<Value>(value);

  const currentSnapshot = stringify(value);
  if (currentSnapshot !== snapshotRef.current) {
    snapshotRef.current = currentSnapshot;
    valueRef.current = value;
  }

  return valueRef.current;
}

export default useSyncEqualityCheck;
