/**
 * Builds React keys for a list from each item's data.
 * Items with the same base key get a numeric suffix in list order,
 * so distinct items keep their key when the list is reordered.
 *
 * @param items - The list being rendered.
 * @param getBaseKey - Returns the identity of an item.
 * @returns One unique key per item, in the same order as `items`.
 */
export function getUniqueKeys<Item>(
  items: readonly Item[],
  getBaseKey: (item: Item) => string,
): string[] {
  const occurrences = new Map<string, number>();
  const usedKeys = new Set<string>();

  return items.map((item) => {
    const baseKey = getBaseKey(item);
    let count = occurrences.get(baseKey) ?? 0;
    let key = count === 0 ? baseKey : `${baseKey}-${count}`;

    while (usedKeys.has(key)) {
      count += 1;
      key = `${baseKey}-${count}`;
    }

    occurrences.set(baseKey, count + 1);
    usedKeys.add(key);
    return key;
  });
}
