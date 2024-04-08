import { WeakDomainProxyMap } from './WeakDomainProxyMap';

describe('WeakDomainProxyMap', () => {
  let map: WeakDomainProxyMap;

  beforeEach(() => {
    map = new WeakDomainProxyMap();
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
