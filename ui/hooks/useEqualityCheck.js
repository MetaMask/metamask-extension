import { useRef } from 'react';

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
  const valueRef = useRef(value);

  if (!equalityFn(value, valueRef.current)) {
    valueRef.current = value;
  }

  return valueRef.current;
}
