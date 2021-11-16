import { ethErrors } from 'eth-rpc-errors';
import { UNSUPPORTED_RPC_METHODS } from '../../../../shared/constants/network';
import handlers from './handlers';

const handlerMap = handlers.reduce((map, handler) => {
  for (const methodName of handler.methodNames) {
    map.set(methodName, handler);
  }
  return map;
}, new Map());

/**
 * Returns a middleware that implements the RPC methods defined in the handlers
 * directory.
 *
 * The purpose of this middleware is to create portable RPC method
 * implementations that are decoupled from the rest of our background
 * architecture.
 *
 * Handlers consume functions that hook into the background, and only depend
 * on their signatures, not e.g. controller internals.
 *
 * Eventually, we'll want to extract this middleware into its own package.
 *
 * @param {Object} opts - The middleware options
 * @returns {(req: Object, res: Object, next: Function, end: Function) => void}
 */
export default function createMethodMiddleware(opts) {
  return function methodMiddleware(req, res, next, end) {
    // Reject unsupported methods.
    if (UNSUPPORTED_RPC_METHODS.has(req.method)) {
      return end(ethErrors.rpc.methodNotSupported());
    }

    const handler = handlerMap.get(req.method);
    if (handler) {
      const { implementation, hookNames } = handler;
      return implementation(req, res, next, end, selectHooks(opts, hookNames));
    }

    return next();
  };
}

/**
 * Returns the subset of the specified `hooks` that are included in the
 * `hookNames` object. This is a Principle of Least Authority (POLA) measure
 * to ensure that each RPC method implementation only has access to the
 * API "hooks" it needs to do its job.
 *
 * @param {Record<string, unknown>} hooks - The hooks to select from.
 * @param {Record<string, true>} hookNames - The names of the hooks to select.
 * @returns {Record<string, unknown> | undefined} The selected hooks.
 */
function selectHooks(hooks, hookNames) {
  if (hookNames) {
    return Object.keys(hookNames).reduce((hookSubset, hookName) => {
      hookSubset[hookName] = hooks[hookName];
      return hookSubset;
    }, {});
  }
  return undefined;
}
