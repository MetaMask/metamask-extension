import { permissionRpcMethods } from '@metamask/permission-controller';
import { selectHooks } from '@metamask/snaps-rpc-methods';
import { hasProperty } from '@metamask/utils';
import { ethErrors } from 'eth-rpc-errors';
import { UNSUPPORTED_RPC_METHODS } from '../../../../shared/constants/network';
import localHandlers from './handlers';

const allHandlers = [...localHandlers, ...permissionRpcMethods.handlers];

const handlerMap = allHandlers.reduce((map, handler) => {
  for (const methodName of handler.methodNames) {
    map[methodName] = handler;
  }
  return map;
}, {});

const expectedHookNames = new Set(
  allHandlers.flatMap(({ hookNames }) => Object.getOwnPropertyNames(hookNames)),
);

/**
 * Creates a json-rpc-engine middleware of RPC method implementations.
 *
 * Handlers consume functions that hook into the background, and only depend
 * on their signatures, not e.g. controller internals.
 *
 * @param  {Record<string, (...args: unknown[]) => unknown | Promise<unknown>>} hooks - Required "hooks" into our
 * controllers.
 * @returns {import('json-rpc-engine').JsonRpcMiddleware<unknown, unknown>} The method middleware function.
 */
export function createMethodMiddleware(hooks) {
  assertExpectedHook(hooks);

  return async function methodMiddleware(req, res, next, end) {
    // Reject unsupported methods.
    if (UNSUPPORTED_RPC_METHODS.has(req.method)) {
      return end(ethErrors.rpc.methodNotSupported());
    }

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
            : ethErrors.rpc.internal({ data: error }),
        );
      }
    }

    return next();
  };
}

/**
 * Asserts that the hooks object only has all expected hooks and no extraneous ones.
 *
 * @param {Record<string, unknown>} hooks - Required "hooks" into our controllers.
 */
function assertExpectedHook(hooks) {
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
