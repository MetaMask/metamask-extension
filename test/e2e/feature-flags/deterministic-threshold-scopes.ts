import type { Json } from '@metamask/utils';

const CONTROL_VARIANT_NAME = 'control';

type JsonObject = { [key: string]: Json };

/**
 * A threshold-array item as returned by the client-config API.
 */
export type ThresholdEntry = JsonObject & {
  name?: string;
  thresholdName?: string;
  scope: {
    type: 'threshold';
    value: number;
  };
};

/**
 * Returns true when `value` is a plain object (not an array or null).
 *
 * @param value - Candidate JSON value
 * @returns Whether the value is a JSON object
 */
function isJsonObject(value: Json): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns true when `item` is a threshold-scoped variant entry.
 *
 * @param item - Candidate JSON value
 * @returns Whether the item has `scope.type === 'threshold'`
 */
function isThresholdEntry(item: Json): item is ThresholdEntry {
  if (!isJsonObject(item)) {
    return false;
  }
  const { scope } = item;
  return isJsonObject(scope) && scope.type === 'threshold';
}

/**
 * Returns true when `value` is a non-empty array of threshold entries.
 *
 * @param value - Candidate JSON value
 * @returns Whether the value is a threshold array
 */
export function isThresholdArray(value: Json): value is ThresholdEntry[] {
  return (
    Array.isArray(value) && value.length > 0 && value.every(isThresholdEntry)
  );
}

/**
 * Reads `scope.value` from a threshold entry, defaulting to 0 when missing.
 *
 * @param item - Threshold array item
 * @returns Numeric threshold, or 0
 */
function getScopeValue(item: ThresholdEntry): number {
  return typeof item.scope.value === 'number' ? item.scope.value : 0;
}

/**
 * Returns true when the entry is the named control variant.
 *
 * @param item - Threshold array item
 * @returns Whether `name` or `thresholdName` is `control` (case-insensitive)
 */
function isControlEntry(item: ThresholdEntry): boolean {
  return [item.name, item.thresholdName].some(
    (label) =>
      typeof label === 'string' && label.toLowerCase() === CONTROL_VARIANT_NAME,
  );
}

/**
 * Picks the arm with the largest allocation share.
 *
 * Threshold lists are cumulative, so width is `scope.value - previous`
 * after sorting by `scope.value` (previous starts at 0). On equal width,
 * the last item after sort wins. The original array order is not changed.
 *
 * @param items - Non-empty threshold array
 * @returns The widest-bucket entry (same object reference as in `items`)
 */
function selectWidestBucket(items: ThresholdEntry[]): ThresholdEntry {
  const sorted = [...items].sort(
    (left, right) => getScopeValue(left) - getScopeValue(right),
  );

  let previous = 0;
  let widest = sorted[0];
  let maxWidth = Number.NEGATIVE_INFINITY;

  for (const item of sorted) {
    const value = getScopeValue(item);
    const width = value - previous;
    if (width >= maxWidth) {
      maxWidth = width;
      widest = item;
    }
    previous = value;
  }

  return widest;
}

/**
 * Chooses the default threshold entry before any `value` rewrite.
 *
 * Rules, in order:
 * 1. Named `control` (`name` or `thresholdName`, case-insensitive)
 * 2. Exactly one variant
 * 3. Widest bucket (`scope.value - previous` after sorting by `scope.value`)
 *
 * @param items - Threshold array (may be empty)
 * @returns The default entry, or `undefined` when the array is empty
 */
export function selectDefaultThresholdEntry(
  items: readonly ThresholdEntry[],
): ThresholdEntry | undefined {
  if (items.length === 0) {
    return undefined;
  }

  const controlEntry = items.find(isControlEntry);
  if (controlEntry) {
    return controlEntry;
  }

  if (items.length === 1) {
    return items[0];
  }

  return selectWidestBucket([...items]);
}

/**
 * Rewrites a threshold array so the default arm always matches and others never do.
 *
 * @param items - Threshold array
 * @returns New array with selected `scope.value = 1` and others `0`
 */
function rewriteThresholdArray(items: ThresholdEntry[]): ThresholdEntry[] {
  const defaultEntry = selectDefaultThresholdEntry(items);
  if (!defaultEntry) {
    return items;
  }

  return items.map((item) => ({
    ...item,
    scope: {
      ...item.scope,
      value: item === defaultEntry ? 1 : 0,
    },
  }));
}

/**
 * Recursively converts every threshold array in a flag value to a deterministic
 * 1/0 assignment: default variant at threshold 1, all others at 0.
 *
 * Non-threshold values, empty arrays, and already-normalized 1/0 arrays are
 * left unchanged (the rewrite is idempotent).
 *
 * @param value - A remote feature-flag `productionDefault` value
 * @returns A copy with deterministic threshold scopes
 */
export function toDeterministicThresholdScopes(value: Json): Json {
  if (isThresholdArray(value)) {
    return rewriteThresholdArray(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => toDeterministicThresholdScopes(item));
  }

  if (isJsonObject(value)) {
    const next: JsonObject = {};
    for (const [key, nested] of Object.entries(value)) {
      next[key] = toDeterministicThresholdScopes(nested);
    }
    return next;
  }

  return value;
}
