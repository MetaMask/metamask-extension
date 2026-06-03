import {
  clearAllCoalescedRequests,
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

  it('invalidate() mid-flight preserves the in-flight promise so concurrent callers coalesce into one request', async () => {
    // Rapid-navigation scenario: hook A fires a request, then hook B's
    // forceFreshOnMount refetch invalidates the cache while A is still
    // in flight. B must share A's request rather than fire a duplicate HL
    // call — the in-flight snapshot is the freshest data available.
    let resolveFirst: ((v: string) => void) | undefined;
    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const fn = jest.fn<Promise<string>, []>().mockReturnValueOnce(firstPromise);

    const firstCall = coalesceBackgroundRequest('k', fn);
    await Promise.resolve();
    invalidateCoalescedRequest('k');

    const secondCall = coalesceBackgroundRequest('k', fn);
    resolveFirst?.('shared');

    const [first, second] = await Promise.all([firstCall, secondCall]);
    expect(first).toBe('shared');
    expect(second).toBe('shared');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('invalidate() after resolution forces the next call to fetch fresh', async () => {
    // Post-resolution invalidate (e.g. pull-to-refresh after a cached
    // response) must drop the cached value so the next caller hits the
    // backend again. Tests the cache-only-eviction contract.
    const fn = jest
      .fn<Promise<string>, []>()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');

    await coalesceBackgroundRequest('k', fn);
    invalidateCoalescedRequest('k');
    const second = await coalesceBackgroundRequest('k', fn);

    expect(second).toBe('second');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('clearAllCoalescedRequests() drops in-flight promises so a scope-change fetch cannot await the old scope', async () => {
    // Scope-change scenario (account switch / lock / sign-out): unlike
    // invalidate(), which preserves the in-flight snapshot as the freshest
    // data for the *same* scope, a scope change makes the in-flight response
    // wrong, so it must be abandoned. The next caller issues a fresh
    // request rather than coalescing with the old one.
    let resolveFirst: ((v: string) => void) | undefined;
    const firstPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    const fn = jest
      .fn<Promise<string>, []>()
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce('newScope');

    const firstCall = coalesceBackgroundRequest('k', fn);
    await Promise.resolve();
    clearAllCoalescedRequests();

    const secondCall = coalesceBackgroundRequest('k', fn);
    resolveFirst?.('oldScope');

    const [first, second] = await Promise.all([firstCall, secondCall]);
    expect(first).toBe('oldScope');
    expect(second).toBe('newScope');
    expect(fn).toHaveBeenCalledTimes(2);
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
