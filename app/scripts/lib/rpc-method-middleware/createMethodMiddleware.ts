import { createMethodMiddleware } from '@metamask/json-rpc-engine';

import {
  handlers as localHandlers,
  eip1193OnlyHandlers,
  ethAccountsHandler,
  type HandlerHooks,
  type Eip1193OnlyHooks,
  type EthAccountsHooks,
} from './handlers';
import getPermissionsHandler from './handlers/wallet-getPermissions';
import requestPermissionsHandler from './handlers/wallet-requestPermissions';
import revokePermissionsHandler from './handlers/wallet-revokePermissions';

const onError = (error: unknown) => {
  if (process.env.METAMASK_DEBUG) {
    console.error(error);
  }
};

const dummyMessenger = {
  delegate: () => undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// The primary home of RPC method implementations for the injected 1193 provider API. MUST be subsequent
// to our permissioning logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEip1193MethodMiddleware = (
  hooks: HandlerHooks & Eip1193OnlyHooks,
) =>
  createMethodMiddleware({
    handlers: {
      ...localHandlers,
      ...eip1193OnlyHandlers,
      // EIP-2255 Permission handlers
      ...getPermissionsHandler,
      ...requestPermissionsHandler,
      ...revokePermissionsHandler,
    },
    hooks,
    messenger: dummyMessenger,
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
    messenger: dummyMessenger,
    onError,
  });

// The primary home of RPC method implementations for the MultiChain API.
export const createMultichainMethodMiddleware = (hooks: HandlerHooks) =>
  createMethodMiddleware({
    handlers: { ...localHandlers },
    hooks,
    messenger: dummyMessenger,
    onError,
  });
