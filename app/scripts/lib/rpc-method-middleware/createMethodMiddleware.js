import { permissionRpcMethods } from '@metamask/permission-controller';
import {
  selectHooks,
  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  permittedMethods as permittedSnapMethods,
  ///: END:ONLY_INCLUDE_IF
} from '@metamask/snaps-rpc-methods';
import { ethErrors } from 'eth-rpc-errors';
import { flatten } from 'lodash';
import { UNSUPPORTED_RPC_METHODS } from '../../../../shared/constants/network';
import localHandlers from './handlers';

const allHandlers = [...localHandlers, ...permissionRpcMethods.handlers];

const handlerMap = allHandlers.reduce((map, handler) => {
  for (const methodName of handler.methodNames) {
    map.set(methodName, handler);
  }
  return map;
}, new Map());

const expectedHookNames = Array.from(
  new Set(
    flatten(allHandlers.map(({ hookNames }) => Object.keys(hookNames))),
  ).values(),
);

/**
 * Creates a json-rpc-engine middleware of RPC method implementations.
 *
 * Handlers consume functions that hook into the background, and only depend
 * on their signatures, not e.g. controller internals.
 *
 * @param {Record<string, unknown>} hooks - Required "hooks" into our
 * controllers.
 * @returns {(req: object, res: object, next: Function, end: Function) => void}
 */
export function createMethodMiddleware(hooks) {
  // Fail immediately if we forgot to provide any expected hooks.
  const missingHookNames = expectedHookNames.filter(
    (hookName) => !Object.hasOwnProperty.call(hooks, hookName),
  );
  if (missingHookNames.length > 0) {
    throw new Error(
      `Missing expected hooks:\n\n${missingHookNames.join('\n')}\n`,
    );
  }

  return async function methodMiddleware(req, res, next, end) {
    // Reject unsupported methods.
    if (UNSUPPORTED_RPC_METHODS.has(req.method)) {
      return end(ethErrors.rpc.methodNotSupported());
    }

    const handler = handlerMap.get(req.method);
    if (handler) {
      const { implementation, hookNames } = handler;
      try {
        // Implementations may or may not be async, so we must await them.
        return await implementation(
          req,
          res,
          next,
          end,
          selectHooks(hooks, hookNames),
        );
      } catch (error) {
        if (process.env.METAMASK_DEBUG) {
          console.error(error);
        }
        return end(error);
      }
    }

    return next();
  };
}

///: BEGIN:ONLY_INCLUDE_IF(snaps)
const snapHandlerMap = permittedSnapMethods.reduce((map, handler) => {
  for (const methodName of handler.methodNames) {
    map.set(methodName, handler);
  }
  return map;
}, new Map());

export function createSnapMethodMiddleware(isSnap, hooks) {
  return async function methodMiddleware(req, res, next, end) {
    const handler = snapHandlerMap.get(req.method);
    if (handler) {
      if (/^snap_/iu.test(req.method) && !isSnap) {
        return end(ethErrors.rpc.methodNotFound());
      }

      const { implementation, hookNames } = handler;
      try {
        // Implementations may or may not be async, so we must await them.
        return await implementation(
          req,
          res,
          next,
          end,
          selectHooks(hooks, hookNames),
        );
      } catch (error) {
        if (process.env.METAMASK_DEBUG) {
          console.error(error);
        }
        return end(error);
      }
    }

    return next();
  };
}
///: END:ONLY_INCLUDE_IF
