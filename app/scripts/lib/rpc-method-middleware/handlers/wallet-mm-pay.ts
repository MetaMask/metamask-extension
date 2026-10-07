import { rpcErrors, providerErrors } from '@metamask/rpc-errors';
import type {
  JsonRpcEngineCallbackError,
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
  MethodHandler,
} from '@metamask/json-rpc-engine';
import type {
  Json,
  JsonRpcRequest,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import { MMPAY_RPC_METHOD } from '../../mmpay-dapp/constants';

type RequestExtras = Partial<{
  origin: string;
  networkClientId: string;
  securityAlertResponse: unknown;
  traceContext: unknown;
}>;

export type WalletMmPayRequest = JsonRpcRequest<[Json]> & RequestExtras;

export type WalletMmPayHooks = {
  /** Returns the list of permitted EVM account addresses for the current origin. */
  getAccounts: () => string[];
  /**
   * Creates a dApp-origin perps transaction and awaits the tx hash.
   * Implemented in metamask-controller.js (T7).
   */
  mmPayAddDappTransaction: (
    params: unknown,
    req: WalletMmPayRequest,
  ) => Promise<string>;
};

type WalletMmPayConstraint = MethodHandler<
  WalletMmPayHooks,
  never,
  [Json],
  string,
  RequestExtras
>;

export const walletMmPayHandler = {
  implementation: walletMmPayImplementation,
  hookNames: {
    getAccounts: true,
    mmPayAddDappTransaction: true,
  },
} satisfies WalletMmPayConstraint;

const walletMmPayHandlers = {
  [MMPAY_RPC_METHOD]: walletMmPayHandler,
};

export default walletMmPayHandlers;

/**
 * Handler for the `wallet_mmPay` RPC method.
 *
 * Validates params shape and connected-account precondition, then delegates
 * to the `mmPayAddDappTransaction` hook which performs further validation
 * and returns the final transaction hash.
 *
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param hooks - The hooks provided to this handler.
 * @param hooks.getAccounts - Returns permitted EVM account addresses for the origin.
 * @param hooks.mmPayAddDappTransaction - Creates a dApp-origin perps transaction.
 */
async function walletMmPayImplementation(
  req: WalletMmPayRequest,
  res: PendingJsonRpcResponse<string>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  { getAccounts, mmPayAddDappTransaction }: WalletMmPayHooks,
): Promise<void> {
  try {
    if (!Array.isArray(req.params) || req.params.length !== 1) {
      return end(
        rpcErrors.invalidParams({
          message: 'wallet_mmPay: expected params to be [{ type, amount? }]',
        }),
      );
    }

    const accounts = getAccounts();
    if (!accounts || accounts.length === 0) {
      return end(
        providerErrors.unauthorized({
          message: 'No connected account. Connect to MetaMask first.',
        }),
      );
    }

    res.result = await mmPayAddDappTransaction(req.params[0], req);
    return end();
  } catch (error: unknown) {
    return end(error as JsonRpcEngineCallbackError);
  }
}
