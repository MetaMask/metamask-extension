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

  it('invalidate() mid-flight drops the in-flight promise so the next caller issues a fresh request', async () => {
    let resolveFirst: ((v: string) => void) | undefined;
    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const fn = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce('fresh');

    const firstCall = coalesceBackgroundRequest('k', fn);
    // Flush microtasks so fn() runs and the in-flight entry is settled.
    await Promise.resolve();
    invalidateCoalescedRequest('k');

    const secondCall = coalesceBackgroundRequest('k', fn);
    resolveFirst?.('stale');

    const [first, second] = await Promise.all([firstCall, secondCall]);
    expect(first).toBe('stale');
    expect(second).toBe('fresh');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not overwrite a newer cache entry when a previously-invalidated promise resolves late', async () => {
    let resolveFirst: ((v: string) => void) | undefined;
    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const fn = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce('fresh');

    const firstCall = coalesceBackgroundRequest('k', fn);
    await Promise.resolve();
    invalidateCoalescedRequest('k');
    const secondCall = coalesceBackgroundRequest('k', fn);
    // Resolve the newer call first so its value lands in the cache.
    await secondCall;
    // Now the older, evicted promise settles — it must not clobber the fresh cache.
    resolveFirst?.('stale');
    await firstCall;

    const third = await coalesceBackgroundRequest('k', fn);
    expect(third).toBe('fresh');
  });

  it('drops in-flight entry when fn throws synchronously so the next caller retries', async () => {
    const fn = jest
      .fn<Promise<string>, []>()
      .mockImplementationOnce(() => {
        throw new Error('sync boom');
      })
      .mockResolvedValueOnce('recovered');

    await expect(coalesceBackgroundRequest('k', fn)).rejects.toThrow(
      'sync boom',
    );
    const result = await coalesceBackgroundRequest('k', fn);
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
