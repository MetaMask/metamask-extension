import { useEffect, useRef, useState } from 'react';

import { isEqual } from 'lodash';

/**
 * Given a value and a function to determine equality, return a
 * referentially equal value if the equality function returns true.
 * This hook is helpful in avoiding re-renders and effects running
 * based on an object or value that always changes references but
 * infrequently changes it's value. By default, uses isEqual from
 * lodash. This is typically only useful with objects and arrays.
 *
 * @param {T} value - any value to check equality of
 * @param {(T, T) => boolean} equalityFn - A function to determine equality
 * @returns {T}
 */
export function useEqualityCheck(value, equalityFn = isEqual) {
  const [computedValue, setComputedValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (equalityFn(value, prevValueRef.current)) {
      return;
    }
    prevValueRef.current = value;
    queueMicrotask(() => setComputedValue(value));
  }, [value, equalityFn]);

  return computedValue;
}
