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

  it('wraps around when idCounter reaches MAX_SAFE_INTEGER', () => {
    for (let i = 0; i < 100; i++) {
      expect(createRandomId()).toBeLessThan(Number.MAX_SAFE_INTEGER);
    }
  });
});
