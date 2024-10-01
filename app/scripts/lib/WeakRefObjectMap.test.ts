import { WeakRefObjectMap } from './WeakRefObjectMap';

describe('WeakDomainProxyMap', () => {
  let map: WeakRefObjectMap<Record<string, object>>;

  beforeEach(() => {
    map = new WeakRefObjectMap();
  });

  it('sets and gets a value', () => {
    const key: string = 'testKey';
    const value: { [key: string]: object } = { objKey: {} };
    map.set(key, value);

    const retrieved = map.get(key);
    expect(retrieved).toHaveProperty('objKey');
    expect(retrieved?.objKey).toBe(value.objKey);
  });

  it('confirms presence of a key with has()', () => {
    const key: string = 'testKey';
    const value: { [key: string]: object } = { objKey: {} };
    map.set(key, value);

    expect(map.has(key)).toBe(true);
  });

  it('deletes a key-value pair', () => {
    const key: string = 'testKey';
    const value: { [key: string]: object } = { objKey: {} };
    map.set(key, value);

    expect(map.has(key)).toBe(true);
    map.delete(key);
    expect(map.has(key)).toBe(false);
  });

  it('clears the map', () => {
    map.set('key1', { objKey: {} });
    map.set('key2', { objKey: {} });

    map.clear();
    expect(map.has('key1')).toBe(false);
    expect(map.has('key2')).toBe(false);
  });

  it('get returns undefined for non-existent key', () => {
    expect(map.get('nonExistentKey')).toBeUndefined();
  });

  it('delete returns false when key does not exist', () => {
    expect(map.delete('nonExistentKey')).toBe(false);
  });

  describe('iterators', () => {
    beforeEach(() => {
      map = new WeakRefObjectMap();
      map.set('key1', { objKey1: { detail: 'value1' } });
      map.set('key2', { objKey2: { detail: 'value2' } });
    });

    it('iterates over entries correctly', () => {
      const entries = Array.from(map.entries());
      expect(entries).toHaveLength(2);
      expect(entries).toEqual(
        expect.arrayContaining([
          ['key1', { objKey1: { detail: 'value1' } }],
          ['key2', { objKey2: { detail: 'value2' } }],
        ]),
      );
    });

    it('iterates over keys correctly', () => {
      const keys = Array.from(map.keys());
      expect(keys).toHaveLength(2);
      expect(keys).toEqual(expect.arrayContaining(['key1', 'key2']));
    });

    it('iterates over values correctly', () => {
      const values = Array.from(map.values());
      expect(values).toHaveLength(2);
      expect(values).toEqual(
        expect.arrayContaining([
          { objKey1: { detail: 'value1' } },
          { objKey2: { detail: 'value2' } },
        ]),
      );
    });

    it('executes forEach callback correctly', () => {
      const mockCallback = jest.fn();
      map.forEach(mockCallback);

      expect(mockCallback.mock.calls).toHaveLength(2);
      expect(mockCallback).toHaveBeenCalledWith(
        { objKey1: { detail: 'value1' } },
        'key1',
        map,
      );
      expect(mockCallback).toHaveBeenCalledWith(
        { objKey2: { detail: 'value2' } },
        'key2',
        map,
      );
    });

    it('handles empty map in iterations', () => {
      const emptyMap = new WeakRefObjectMap<Record<string, object>>();
      expect(Array.from(emptyMap.entries())).toHaveLength(0);
      expect(Array.from(emptyMap.keys())).toHaveLength(0);
      expect(Array.from(emptyMap.values())).toHaveLength(0);

      const mockCallback = jest.fn();
      emptyMap.forEach(mockCallback);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('[Symbol.iterator] behaves like entries', () => {
      const iterator = map[Symbol.iterator]();
      expect(Array.from(iterator)).toEqual(Array.from(map.entries()));
    });
  });
});

// Commenting until we figure out how best to expose garbage collection in jest env
// describe('WeakDomainProxyMap with garbage collection', () => {
//   it('cleans up weakly referenced objects after garbage collection', () => {
//     if ((global as any).gc) {
//       const map = new WeakDomainProxyMap();
//       let obj: object = { a: 1 };
//       map.set('key', { obj });

//       expect(map.get('key')).toHaveProperty('obj', obj);

//       obj = null!; // Remove the strong reference to the object

//       (global as any).gc(); // Force garbage collection

//       // The weakly referenced object should be gone after garbage collection.
//       expect(map.get('key')).toBeUndefined();
//     } else {
//       console.warn(
//         'Garbage collection is not exposed. Run Node.js with the --expose-gc flag.',
//       );
//     }
//   });
// });
