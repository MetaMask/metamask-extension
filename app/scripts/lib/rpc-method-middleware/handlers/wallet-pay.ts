import type {
  JsonRpcEngineCallbackError,
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import type { Json, PendingJsonRpcResponse } from '@metamask/utils';
import {
  WALLET_PAY_METHOD,
  type WalletPayRequest,
  type WalletPayResult,
} from '../../wallet-pay';

export type WalletPayHooks = {
  addWalletPayTransaction: (req: WalletPayRequest) => Promise<WalletPayResult>;
};

type WalletPayConstraint = MethodHandler<
  WalletPayHooks,
  never,
  Json[],
  WalletPayResult
>;

export const walletPayHandler = {
  implementation: walletPayImplementation,
  hookNames: {
    addWalletPayTransaction: true,
  },
} satisfies WalletPayConstraint;

const walletPayHandlers = {
  [WALLET_PAY_METHOD]: walletPayHandler,
};

export default walletPayHandlers;

/**
 * `wallet_pay` handler; delegates to `app/scripts/lib/wallet-pay`.
 *
 * @param req - The JSON-RPC request.
 * @param res - The JSON-RPC response.
 * @param _next - Unused.
 * @param end - Ends the request, with an error if one was thrown.
 * @param hooks - Method hooks.
 * @param hooks.addWalletPayTransaction - Handles the request and resolves with the result.
 */
async function walletPayImplementation(
  req: WalletPayRequest,
  res: PendingJsonRpcResponse<WalletPayResult>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { addWalletPayTransaction }: WalletPayHooks,
): Promise<void> {
  try {
    res.result = await addWalletPayTransaction(req);
    return end();
  } catch (error) {
    return end(error as JsonRpcEngineCallbackError);
  }
}
