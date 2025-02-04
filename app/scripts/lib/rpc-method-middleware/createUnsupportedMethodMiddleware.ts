import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { JsonRpcParams } from '@metamask/utils';
import { rpcErrors } from '@metamask/rpc-errors';

/**
 * Creates a middleware that rejects explicitly unsupported RPC methods with the
 * appropriate error.
 *
 * @param methods - The list of unsupported RPC methods.
 */
export function createUnsupportedMethodMiddleware(
  methods: string[],
): JsonRpcMiddleware<JsonRpcParams, null> {
  return async function unsupportedMethodMiddleware(req, _res, next, end) {
    if (methods.includes(req.method)) {
      return end(rpcErrors.methodNotSupported());
    }
    return next();
  };
}
