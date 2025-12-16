import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type { JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import {
  walletGetCallsStatus as walletGetCallsStatusHandler,
  getCallsStatus,
  type EIP5792Messenger,
  type GetCallsStatusResult,
} from '@metamask/eip-5792-middleware';
import type { HandlerWrapper } from '../types';

export type WalletGetCallsStatusHooks = {
  eip5792Messenger: EIP5792Messenger;
};

type WalletGetCallsStatusConstraint = {
  implementation: (
    req: JsonRpcRequest,
    res: PendingJsonRpcResponse<GetCallsStatusResult>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    hooks: WalletGetCallsStatusHooks,
  ) => Promise<void>;
} & HandlerWrapper;

export const walletGetCallsStatus = {
  methodNames: ['wallet_getCallsStatus'],
  implementation: walletGetCallsStatusImplementation,
  hookNames: {
    eip5792Messenger: true,
  },
} satisfies WalletGetCallsStatusConstraint;

/**
 * Implementation of the `wallet_getCallsStatus` RPC method.
 *
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param hooks - The RPC method hooks.
 * @param hooks.eip5792Messenger - Messenger instance for controller communication.
 */
async function walletGetCallsStatusImplementation(
  req: JsonRpcRequest,
  res: PendingJsonRpcResponse<GetCallsStatusResult>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { eip5792Messenger }: WalletGetCallsStatusHooks,
): Promise<void> {
  await walletGetCallsStatusHandler(req, res, {
    getCallsStatus: async (id) => getCallsStatus(eip5792Messenger, id),
  });
  return end();
}
