import addEthereumChain from './add-ethereum-chain';
import ethAccounts from './eth-accounts';
import getProviderState from './get-provider-state';
import logWeb3ShimUsage from './log-web3-shim-usage';
import requestAccounts from './request-accounts';
import sendMetadata from './send-metadata';
import switchEthereumChain from './switch-ethereum-chain';
import watchAsset from './watch-asset';

///: BEGIN:ONLY_INCLUDE_IN(desktop)
import enableDesktop from './desktop/enable-desktop';
///: END:ONLY_INCLUDE_IN

const handlers = [
  addEthereumChain,
  ethAccounts,
  getProviderState,
  logWeb3ShimUsage,
  requestAccounts,
  sendMetadata,
  switchEthereumChain,
  watchAsset,
  ///: BEGIN:ONLY_INCLUDE_IN(desktop)
  enableDesktop,
  ///: END:ONLY_INCLUDE_IN
];
export default handlers;
