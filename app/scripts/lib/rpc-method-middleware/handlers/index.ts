import addEthereumChain from './add-ethereum-chain';
import ethAccounts, { type EthAccountsHooks } from './eth-accounts';
import getProviderState, {
  type GetProviderStateHooks,
} from './get-provider-state';
import logWeb3ShimUsage, {
  type LogWeb3ShimUsageHooks,
} from './log-web3-shim-usage';
import requestAccounts, {
  type RequestEthereumAccountsHooks,
} from './request-accounts';
import sendMetadata from './send-metadata';
import switchEthereumChain from './switch-ethereum-chain';
import watchAsset, { type WatchAssetHooks } from './watch-asset';
import getPermissions, {
  type GetPermissionsHooks,
} from './wallet-getPermissions';
import requestPermissions, {
  type RequestPermissionsHooks,
} from './wallet-requestPermissions';
import revokePermissions, {
  type RevokePermissionsHooks,
} from './wallet-revokePermissions';

type AddEthereumChainHooks = Record<string, unknown>;
type SwitchEthereumChainHooks = Record<string, unknown>;

export type HandlerHooks = AddEthereumChainHooks &
  GetProviderStateHooks &
  LogWeb3ShimUsageHooks &
  WatchAssetHooks;

export const handlers = {
  ...addEthereumChain,
  ...getProviderState,
  ...logWeb3ShimUsage,
  ...sendMetadata,
  ...watchAsset,
};

export type Eip1193OnlyHooks = SwitchEthereumChainHooks &
  EthAccountsHooks &
  RequestEthereumAccountsHooks &
  GetPermissionsHooks &
  RequestPermissionsHooks &
  RevokePermissionsHooks;

export const eip1193OnlyHandlers = {
  ...switchEthereumChain,
  ...ethAccounts,
  ...requestAccounts,
  ...getPermissions,
  ...requestPermissions,
  ...revokePermissions,
};

export type { EthAccountsHooks };

export const ethAccountsHandler = ethAccounts;
