import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type { PendingJsonRpcResponse, Hex } from '@metamask/utils';
import { walletUpgradeAccount as walletUpgradeAccountHandler } from '@metamask/eip-7702-internal-rpc-middleware';
import type { HandlerWrapper, HandlerRequestType } from '../types';

type UpgradeAccountResult = {
  transactionHash: string;
  delegatedTo: string;
};

export type WalletUpgradeAccountHooks = {
  upgradeAccount: (
    address: string,
    upgradeContractAddress: string,
    chainId?: Hex,
  ) => Promise<UpgradeAccountResult>;
  getCurrentChainIdForDomain: (origin: string) => Hex | null;
  isEip7702Supported: (request: { address: string; chainId: Hex }) => Promise<{
    isSupported: boolean;
    upgradeContractAddress?: string;
  }>;
  getAccounts: (origin: string) => string[];
};

type UpgradeAccountParams = {
  account: `0x${string}`;
  chainId?: `0x${string}`;
};

type WalletUpgradeAccountConstraint = {
  implementation: (
    req: HandlerRequestType<UpgradeAccountParams>,
    res: PendingJsonRpcResponse<UpgradeAccountResult>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    hooks: WalletUpgradeAccountHooks,
  ) => Promise<void>;
} & HandlerWrapper;

export const walletUpgradeAccount = {
  methodNames: ['wallet_upgradeAccount'],
  implementation: walletUpgradeAccountImplementation,
  hookNames: {
    upgradeAccount: true,
    getCurrentChainIdForDomain: true,
    isEip7702Supported: true,
    getAccounts: true,
  },
} satisfies WalletUpgradeAccountConstraint;

/**
 * Implementation of the `wallet_upgradeAccount` RPC method.
 *
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param hooks - The RPC method hooks.
 * @param hooks.upgradeAccount - Function to upgrade an account.
 * @param hooks.getCurrentChainIdForDomain - Function to get the current chain ID for a domain.
 * @param hooks.isEip7702Supported - Function to check if EIP-7702 is supported.
 * @param hooks.getAccounts - Function to get permitted accounts for the origin.
 */
async function walletUpgradeAccountImplementation(
  req: HandlerRequestType<UpgradeAccountParams>,
  res: PendingJsonRpcResponse<UpgradeAccountResult>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    upgradeAccount,
    getCurrentChainIdForDomain,
    isEip7702Supported,
    getAccounts,
  }: WalletUpgradeAccountHooks,
): Promise<void> {
  // Cast to satisfy the external handler's expected type
  await walletUpgradeAccountHandler(
    req as Parameters<typeof walletUpgradeAccountHandler>[0],
    res,
    {
      upgradeAccount,
      getCurrentChainIdForDomain,
      isEip7702Supported,
      getPermittedAccountsForOrigin: async () => getAccounts(req.origin),
    },
  );
  return end();
}
