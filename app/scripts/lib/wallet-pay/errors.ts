import { providerErrors, rpcErrors } from '@metamask/rpc-errors';

export const WALLET_PAY_METHOD = 'wallet_pay';

/** Every error `wallet_pay` returns. */
export const walletPayErrors = {
  invalidParams: (details: string) =>
    rpcErrors.invalidParams({
      message: `${WALLET_PAY_METHOD}: invalid params.\n\n${details}`,
    }),

  unsupportedType: (type: string) =>
    rpcErrors.methodNotFound({
      message: `${WALLET_PAY_METHOD}: type "${type}" is not available.`,
    }),

  unauthorizedAccount: () =>
    providerErrors.unauthorized({
      message: `${WALLET_PAY_METHOD}: "from" is not an account connected to this site.`,
    }),

  networkUnavailable: (chainId: string) =>
    rpcErrors.internal({
      message: `${WALLET_PAY_METHOD}: network ${chainId} is not available.`,
    }),
};
