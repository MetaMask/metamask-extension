import { isEqual } from 'lodash';

/**
 * Compares two arrays by length and element reference equality.
 * Faster than deep equality for arrays of objects with stable references.
 *
 * @param a - First array
 * @param b - Second array
 * @returns True if arrays have same length and same element references
 */
export const shallowArrayEqual = (a: unknown[], b: unknown[]) => {
  if (a === b) {
    return true;
  }
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

/**
 * Compares two objects by their own enumerable keys and values (shallow).
 * Faster than deep equality for flat objects.
 *
 * @param a - First object
 * @param b - Second object
 * @returns True if objects have same keys and values (by reference)
 */
export const shallowObjectEqual = (
  a: Record<string, unknown>,
  b: Record<string, unknown>,
) => {
  if (a === b) {
    return true;
  }
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (const key of keysA) {
    if (a[key] !== b[key]) {
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
