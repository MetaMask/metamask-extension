import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type { JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import {
  walletGetCapabilities as walletGetCapabilitiesHandler,
  getCapabilities,
  type GetCapabilitiesResult,
  type GetCapabilitiesHooks,
  type EIP5792Messenger,
} from '@metamask/eip-5792-middleware';
import type { HandlerWrapper } from '../types';

export type WalletGetCapabilitiesHooks = {
  getAccounts: () => string[];
  getCapabilitiesHooks: GetCapabilitiesHooks;
  eip5792Messenger: EIP5792Messenger;
};

type WalletGetCapabilitiesConstraint = {
  implementation: (
    req: JsonRpcRequest,
    res: PendingJsonRpcResponse<GetCapabilitiesResult>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    hooks: WalletGetCapabilitiesHooks,
  ) => Promise<void>;
} & HandlerWrapper;

export const walletGetCapabilities = {
  methodNames: ['wallet_getCapabilities'],
  implementation: walletGetCapabilitiesImplementation,
  hookNames: {
    getAccounts: true,
    getCapabilitiesHooks: true,
    eip5792Messenger: true,
  },
} satisfies WalletGetCapabilitiesConstraint;

/**
 * Implementation of the `wallet_getCapabilities` RPC method.
 *
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param hooks - The RPC method hooks.
 * @param hooks.getAccounts - Function that retrieves available accounts for the origin.
 * @param hooks.getCapabilitiesHooks - Hooks for the getCapabilities function.
 * @param hooks.eip5792Messenger - Messenger instance for controller communication.
 */
async function walletGetCapabilitiesImplementation(
  req: JsonRpcRequest,
  res: PendingJsonRpcResponse<GetCapabilitiesResult>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getAccounts,
    getCapabilitiesHooks,
    eip5792Messenger,
  }: WalletGetCapabilitiesHooks,
): Promise<void> {
  await walletGetCapabilitiesHandler(req, res, {
    getAccounts: async () => getAccounts(),
    getCapabilities: getCapabilities.bind(
      null,
      getCapabilitiesHooks,
      eip5792Messenger,
    ),
  });
  return end();
}
