import { permittedMethods, selectHooks } from '@mm-snap/rpc-methods';
import { ethErrors } from 'eth-rpc-errors';
import { UNSUPPORTED_RPC_METHODS } from '../../../../shared/constants/network';
import handlers from './handlers';

const handlerMap = handlers.reduce((map, handler) => {
  for (const methodName of handler.methodNames) {
    map.set(methodName, handler);
  }
  return map;
}, new Map());

const pluginHandlerMap = permittedMethods.reduce((map, handler) => {
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
 * @param {Object} hooks - The middleware options
 * @returns {(req: Object, res: Object, next: Function, end: Function) => void}
 */
export function createMethodMiddleware(hooks) {
  return function methodMiddleware(req, res, next, end) {
    // Reject unsupported methods.
    if (UNSUPPORTED_RPC_METHODS.has(req.method)) {
      return end(ethErrors.rpc.methodNotSupported());
    }

    const handler = handlerMap.get(req.method);
    if (handler) {
      const { implementation, hookNames } = handler;
      return implementation(req, res, next, end, selectHooks(hooks, hookNames));
    }

    return next();
  };
}

export function createPluginMethodMiddleware(isPlugin, hooks) {
  return function methodMiddleware(req, res, next, end) {
    const handler = pluginHandlerMap.get(req.method);
    if (handler) {
      if (/^snap_/iu.test(req.method) && !isPlugin) {
        return end(ethErrors.rpc.methodNotFound());
      }

      const { implementation, hookNames } = handler;
      return implementation(req, res, next, end, selectHooks(hooks, hookNames));
    }

    return next();
  };
}
