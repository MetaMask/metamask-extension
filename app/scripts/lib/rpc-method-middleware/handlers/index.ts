import type { MethodHandler } from '@metamask/json-rpc-engine';
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
import sendMetadata, { type SendMetadataHooks } from './send-metadata';
import switchEthereumChain from './switch-ethereum-chain';
import watchAsset, { type WatchAssetHooks } from './watch-asset';

type AddEthereumChainHooks = Record<string, unknown>;
type SwitchEthereumChainHooks = Record<string, unknown>;

export type HandlerHooks = AddEthereumChainHooks &
  GetProviderStateHooks &
  LogWeb3ShimUsageHooks &
  RequestEthereumAccountsHooks &
  SendMetadataHooks &
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
  RequestEthereumAccountsHooks;

export const eip1193OnlyHandlers = {
  ...switchEthereumChain,
  ...ethAccounts,
  ...requestAccounts,
};

export type { EthAccountsHooks };

export const ethAccountsHandler = ethAccounts;
