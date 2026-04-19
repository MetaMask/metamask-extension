import {
  coalesceBackgroundRequest,
  invalidateCoalescedRequest,
  resetCoalesceCacheForTests,
} from './coalesceBackgroundRequest';

describe('coalesceBackgroundRequest', () => {
  beforeEach(() => {
    resetCoalesceCacheForTests();
  });

  it('dedups concurrent callers with the same key into one in-flight request', async () => {
    const fn = jest.fn(
      () => new Promise<number>((resolve) => setTimeout(() => resolve(7), 20)),
    );

    const [a, b, c] = await Promise.all([
      coalesceBackgroundRequest('k', fn),
      coalesceBackgroundRequest('k', fn),
      coalesceBackgroundRequest('k', fn),
    ]);

    expect(a).toBe(7);
    expect(b).toBe(7);
    expect(c).toBe(7);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('serves cached value inside TTL window without re-invoking fn', async () => {
    const fn = jest.fn().mockResolvedValue('v1');
    await coalesceBackgroundRequest('k', fn, 1000);
    const second = await coalesceBackgroundRequest('k', fn, 1000);
    expect(second).toBe('v1');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('re-invokes fn after TTL expires', async () => {
    const fn = jest
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');
    await coalesceBackgroundRequest('k', fn, 5);
    await new Promise((r) => setTimeout(r, 15));
    const second = await coalesceBackgroundRequest('k', fn, 5);
    expect(second).toBe('second');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('keeps cache per-key so different keys do not cross-contaminate', async () => {
    const fnA = jest.fn().mockResolvedValue('A');
    const fnB = jest.fn().mockResolvedValue('B');
    const a = await coalesceBackgroundRequest('a', fnA);
    const b = await coalesceBackgroundRequest('b', fnB);
    expect(a).toBe('A');
    expect(b).toBe('B');
    expect(fnA).toHaveBeenCalledTimes(1);
    expect(fnB).toHaveBeenCalledTimes(1);
  });

  it('invalidate() forces the next call to re-invoke fn', async () => {
    const fn = jest
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');
    await coalesceBackgroundRequest('k', fn, 10_000);
    invalidateCoalescedRequest('k');
    const second = await coalesceBackgroundRequest('k', fn, 10_000);
    expect(second).toBe('second');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('drops in-flight entry on rejection so the next caller retries', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('recovered');

    await expect(coalesceBackgroundRequest('k', fn)).rejects.toThrow('boom');
    const result = await coalesceBackgroundRequest('k', fn);
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
