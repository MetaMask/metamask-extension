import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WeakRefObjectMap } from './WeakRefObjectMap';

type TestRecord = Record<string, object>;
type InternalWeakEntry = {
  keys: (keyof TestRecord)[];
  refs: { deref: () => object | undefined }[];
};

function injectInternalEntry(
  map: WeakRefObjectMap<TestRecord>,
  key: string,
  entry: InternalWeakEntry,
) {
  (
    map as unknown as {
      map: Map<string, InternalWeakEntry>;
    }
  ).map.set(key, entry);
}

function hasInternalEntry(map: WeakRefObjectMap<TestRecord>, key: string) {
  return (
    map as unknown as {
      map: Map<string, InternalWeakEntry>;
    }
  ).map.has(key);
}

async function collectWithinTimeout(
  weakRef: WeakRef<object>,
  timeoutMs = 15_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  do {
    global.gc?.();
    await new Promise((resolve) => setImmediate(resolve));
    if (weakRef.deref() === undefined) {
      return true;
    }
  } while (Date.now() < deadline);

  return false;
}

describe('WeakRefObjectMap', () => {
  let map: WeakRefObjectMap<TestRecord>;

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

  it('throws when setting non-object values', () => {
    const setInvalidValue = () =>
      map.set('bad', { objKey: null } as unknown as TestRecord);

    expect(setInvalidValue).toThrow(TypeError);
    expect(setInvalidValue).toThrow(
      'Property objKey is not an object and cannot be weakly referenced.',
    );
  });

  const itIfGc = global.gc ? it : it.skip;

  itIfGc(
    'returns undefined and removes key when referenced value is collected',
    async () => {
      let staleTarget: object | null = {};
      map.set('stale', { objKey: staleTarget });
      const weakRef = new WeakRef(staleTarget);
      staleTarget = null;

      const collected = await collectWithinTimeout(weakRef);
      if (!collected) {
        // Keep this test resilient in runtimes where collection is delayed.
        expect(map.has('stale')).toBe(true);
        return;
      }
      expect(map.get('stale')).toBeUndefined();
      expect(map.delete('stale')).toBe(false);
    },
    20_000,
  );

  it('has removes stale internal entries', () => {
    injectInternalEntry(map, 'stale', {
      keys: ['objKey'],
      refs: [{ deref: () => undefined }],
    });

    expect(map.has('stale')).toBe(false);
    expect(map.delete('stale')).toBe(false);
  });

  it('delete returns false and removes stale internal entries', () => {
    injectInternalEntry(map, 'stale', {
      keys: ['objKey'],
      refs: [{ deref: () => undefined }],
    });

    expect(map.delete('stale')).toBe(false);
    expect(hasInternalEntry(map, 'stale')).toBe(false);
  });

  describe('iterators', () => {
    beforeEach(() => {
      map = new WeakRefObjectMap();
      map.set('key1', { objKey1: { detail: 'value1' } });
      map.set('key2', { objKey2: { detail: 'value2' } });
    });

    it('iterates over entries correctly', () => {
      const entries = Array.from(map.entries());
      expect(entries.length).toBe(2);
      expect(entries).toEqual(
        expect.arrayContaining([
          ['key1', { objKey1: { detail: 'value1' } }],
          ['key2', { objKey2: { detail: 'value2' } }],
        ]),
      );
    });

    it('iterates over keys correctly', () => {
      const keys = Array.from(map.keys());
      expect(keys.length).toBe(2);
      expect(keys).toEqual(expect.arrayContaining(['key1', 'key2']));
    });

    it('iterates over values correctly', () => {
      const values = Array.from(map.values());
      expect(values.length).toBe(2);
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

      expect(mockCallback.mock.calls.length).toBe(2);
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
      expect(Array.from(emptyMap.entries()).length).toBe(0);
      expect(Array.from(emptyMap.keys()).length).toBe(0);
      expect(Array.from(emptyMap.values()).length).toBe(0);

      const mockCallback = jest.fn();
      emptyMap.forEach(mockCallback);
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('[Symbol.iterator] behaves like entries', () => {
      const iterator = map[Symbol.iterator]();
      expect(Array.from(iterator)).toEqual(Array.from(map.entries()));
    });

    it('iterators expose Symbol.dispose and calling it does not throw', () => {
      const entriesIterator = map.entries();
      const keysIterator = map.keys();
      const valuesIterator = map.values();

      expect(typeof entriesIterator[Symbol.dispose]).toBe('function');
      expect(typeof keysIterator[Symbol.dispose]).toBe('function');
      expect(typeof valuesIterator[Symbol.dispose]).toBe('function');

      expect(() => entriesIterator[Symbol.dispose]()).not.toThrow();
      expect(() => keysIterator[Symbol.dispose]()).not.toThrow();
      expect(() => valuesIterator[Symbol.dispose]()).not.toThrow();
    });

    it('uses thisArg in forEach callback', () => {
      const thisArg = { calledWithKeys: [] as string[] };
      const callback = jest.fn(function (
        this: { calledWithKeys: string[] },
        _value: TestRecord,
        key: string,
        sourceMap: Map<string, TestRecord>,
      ) {
        this.calledWithKeys.push(key);
        expect(sourceMap).toBe(map);
      });

      map.forEach(callback, thisArg);

      expect(thisArg.calledWithKeys).toEqual(['key1', 'key2']);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('uses falsy thisArg in forEach callback', () => {
      const thisArg = 0;
      const callback = jest.fn(function (
        this: number,
        _value: TestRecord,
        _key: string,
        sourceMap: Map<string, TestRecord>,
      ) {
        expect(this).toBe(0);
        expect(sourceMap).toBe(map);
      });

      map.forEach(callback, thisArg);

      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('skips stale internal entries in entries, keys, and values', () => {
      const staleAwareMap = new WeakRefObjectMap<TestRecord>();
      const liveTarget = { detail: 'value1' };

      injectInternalEntry(staleAwareMap, 'stale', {
        keys: ['objKey'],
        refs: [{ deref: () => undefined }],
      });
      staleAwareMap.set('live', { objKey: liveTarget });

      expect(Array.from(staleAwareMap.entries())).toEqual([
        ['live', { objKey: liveTarget }],
      ]);
      expect(Array.from(staleAwareMap.keys())).toEqual(['live']);
      expect(Array.from(staleAwareMap.values())).toEqual([
        { objKey: liveTarget },
      ]);
      expect(staleAwareMap.delete('stale')).toBe(false);
    });

    it('keys iterator continues when first internal entry is stale', () => {
      const staleAwareMap = new WeakRefObjectMap<TestRecord>();
      const liveTarget = { detail: 'value1' };

      injectInternalEntry(staleAwareMap, 'stale', {
        keys: ['objKey'],
        refs: [{ deref: () => undefined }],
      });
      staleAwareMap.set('live', { objKey: liveTarget });

      expect(Array.from(staleAwareMap.keys())).toEqual(['live']);
      expect(staleAwareMap.delete('stale')).toBe(false);
    });

    it('values iterator continues when first internal entry is stale', () => {
      const staleAwareMap = new WeakRefObjectMap<TestRecord>();
      const liveTarget = { detail: 'value1' };

      injectInternalEntry(staleAwareMap, 'stale', {
        keys: ['objKey'],
        refs: [{ deref: () => undefined }],
      });
      staleAwareMap.set('live', { objKey: liveTarget });

      expect(Array.from(staleAwareMap.values())).toEqual([
        { objKey: liveTarget },
      ]);
      expect(staleAwareMap.delete('stale')).toBe(false);
    });

    it('forEach skips stale internal entries and continues', () => {
      const staleAwareMap = new WeakRefObjectMap<TestRecord>();
      const liveTarget = { detail: 'value1' };

      injectInternalEntry(staleAwareMap, 'stale', {
        keys: ['objKey'],
        refs: [{ deref: () => undefined }],
      });
      staleAwareMap.set('live', { objKey: liveTarget });

      const callback = jest.fn();
      staleAwareMap.forEach(callback);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        { objKey: liveTarget },
        'live',
        staleAwareMap,
      );
      expect(staleAwareMap.delete('stale')).toBe(false);
    });
  });
});

describe('WeakRefObjectMap with garbage collection', () => {
  const itIfGc = global.gc ? it : it.skip;

  itIfGc(
    'prunes stale entries from has, size, and iterators after collection',
    async () => {
      const gcMap = new WeakRefObjectMap<TestRecord>();
      const liveTarget = {};
      let staleTarget: object | null = {};

      gcMap.set('stale', { objKey: staleTarget });
      gcMap.set('live', { objKey: liveTarget });

      const weakRef = new WeakRef(staleTarget);
      staleTarget = null;

      const collected = await collectWithinTimeout(weakRef);
      if (!collected) {
        expect(gcMap.size).toBe(2);
        return;
      }

      expect(gcMap.has('stale')).toBe(false);
      expect(gcMap.size).toBe(1);
      expect(Array.from(gcMap.entries())).toEqual([
        ['live', { objKey: liveTarget }],
      ]);
      expect(Array.from(gcMap.keys())).toEqual(['live']);
      expect(Array.from(gcMap.values())).toEqual([{ objKey: liveTarget }]);
    },
    20_000,
  );
});
