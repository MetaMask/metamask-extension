import { rpcErrors } from '@metamask/rpc-errors';
import type { JsonRpcMiddleware } from 'json-rpc-engine';

/**
 * Creates a middleware that rejects explicitly unsupported RPC methods with the
 * appropriate error.
 *
 * @param methods
 */
export function createUnsupportedMethodMiddleware(
  methods: string[],
): JsonRpcMiddleware<unknown, void> {
  return async function unsupportedMethodMiddleware(req, _res, next, end) {
    if (methods.includes(req.method)) {
      return end(rpcErrors.methodNotSupported());
    }
    return next();
  };
}
