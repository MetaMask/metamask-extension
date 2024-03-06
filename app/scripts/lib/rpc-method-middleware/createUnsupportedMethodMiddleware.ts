import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import { rpcErrors } from '@metamask/rpc-errors';
import { UNSUPPORTED_RPC_METHODS } from '../../../../shared/constants/network';

/**
 * Creates a middleware that rejects explicitly unsupported RPC methods with the
 * appropriate error.
 */
export function createUnsupportedMethodMiddleware(): JsonRpcMiddleware<
  unknown,
  void
> {
  return async function unsupportedMethodMiddleware(req, _res, next, end) {
    if ((UNSUPPORTED_RPC_METHODS as Set<string>).has(req.method)) {
      return end(rpcErrors.methodNotSupported());
    }
    return next();
  };
}
