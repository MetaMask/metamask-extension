import { getUniqueKeys } from './unique-keys';

describe('getUniqueKeys', () => {
  it('returns the base key for each distinct item', () => {
    expect(getUniqueKeys(['a', 'b', 'c'], (item) => item)).toStrictEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('adds a suffix to repeated base keys', () => {
    expect(getUniqueKeys(['a', 'b', 'a', 'a'], (item) => item)).toStrictEqual([
      'a',
      'b',
      'a-1',
      'a-2',
    ]);
  });

  it('keeps keys unique when a base key matches a generated suffix', () => {
    const keys = getUniqueKeys(['a', 'a', 'a-1'], (item) => item);

    expect(keys).toStrictEqual(['a', 'a-1', 'a-1-1']);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps the same key for an item when the list is reordered', () => {
    const items = [{ id: 'x' }, { id: 'y' }, { id: 'z' }];
    const getKey = (item: { id: string }) => item.id;

    const keys = getUniqueKeys(items, getKey);
    const reorderedKeys = getUniqueKeys([...items].reverse(), getKey);

    expect(reorderedKeys).toStrictEqual([...keys].reverse());
  });

  it('returns an empty array for an empty list', () => {
    expect(getUniqueKeys([], () => 'key')).toStrictEqual([]);
  });
});
