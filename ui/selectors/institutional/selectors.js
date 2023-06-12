import { toChecksumAddress } from 'ethereumjs-util';
import { getSelectedIdentity, getAccountType } from '../selectors';
import { getProviderConfig } from '../../ducks/metamask/metamask';
import { hexToDecimal } from '../../../shared/modules/conversion.utils';

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
  const providerConfig = getProviderConfig(state);

  const supportedChains =
    accountType === 'custody'
      ? getCustodyAccountSupportedChains(state, selectedIdentity.address)
      : null;

  return supportedChains?.supportedChains
    ? supportedChains.supportedChains.includes(
        hexToDecimal(providerConfig.chainId),
      )
    : true;
}

export function getMMIAddressFromModalOrAddress(state) {
  return (
    state.appState.modal.modalState.props.address ||
    state.metamask.selectedAddress
  );
}

export function getMMIConfiguration(state) {
  return state.metamask.mmiConfiguration || [];
}

export function getInteractiveReplacementToken(state) {
  return state.metamask.interactiveReplacementToken || {};
}

export function getIsNoteToTraderSupported(state, fromChecksumHexAddress) {
  let isNoteToTraderSupported = false;
  if (state.metamask.custodyAccountDetails?.[fromChecksumHexAddress]) {
    const { custodianName } =
      state.metamask.custodyAccountDetails[fromChecksumHexAddress];

    isNoteToTraderSupported = state.metamask.mmiConfiguration?.custodians?.find(
      (custodian) => custodian.name === custodianName,
    )?.isNoteToTraderSupported;
  }
  return isNoteToTraderSupported;
}
