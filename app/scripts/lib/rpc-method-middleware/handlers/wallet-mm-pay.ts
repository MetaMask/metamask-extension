import type {
  JsonRpcEngineCallbackError,
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import type { Json, PendingJsonRpcResponse } from '@metamask/utils';
import {
  MMPAY_RPC_METHOD,
  type MmPayRpcRequest,
  type MmPayRpcResult,
} from '../../mmpay-rpc';

export type WalletMmPayHooks = {
  mmPayAddRpcTransaction: (req: MmPayRpcRequest) => Promise<MmPayRpcResult>;
};

type WalletMmPayConstraint = MethodHandler<
  WalletMmPayHooks,
  never,
  Json[],
  MmPayRpcResult
>;

export const walletMmPayHandler = {
  implementation: walletMmPayImplementation,
  hookNames: {
    mmPayAddRpcTransaction: true,
  },
} satisfies WalletMmPayConstraint;

const walletMmPayHandlers = {
  [MMPAY_RPC_METHOD]: walletMmPayHandler,
};

export default walletMmPayHandlers;

/**
 * `wallet_mmPay` handler; delegates to `app/scripts/lib/mmpay-rpc`.
 *
 * @param req - The JSON-RPC request.
 * @param res - The JSON-RPC response.
 * @param _next - Unused.
 * @param end - Ends the request, with an error if one was thrown.
 * @param hooks - Method hooks.
 * @param hooks.mmPayAddRpcTransaction - Handles the request and resolves with the result.
 */
async function walletMmPayImplementation(
  req: MmPayRpcRequest,
  res: PendingJsonRpcResponse<MmPayRpcResult>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { mmPayAddRpcTransaction }: WalletMmPayHooks,
): Promise<void> {
  try {
    res.result = await mmPayAddRpcTransaction(req);
    return end();
  } catch (error) {
    return end(error as JsonRpcEngineCallbackError);
  }
}
