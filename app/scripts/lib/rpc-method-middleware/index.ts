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

// The primary home of RPC method implementations for the injected 1193 provider API. MUST be subsequent
// to our permissioning logic in the EIP-1193 JSON-RPC middleware pipeline.
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

// A collection of RPC method implementations that, for legacy reasons, MAY precede
// our permissioning logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEthAccountsMethodMiddleware = (hooks: EthAccountsHooks) =>
  createMethodMiddleware({
    handlers: {
      ...ethAccountsHandler,
    },
    hooks,
    onError,
  });

export type MultichainMethodMiddlewareHooks = HandlerHooks &
  MultichainHandlerHooks;

// The primary home of RPC method implementations for the MultiChain API.
export const createMultichainMethodMiddleware = (
  hooks: MultichainMethodMiddlewareHooks,
) =>
  createMethodMiddleware({
    handlers: {
      ...localHandlers,
      ...multichainMethodHandlers,
    },
    hooks,
    onError,
  });
