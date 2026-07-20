/**
 * Stable empty array singleton for selector memoization.
 * Cast through `never[]` (not `readonly never[]`) so callers can return it as
 * mutable `T[]` while Object.freeze keeps the reference stable.
 */
export const EMPTY_ARRAY = Object.freeze([]) as never[];

/**
 * Stable empty object singleton for selector memoization.
 */
export const EMPTY_OBJECT = Object.freeze({}) as Record<PropertyKey, never>;
