import { ethErrors } from 'eth-rpc-errors';
import type { JsonRpcMiddleware } from 'json-rpc-engine';

/**
 * Creates a middleware that rejects explicitly unsupported RPC methods with the
 * appropriate error.
 */
export function createUnsupportedMethodMiddleware(methods: string[]): JsonRpcMiddleware<
  unknown,
  void
> {
  return async function unsupportedMethodMiddleware(req, _res, next, end) {
    if (methods.includes(req.method)) {
      return end(ethErrors.rpc.methodNotSupported());
    }
    return next();
  };
}
