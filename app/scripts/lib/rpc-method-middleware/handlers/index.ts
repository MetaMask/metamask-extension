import addEthereumChain from './add-ethereum-chain';
import ethAccounts from './eth-accounts';
import getProviderState from './get-provider-state';
import logWeb3ShimUsage from './log-web3-shim-usage';
import requestAccounts from './request-accounts';
import sendMetadata from './send-metadata';
import switchEthereumChain from './switch-ethereum-chain';
import watchAsset from './watch-asset';

export const handlers = [
  addEthereumChain,
  getProviderState,
  logWeb3ShimUsage,
  sendMetadata,
  watchAsset,
];

export const eip1193OnlyHandlers = [
  switchEthereumChain,
  ethAccounts,
  requestAccounts,
];

export const ethAccountsHandler = ethAccounts;
