import createRandomId from './random-id';

describe('createRandomId', () => {
  it('returns a number', () => {
    expect(typeof createRandomId()).toBe('number');
  });

  it('returns unique values on successive calls', () => {
    const ids = Array.from({ length: 10 }, () => createRandomId());
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('returns values that increment by 1 on successive calls', () => {
    const first = createRandomId();
    const second = createRandomId();
    expect(second).toBe(first + 1);
  });

  it('returns values within safe integer range', () => {
    const id = createRandomId();
    expect(id).toBeGreaterThanOrEqual(0);
    expect(id).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });

  it('wraps so the id after MAX_SAFE_INTEGER - 1 is 0', () => {
    const MAX = Number.MAX_SAFE_INTEGER;
    jest.resetModules();
    const getRandomValuesSpy = jest
      .spyOn(globalThis.crypto, 'getRandomValues')
      .mockImplementation((array: ArrayBufferView | null) => {
        if (!array) {
          return array;
        }
        (array as BigUint64Array)[0] = BigInt(MAX - 2);
        return array;
      });

    // eslint-disable-next-line @typescript-eslint/no-require-imports -- intentional post-resetModules reload
    const { default: createRandomIdFromSeed } = require('./random-id') as {
      default: () => number;
    };

    expect(createRandomIdFromSeed()).toBe(MAX - 2);
    expect(createRandomIdFromSeed()).toBe(MAX - 1);
    expect(createRandomIdFromSeed()).toBe(0);
    expect(createRandomIdFromSeed()).toBe(1);

    getRandomValuesSpy.mockRestore();
  });
});
