import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type { PendingJsonRpcResponse, Hex, Json } from '@metamask/utils';
import { walletGetAccountUpgradeStatus as walletGetAccountUpgradeStatusHandler } from '@metamask/eip-7702-internal-rpc-middleware';
import type { HandlerWrapper, HandlerRequestType } from '../types';

export type WalletGetAccountUpgradeStatusHooks = {
  getCurrentChainIdForDomain: (origin: string) => Hex | null;
  getCode: (address: string, networkClientId: string) => Promise<string | null>;
  getSelectedNetworkClientIdForChain: (chainId: string) => string | null;
  getAccounts: (origin: string) => string[];
  isEip7702Supported: (request: { address: string; chainId: Hex }) => Promise<{
    isSupported: boolean;
    upgradeContractAddress?: string;
  }>;
};

type GetAccountUpgradeStatusParams = {
  account: `0x${string}`;
  chainId?: `0x${string}`;
};

type WalletGetAccountUpgradeStatusConstraint = {
  implementation: (
    req: HandlerRequestType<GetAccountUpgradeStatusParams>,
    res: PendingJsonRpcResponse<Json>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    hooks: WalletGetAccountUpgradeStatusHooks,
  ) => Promise<void>;
} & HandlerWrapper;

export const walletGetAccountUpgradeStatus = {
  methodNames: ['wallet_getAccountUpgradeStatus'],
  implementation: walletGetAccountUpgradeStatusImplementation,
  hookNames: {
    getCurrentChainIdForDomain: true,
    getCode: true,
    getSelectedNetworkClientIdForChain: true,
    getAccounts: true,
    isEip7702Supported: true,
  },
} satisfies WalletGetAccountUpgradeStatusConstraint;

/**
 * Implementation of the `wallet_getAccountUpgradeStatus` RPC method.
 *
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param hooks - The RPC method hooks.
 * @param hooks.getCurrentChainIdForDomain - Function to get the current chain ID for a domain.
 * @param hooks.getCode - Function to get the code at an address.
 * @param hooks.getSelectedNetworkClientIdForChain - Function to get the network client ID for a chain.
 * @param hooks.getAccounts - Function to get permitted accounts for the origin.
 * @param hooks.isEip7702Supported - Function to check if EIP-7702 is supported.
 */
async function walletGetAccountUpgradeStatusImplementation(
  req: HandlerRequestType<GetAccountUpgradeStatusParams>,
  res: PendingJsonRpcResponse<Json>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getCurrentChainIdForDomain,
    getCode,
    getSelectedNetworkClientIdForChain,
    getAccounts,
    isEip7702Supported,
  }: WalletGetAccountUpgradeStatusHooks,
): Promise<void> {
  // Cast to satisfy the external handler's expected type
  await walletGetAccountUpgradeStatusHandler(
    req as Parameters<typeof walletGetAccountUpgradeStatusHandler>[0],
    res as PendingJsonRpcResponse,
    {
      getCurrentChainIdForDomain,
      getCode,
      getSelectedNetworkClientIdForChain,
      getPermittedAccountsForOrigin: async () => getAccounts(req.origin),
      isEip7702Supported,
    },
  );
  return end();
}
