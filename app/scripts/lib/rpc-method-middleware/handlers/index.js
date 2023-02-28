import addEthereumChain from './add-ethereum-chain';
import ethAccounts from './eth-accounts';
import getProviderState from './get-provider-state';
import logWeb3ShimUsage from './log-web3-shim-usage';
import requestAccounts from './request-accounts';
import sendMetadata from './send-metadata';
import switchEthereumChain from './switch-ethereum-chain';
import watchAsset from './watch-asset';

///: BEGIN:ONLY_INCLUDE_IN(mmi)
import mmiSupported from './mmi/mmi-supported';
import mmiAuthenticate from './mmi/mmi-authenticate';
import mmiPortfolio from './mmi/mmi-portfolio';
import mmiOpenSwaps from './mmi/mmi-open-swaps';
import mmiCheckIfTokenIsPresent from './mmi/mmi-check-if-token-is-present';
import mmiSetAccountAndNetwork from './mmi/mmi-set-account-and-network';
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
  ///: BEGIN:ONLY_INCLUDE_IN(mmi)
  mmiAuthenticate,
  mmiSupported,
  mmiPortfolio,
  mmiOpenSwaps,
  mmiCheckIfTokenIsPresent,
  mmiSetAccountAndNetwork,
  ///: END:ONLY_INCLUDE_IN
];
export default handlers;
