import type { JsonRpcMiddleware } from '@metamask/json-rpc-engine';
import type { JsonRpcParams } from '@metamask/utils';
import { rpcErrors } from '@metamask/rpc-errors';
import { UNSUPPORTED_RPC_METHODS } from '../../../../shared/constants/network';

/**
 * Creates a middleware that rejects explicitly unsupported RPC methods with the
 * appropriate error.
 *
 * @param methods - The list of unsupported RPC methods.
 */
export function createUnsupportedMethodMiddleware(
  methods: Set<string> = UNSUPPORTED_RPC_METHODS,
): JsonRpcMiddleware<JsonRpcParams, null> {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return async function unsupportedMethodMiddleware(req, _res, next, end) {
    if (methods.has(req.method)) {
      return end(rpcErrors.methodNotSupported());
    }
    return next();
  };
}
