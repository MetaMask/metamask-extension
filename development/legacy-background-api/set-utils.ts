/**
 * Lists the values in one set which are not in another.
 *
 * Node supports `Set.prototype.difference`, but the TypeScript `lib` used by
 * this project does not include its types yet.
 *
 * @param set1 - The set to filter.
 * @param set2 - The set to exclude from `set1`.
 * @returns The values in `set1` which are not in `set2`.
 */
export function setSubtract<Value>(
  set1: Set<Value>,
  set2: Set<Value>,
): Set<Value> {
  return new Set([...set1].filter((value) => !set2.has(value)));
}
