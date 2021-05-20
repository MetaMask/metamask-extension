import addEthereumChain from './add-ethereum-chain';
import switchEthereumChain from './switch-ethereum-chain';
import getProviderState from './get-provider-state';
import logWeb3ShimUsage from './log-web3-shim-usage';
import watchAsset from './watch-asset';

const handlers = [
  addEthereumChain,
  switchEthereumChain,
  getProviderState,
  logWeb3ShimUsage,
  watchAsset,
];
export default handlers;
