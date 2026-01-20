import { useRef } from 'react';
import { shallowEqual } from 'react-redux';

/**
 * Stabilizes a value using shallow equality comparison.
 * Most performant option for flat objects with primitive values (like route params).
 *
 * Unlike `useMemo`, which compares dependencies via `Object.is` (reference equality),
 * this hook compares the value itself using `shallowEqual`. This is useful when:
 * - The input is a new object reference every render (e.g., `useParams()`, `useLocation()`)
 * - You want automatic comparison of all properties without listing them as dependencies
 * - You need the most performant option for flat objects (no serialization overhead)
 *
 * @see {@link useSyncEqualityCheck} - uses JSON serialization for deep comparison (slower, handles nested objects)
 * @example
 * ```tsx
 * // useParams() returns a new object reference every render
 * const hookParams = useParams(); // { id: 'abc' } !== { id: 'abc' }
 *
 * // useMemo with object as dep → new ref every time (reference changed)
 * const bad = useMemo(() => hookParams, [hookParams]); // ❌
 *
 * // useMemo with individual props → works but verbose and error-prone
 * const verbose = useMemo(() => hookParams, [hookParams.id, hookParams.tab]); // ⚠️
 *
 * // useShallowEqualityCheck → compares VALUES automatically
 * const good = useShallowEqualityCheck(hookParams); // ✅ stable if values match
 * ```
 *
 * @param value - The value to stabilize
 * @returns Referentially stable value that only changes when shallow comparison fails
 */
export function useShallowEqualityCheck<Value>(value: Value): Value {
  const ref = useRef<Value>(value);
  if (!shallowEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

export default useShallowEqualityCheck;
