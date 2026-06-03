import { createMethodMiddleware } from '@metamask/json-rpc-engine';
import {
  methodHandlers as multichainMethodHandlers,
  type MethodHandlerHooks as MultichainHandlerHooks,
} from '@metamask/multichain-api-middleware';

import {
  handlers as localHandlers,
  eip1193OnlyHandlers,
  ethAccountsHandler,
  type HandlerHooks,
  type Eip1193OnlyHooks,
  type EthAccountsHooks,
} from './handlers';

export * from './createUnsupportedMethodMiddleware';

const onError = (error: unknown) => {
  if (process.env.METAMASK_DEBUG) {
    console.error(error);
  }
};

/**
 * The primary home of RPC method implementations for the injected EIP-1193
 * provider API. The returned middleware MUST be placed _after_ our
 * permissioning logic in the EIP-1193 JSON-RPC middleware pipeline.
 *
 * @param hooks - The hooks required by the EIP-1193 method handlers.
 * @returns A JSON-RPC middleware that handles EIP-1193 methods.
 */
export const createEip1193MethodMiddleware = (
  hooks: HandlerHooks & Eip1193OnlyHooks,
) =>
  createMethodMiddleware({
    handlers: {
      ...localHandlers,
      ...eip1193OnlyHandlers,
    },
    hooks,
    onError,
  });

/**
 * A collection of RPC method implementations that, for legacy reasons, MAY
 * precede our permissioning logic in the EIP-1193 JSON-RPC middleware
 * pipeline.
 *
 * @param hooks - The hooks required by the `eth_accounts` handler.
 * @returns A JSON-RPC middleware that handles `eth_accounts`.
 */
export const createEthAccountsMethodMiddleware = (hooks: EthAccountsHooks) =>
  createMethodMiddleware({
    handlers: ethAccountsHandler,
    hooks,
    onError,
  });

/**
 * Handles methods specific to the MultiChain API (e.g., `wallet_createSession`,
 * `wallet_invokeMethod`).
 *
 * The `wallet_invokeMethod` handler unwraps the inner request, mutates `req`
 * in place, and forwards it via `next()`. The unwrapped request is intended
 * to be handled by {@link createMultichainInvokedMethodMiddleware}, which must be
 * pushed onto the engine immediately after the middleware returned here.
 *
 * @param hooks - The hooks required by the MultiChain API method handlers.
 * @returns A JSON-RPC middleware that handles MultiChain API methods.
 */
export const createMultichainApiMethodMiddleware = (
  hooks: MultichainHandlerHooks,
) =>
  createMethodMiddleware({
    handlers: multichainMethodHandlers,
    hooks,
    onError,
  });

/**
 * Handles RPC methods invoked through the MultiChain API via
 * `wallet_invokeMethod` (e.g., `wallet_addEthereumChain`, `wallet_watchAsset`).
 * The returned middleware MUST be placed after
 * {@link createMultichainApiMethodMiddleware} so that requests unwrapped by
 * `wallet_invokeMethod` reach these handlers.
 *
 * @param hooks - The hooks required by the invoked method handlers.
 * @returns A JSON-RPC middleware that handles methods invoked through the
 * MultiChain API.
 */
export const createMultichainInvokedMethodMiddleware = (hooks: HandlerHooks) =>
  createMethodMiddleware({
    handlers: localHandlers,
    hooks,
    onError,
  });
