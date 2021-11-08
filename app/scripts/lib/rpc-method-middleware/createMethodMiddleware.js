///: BEGIN:ONLY_INCLUDE_IN(flask)
import { handlers as permittedMethods } from '@metamask/rpc-methods/dist/permitted';
///: END:ONLY_INCLUDE_IN
import { selectHooks } from '@metamask/rpc-methods/dist/utils';
import { ethErrors } from 'eth-rpc-errors';
import { UNSUPPORTED_RPC_METHODS } from '../../../../shared/constants/network';
import handlers from './handlers';

const handlerMap = handlers.reduce((map, handler) => {
  for (const methodName of handler.methodNames) {
    map.set(methodName, handler);
  }
  return map;
}, new Map());

///: BEGIN:ONLY_INCLUDE_IN(flask)
const snapHandlerMap = permittedMethods.reduce((map, handler) => {
  for (const methodName of handler.methodNames) {
    map.set(methodName, handler);
  }
  return map;
}, new Map());
///: END:ONLY_INCLUDE_IN

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

///: BEGIN:ONLY_INCLUDE_IN(flask)
export function createSnapMethodMiddleware(isSnap, hooks) {
  return function methodMiddleware(req, res, next, end) {
    const handler = snapHandlerMap.get(req.method);
    if (handler) {
      if (/^snap_/iu.test(req.method) && !isSnap) {
        return end(ethErrors.rpc.methodNotFound());
      }

      const { implementation, hookNames } = handler;
      return implementation(req, res, next, end, selectHooks(hooks, hookNames));
    }

    return next();
  };
}
///: END:ONLY_INCLUDE_IN
