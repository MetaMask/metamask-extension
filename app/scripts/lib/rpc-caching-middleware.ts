/**
 * JSON-RPC middleware that caches requests to prevent N+1 API calls.
 *
 * This middleware integrates with the RpcRequestCache to deduplicate
 * identical RPC requests during initialization and other periods when
 * caching is enabled.
 */

import { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import { RpcRequestCache } from './rpc-request-cache';

/**
 * Creates a JSON-RPC middleware that caches requests.
 *
 * @param options - Configuration options
 * @param options.cache - The RPC request cache to use
 * @param options.getNetworkClientId - Optional function to get the network client ID
 * @returns JSON-RPC middleware
 */
export function createRpcCachingMiddleware({
  cache,
  getNetworkClientId,
}: {
  cache: RpcRequestCache;
  getNetworkClientId?: () => string | undefined;
}): JsonRpcMiddleware<unknown[], unknown> {
  return async (req, res, next, end) => {
    // Only cache if the cache is enabled
    if (!cache.isEnabled()) {
      return next();
    }

    // Only cache certain methods that are safe to cache and commonly cause N+1 issues
    const cacheableMethods = [
      'eth_accounts',
      'eth_chainId',
      'eth_blockNumber',
      'net_version',
      'eth_getBalance',
    ];

    if (!cacheableMethods.includes(req.method)) {
      return next();
    }

    const networkClientId = getNetworkClientId?.();
    const params = Array.isArray(req.params) ? req.params : [];

    try {
      const result = await cache.wrap(
        networkClientId,
        req.method,
        params,
        async () => {
          // Execute the original request
          return new Promise<unknown>((resolve, reject) => {
            next((error) => {
              if (error) {
                reject(error);
              } else {
                resolve(res.result);
              }
            });
          });
        },
      );

      res.result = result;
      return end();
    } catch (error) {
      return end(error as Error);
    }
  };
}
