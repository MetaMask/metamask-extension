import addEthereumChain from './add-ethereum-chain';
import ethAccounts from './eth-accounts';
import getProviderState from './get-provider-state';
import logWeb3ShimUsage from './log-web3-shim-usage';
import requestAccounts from './request-accounts';
import sendMetadata from './send-metadata';
import switchEthereumChain from './switch-ethereum-chain';
import watchAsset from './watch-asset';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import mmiSupported from './institutional/mmi-supported';
import mmiAuthenticate from './institutional/mmi-authenticate';
import mmiPortfolio from './institutional/mmi-portfolio';
import mmiCheckIfTokenIsPresent from './institutional/mmi-check-if-token-is-present';
import mmiSetAccountAndNetwork from './institutional/mmi-set-account-and-network';
import mmiOpenAddHardwareWallet from './institutional/mmi-open-add-hardware-wallet';
///: END:ONLY_INCLUDE_IF

export const handlers = [
  addEthereumChain,
  getProviderState,
  logWeb3ShimUsage,
  sendMetadata,
  watchAsset,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  mmiAuthenticate,
  mmiSupported,
  mmiPortfolio,
  mmiCheckIfTokenIsPresent,
  mmiSetAccountAndNetwork,
  mmiOpenAddHardwareWallet,
  ///: END:ONLY_INCLUDE_IF
];

export const eip1193OnlyHandlers = [
  switchEthereumChain,
  ethAccounts,
  requestAccounts,
];

export const ethAccountsHandler = ethAccounts;
