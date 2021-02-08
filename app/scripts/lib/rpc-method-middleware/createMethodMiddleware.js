import { permittedMethods, selectHooks } from '@mm-snap/rpc-methods';
import { ethErrors } from 'eth-rpc-errors';
import handlers from './handlers';

const getImplementation = ({ implementation, hookNames }) => {
  return (req, res, next, end, hooks) => {
    implementation(req, res, next, end, selectHooks(hooks, hookNames));
  };
};

const handlerMap = handlers.reduce((map, handler) => {
  for (const methodName of handler.methodNames) {
    map.set(methodName, getImplementation(handler));
  }
  return map;
}, new Map());

const pluginHandlerMap = permittedMethods.reduce((map, handler) => {
  for (const methodName of handler.methodNames) {
    map.set(methodName, getImplementation(handler));
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
 * @param {Function} hooks.sendMetrics - A function for sending a metrics event
 * @returns {(req: Object, res: Object, next: Function, end: Function) => void}
 */
export function createMethodMiddleware(hooks) {
  return function methodMiddleware(req, res, next, end) {
    if (handlerMap.has(req.method)) {
      return handlerMap.get(req.method)(req, res, next, end, hooks);
    }
    return next();
  };
}

export function createPluginMethodMiddleware(isPlugin, hooks) {
  return function methodMiddleware(req, res, next, end) {
    if (pluginHandlerMap.has(req.method)) {
      if (/^snap_/iu.test(req.method) && !isPlugin) {
        return end(ethErrors.rpc.methodNotFound());
      }
      return pluginHandlerMap.get(req.method)(req, res, next, end, hooks);
    }
    return next();
  };
}
