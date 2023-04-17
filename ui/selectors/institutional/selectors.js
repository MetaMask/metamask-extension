import { toChecksumAddress } from 'ethereumjs-util';
import { getSelectedIdentity, getAccountType, getProvider } from '../selectors';

export function getWaitForConfirmDeepLinkDialog(state) {
  return state.metamask.waitForConfirmDeepLinkDialog;
}

export function getTransactionStatusMap(state) {
  return state.metamask.custodyStatusMaps;
}

export function getCustodyAccountDetails(state) {
  return state.metamask.custodyAccountDetails;
}

export function getCustodyAccountSupportedChains(state, address) {
  return state.metamask.custodianSupportedChains
    ? state.metamask.custodianSupportedChains[toChecksumAddress(address)]
    : [];
}

export function getMmiPortfolioEnabled(state) {
  return state.metamask.mmiConfiguration?.portfolio?.enabled;
}

export function getMmiPortfolioUrl(state) {
  return state.metamask.mmiConfiguration?.portfolio?.url;
}

export function getConfiguredCustodians(state) {
  return state.metamask.mmiConfiguration?.custodians || [];
}

export function getCustodianIconForAddress(state, address) {
  let custodianIcon;

  const checksummedAddress = toChecksumAddress(address);
  if (state.metamask.custodyAccountDetails?.[checksummedAddress]) {
    const { custodianName } =
      state.metamask.custodyAccountDetails[checksummedAddress];
    custodianIcon = state.metamask.mmiConfiguration?.custodians?.find(
      (custodian) => custodian.name === custodianName,
    )?.iconUrl;
  }

  return custodianIcon;
}

export function getIsCustodianSupportedChain(state) {
  const selectedIdentity = getSelectedIdentity(state);
  const accountType = getAccountType(state);
  const provider = getProvider(state);

  const supportedChains =
    accountType === 'custody'
      ? getCustodyAccountSupportedChains(state, selectedIdentity.address)
      : null;

  return supportedChains?.supportedChains
    ? supportedChains.supportedChains.includes(
        Number(provider.chainId).toString(),
      )
    : true;
}

export function getInteractiveReplacementToken(state) {
  return state.metamask.interactiveReplacementToken || {};
}