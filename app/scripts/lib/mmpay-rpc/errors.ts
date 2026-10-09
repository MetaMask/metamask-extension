import { providerErrors, rpcErrors } from '@metamask/rpc-errors';

export const MMPAY_RPC_METHOD = 'wallet_mmPay';

export const mmPayRpcErrors = {
  invalidParams: (field: string, expected: string) =>
    rpcErrors.invalidParams({
      message: `${MMPAY_RPC_METHOD}: invalid "${field}", expected ${expected}.`,
    }),

  unsupportedType: (type: string) =>
    rpcErrors.methodNotFound({
      message: `${MMPAY_RPC_METHOD}: type "${type}" is not available.`,
    }),

  unauthorizedAccount: () =>
    providerErrors.unauthorized({
      message: `${MMPAY_RPC_METHOD}: "from" is not an account connected to this site.`,
    }),

  networkUnavailable: (chainId: string) =>
    rpcErrors.internal({
      message: `${MMPAY_RPC_METHOD}: network ${chainId} is not available.`,
    }),
};
