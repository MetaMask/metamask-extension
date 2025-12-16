import { isEqual } from 'lodash';

/**
 * Shallow equality comparison that handles both arrays and objects.
 *
 * - Arrays: Compares by length and element reference equality
 * - Objects: Compares by key count and property reference equality
 * - Primitives: Compares by value (===)
 *
 * This is the recommended shallow equality function for selectors with mixed
 * input types. Equivalent to React's `shallowEqual`.
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if values are shallowly equal
 */
export const shallowEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true;
  }
  if (a === null || b === null) {
    return false;
  }
  if (typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }

  // Both are arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  // One is array, one is object - not equal
  if (Array.isArray(a) || Array.isArray(b)) {
    return false;
  }

  // Both are plain objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (const key of keysA) {
    if (
      !Object.hasOwn(b, key) ||
      (a as Record<string, unknown>)[key] !==
        (b as Record<string, unknown>)[key]
    ) {
      return false;
    }
  }
  return true;
};

/**
 * Compares arrays/objects by their serialized string length as a fast pre-check.
 * Falls back to deep equality only if lengths match. Useful when differences
 * are typically structural rather than value-only.
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if values are deeply equal
 */
export const fastDeepEqual = (a: unknown, b: unknown) => {
  if (a === b) {
    return true;
  }
  // Quick length check for arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }
  }
  // Quick key count check for objects
  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    a !== null &&
    b !== null
  ) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      return false;
    }
  }
  return isEqual(a, b);
};
