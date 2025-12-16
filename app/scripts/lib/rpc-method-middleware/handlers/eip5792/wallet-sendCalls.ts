import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type { JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import {
  walletSendCalls as walletSendCallsHandler,
  processSendCalls,
  type ProcessSendCallsHooks,
  type EIP5792Messenger,
  type SendCallsResult,
  type ProcessSendCallsRequest,
} from '@metamask/eip-5792-middleware';
import type { HandlerWrapper } from '../types';

export type WalletSendCallsHooks = {
  getAccounts: () => string[];
  processSendCallsHooks: ProcessSendCallsHooks;
  eip5792Messenger: EIP5792Messenger;
};

type WalletSendCallsConstraint = {
  implementation: (
    req: JsonRpcRequest,
    res: PendingJsonRpcResponse<SendCallsResult>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    hooks: WalletSendCallsHooks,
  ) => Promise<void>;
} & HandlerWrapper;

export const walletSendCalls = {
  methodNames: ['wallet_sendCalls'],
  implementation: walletSendCallsImplementation,
  hookNames: {
    getAccounts: true,
    processSendCallsHooks: true,
    eip5792Messenger: true,
  },
} satisfies WalletSendCallsConstraint;

/**
 * Implementation of the `wallet_sendCalls` RPC method.
 *
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param hooks - The RPC method hooks.
 * @param hooks.getAccounts - Function that retrieves available accounts for the origin.
 * @param hooks.processSendCallsHooks - Hooks for the processSendCalls function.
 * @param hooks.eip5792Messenger - Messenger instance for controller communication.
 */
async function walletSendCallsImplementation(
  req: JsonRpcRequest,
  res: PendingJsonRpcResponse<SendCallsResult>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getAccounts,
    processSendCallsHooks,
    eip5792Messenger,
  }: WalletSendCallsHooks,
): Promise<void> {
  await walletSendCallsHandler(req, res, {
    getAccounts: async () => getAccounts(),
    processSendCalls: async (params) =>
      processSendCalls(
        processSendCallsHooks,
        eip5792Messenger,
        params,
        req as ProcessSendCallsRequest,
      ),
  });
  return end();
}
