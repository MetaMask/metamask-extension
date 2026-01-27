import { RpcRequestCache, globalRpcRequestCache } from './rpc-request-cache';

describe('RpcRequestCache', () => {
  let cache: RpcRequestCache;

  beforeEach(() => {
    cache = new RpcRequestCache();
  });

  describe('enable/disable', () => {
    it('starts disabled by default', () => {
      expect(cache.isEnabled()).toBe(false);
    });

    it('enables and disables the cache', () => {
      cache.enable();
      expect(cache.isEnabled()).toBe(true);

      cache.disable();
      expect(cache.isEnabled()).toBe(false);
    });

    it('clears cache when disabled', async () => {
      cache.enable();

      const executor = jest.fn().mockResolvedValue('result');
      await cache.wrap('network1', 'eth_chainId', [], executor);

      expect(cache.size()).toBe(1);

      cache.disable();
      expect(cache.size()).toBe(0);
    });
  });

  describe('wrap', () => {
    it('executes request directly when cache is disabled', async () => {
      const executor = jest.fn().mockResolvedValue('result1');

      const result1 = await cache.wrap('network1', 'eth_chainId', [], executor);
      const result2 = await cache.wrap('network1', 'eth_chainId', [], executor);

      expect(result1).toBe('result1');
      expect(result2).toBe('result1');
      expect(executor).toHaveBeenCalledTimes(2);
    });

    it('deduplicates identical requests when cache is enabled', async () => {
      cache.enable();

      const executor = jest.fn().mockResolvedValue('result1');

      const result1 = await cache.wrap('network1', 'eth_chainId', [], executor);
      const result2 = await cache.wrap('network1', 'eth_chainId', [], executor);

      expect(result1).toBe('result1');
      expect(result2).toBe('result1');
      expect(executor).toHaveBeenCalledTimes(1);
    });

    it('caches based on network client ID', async () => {
      cache.enable();

      const executor1 = jest.fn().mockResolvedValue('result1');
      const executor2 = jest.fn().mockResolvedValue('result2');

      const result1 = await cache.wrap(
        'network1',
        'eth_chainId',
        [],
        executor1,
      );
      const result2 = await cache.wrap(
        'network2',
        'eth_chainId',
        [],
        executor2,
      );

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(executor1).toHaveBeenCalledTimes(1);
      expect(executor2).toHaveBeenCalledTimes(1);
    });

    it('caches based on method name', async () => {
      cache.enable();

      const executor1 = jest.fn().mockResolvedValue('result1');
      const executor2 = jest.fn().mockResolvedValue('result2');

      const result1 = await cache.wrap(
        'network1',
        'eth_chainId',
        [],
        executor1,
      );
      const result2 = await cache.wrap(
        'network1',
        'eth_accounts',
        [],
        executor2,
      );

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(executor1).toHaveBeenCalledTimes(1);
      expect(executor2).toHaveBeenCalledTimes(1);
    });

    it('caches based on parameters', async () => {
      cache.enable();

      const executor1 = jest.fn().mockResolvedValue('result1');
      const executor2 = jest.fn().mockResolvedValue('result2');

      const result1 = await cache.wrap(
        'network1',
        'eth_call',
        [{ to: '0x123' }],
        executor1,
      );
      const result2 = await cache.wrap(
        'network1',
        'eth_call',
        [{ to: '0x456' }],
        executor2,
      );

      expect(result1).toBe('result1');
      expect(result2).toBe('result2');
      expect(executor1).toHaveBeenCalledTimes(1);
      expect(executor2).toHaveBeenCalledTimes(1);
    });

    it('handles undefined network client ID', async () => {
      cache.enable();

      const executor = jest.fn().mockResolvedValue('result1');

      const result1 = await cache.wrap(undefined, 'eth_chainId', [], executor);
      const result2 = await cache.wrap(undefined, 'eth_chainId', [], executor);

      expect(result1).toBe('result1');
      expect(result2).toBe('result1');
      expect(executor).toHaveBeenCalledTimes(1);
    });

    it('deduplicates concurrent requests', async () => {
      cache.enable();

      let resolveExecutor: (value: string) => void;
      const executorPromise = new Promise<string>((resolve) => {
        resolveExecutor = resolve;
      });
      const executor = jest.fn().mockReturnValue(executorPromise);

      // Start two concurrent requests
      const promise1 = cache.wrap('network1', 'eth_chainId', [], executor);
      const promise2 = cache.wrap('network1', 'eth_chainId', [], executor);

      // Executor should only be called once
      expect(executor).toHaveBeenCalledTimes(1);

      // Resolve the executor
      if (resolveExecutor) {
        resolveExecutor('result1');
      }

      const result1 = await promise1;
      const result2 = await promise2;

      expect(result1).toBe('result1');
      expect(result2).toBe('result1');
    });

    it('removes failed requests from cache immediately', async () => {
      cache.enable();

      const error = new Error('Network error');
      const executor = jest.fn().mockRejectedValue(error);

      await expect(
        cache.wrap('network1', 'eth_chainId', [], executor),
      ).rejects.toThrow('Network error');

      // Cache should be empty after failed request
      expect(cache.size()).toBe(0);

      // Second call should execute again
      await expect(
        cache.wrap('network1', 'eth_chainId', [], executor),
      ).rejects.toThrow('Network error');

      expect(executor).toHaveBeenCalledTimes(2);
    });

    it('expires cached entries after TTL', async () => {
      const shortTtl = 100; // 100ms TTL
      const cacheWithShortTtl = new RpcRequestCache({ ttlMs: shortTtl });
      cacheWithShortTtl.enable();

      const executor = jest.fn().mockResolvedValue('result1');

      await cacheWithShortTtl.wrap('network1', 'eth_chainId', [], executor);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, shortTtl + 50));

      // Second call should execute again after TTL expires
      await cacheWithShortTtl.wrap('network1', 'eth_chainId', [], executor);

      expect(executor).toHaveBeenCalledTimes(2);
    });
  });

  describe('clear', () => {
    it('clears all cached entries', async () => {
      cache.enable();

      const executor1 = jest.fn().mockResolvedValue('result1');
      const executor2 = jest.fn().mockResolvedValue('result2');

      await cache.wrap('network1', 'eth_chainId', [], executor1);
      await cache.wrap('network1', 'eth_accounts', [], executor2);

      expect(cache.size()).toBe(2);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('returns the number of cached entries', async () => {
      cache.enable();

      expect(cache.size()).toBe(0);

      const executor1 = jest.fn().mockResolvedValue('result1');
      const executor2 = jest.fn().mockResolvedValue('result2');

      await cache.wrap('network1', 'eth_chainId', [], executor1);
      expect(cache.size()).toBe(1);

      await cache.wrap('network1', 'eth_accounts', [], executor2);
      expect(cache.size()).toBe(2);
    });
  });

  describe('globalRpcRequestCache', () => {
    it('exports a global singleton instance', () => {
      expect(globalRpcRequestCache).toBeInstanceOf(RpcRequestCache);
    });
  });
});
