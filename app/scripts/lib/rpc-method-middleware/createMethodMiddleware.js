import { rpcErrors } from '@metamask/rpc-errors';
import { selectHooks } from '@metamask/snaps-rpc-methods';
import { hasProperty } from '@metamask/utils';

import {
  handlers as localHandlers,
  eip1193OnlyHandlers,
  ethAccountsHandler,
} from './handlers';
import { getPermissionsHandler } from './handlers/wallet-getPermissions';
import { requestPermissionsHandler } from './handlers/wallet-requestPermissions';
import { revokePermissionsHandler } from './handlers/wallet-revokePermissions';

// The primary home of RPC method implementations for the injected 1193 provider API. MUST be subsequent
// to our permissioning logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEip1193MethodMiddleware = makeMethodMiddlewareMaker([
  ...localHandlers,
  ...eip1193OnlyHandlers,
  // EIP-2255 Permission handlers
  getPermissionsHandler,
  requestPermissionsHandler,
  revokePermissionsHandler,
]);

// A collection of RPC method implementations that, for legacy reasons, MAY precede
// our permissioning logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEthAccountsMethodMiddleware = makeMethodMiddlewareMaker([
  ethAccountsHandler,
]);

/**
 * Creates a method middleware factory function given a set of method handlers.
 *
 * @param {Record<string, import('@metamask/permission-controller').PermittedHandlerExport>} handlers - The RPC method
 * handler implementations.
 * @returns The method middleware factory function.
 */
function makeMethodMiddlewareMaker(handlers) {
  const handlerMap = handlers.reduce((map, handler) => {
    for (const methodName of handler.methodNames) {
      map[methodName] = handler;
    }
    return map;
  }, {});

  const expectedHookNames = new Set(
    handlers.flatMap(({ hookNames }) => Object.getOwnPropertyNames(hookNames)),
  );

  /**
   * Creates a json-rpc-engine middleware of RPC method implementations.
   *
   * Handlers consume functions that hook into the background, and only depend
   * on their signatures, not e.g. controller internals.
   *
   * @param  {Record<string, (...args: unknown[]) => unknown | Promise<unknown>>} hooks - Required "hooks" into our
   * controllers.
   * @returns {import('@metamask/json-rpc-engine').JsonRpcMiddleware<unknown, unknown>} The method middleware function.
   */
  const makeMethodMiddleware = (hooks) => {
    assertExpectedHook(hooks, expectedHookNames);

    const methodMiddleware = async (req, res, next, end) => {
      const handler = handlerMap[req.method];
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
          return end(
            error instanceof Error
              ? error
              : rpcErrors.internal({ data: error }),
          );
        }
      }

      return next();
    };

    return methodMiddleware;
  };

  return makeMethodMiddleware;
}

/**
 * Asserts that the specified hooks object only has all expected hooks and no extraneous ones.
 *
 * @param {Record<string, unknown>} hooks - Required "hooks" into our controllers.
 * @param {string[]} expectedHookNames - The expected hook names.
 */
function assertExpectedHook(hooks, expectedHookNames) {
  const missingHookNames = [];
  expectedHookNames.forEach((hookName) => {
    if (!hasProperty(hooks, hookName)) {
      missingHookNames.push(hookName);
    }
  });
  if (missingHookNames.length > 0) {
    throw new Error(
      `Missing expected hooks:\n\n${missingHookNames.join('\n')}\n`,
    );
  }

  const extraneousHookNames = Object.getOwnPropertyNames(hooks).filter(
    (hookName) => !expectedHookNames.has(hookName),
  );
  if (extraneousHookNames.length > 0) {
    throw new Error(
      `Received unexpected hooks:\n\n${extraneousHookNames.join('\n')}\n`,
    );
  }
}
