import { useRef } from 'react';
import stringify from 'fast-json-stable-stringify';

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
export function useSyncEqualityCheck<Value>(value: Value): Value {
  const currentSnapshot = stringify(value);
  const snapshotRef = useRef<string>(currentSnapshot);
  const valueRef = useRef<Value>(value);

  if (currentSnapshot !== snapshotRef.current) {
    valueRef.current = Object.is(value, valueRef.current)
      ? (JSON.parse(currentSnapshot) as Value)
      : value;
    snapshotRef.current = currentSnapshot;
  }

  return valueRef.current;
}

export default useSyncEqualityCheck;
