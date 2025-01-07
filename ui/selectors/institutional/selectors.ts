import { toChecksumAddress } from 'ethereumjs-util';
import { getAccountType } from '../selectors';
import { getSelectedInternalAccount } from '../accounts';
import {
  ProviderConfigState,
  getProviderConfig,
} from '../../../shared/modules/selectors/networks';
import { hexToDecimal } from '../../../shared/modules/conversion.utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../app/scripts/lib/multichain/address';
import { AccountType } from '../../../shared/constants/custody';
import { MetaMaskReduxState } from '../../store/store';
import { MetaMaskSliceControllerState } from '../../ducks/metamask/metamask';

export function getWaitForConfirmDeepLinkDialog(
  state: MetaMaskSliceControllerState<'CustodyController'>,
) {
  return state.metamask.CustodyController.waitForConfirmDeepLinkDialog;
}

export function getTransactionStatusMap(
  state: MetaMaskSliceControllerState<'CustodyController'>,
) {
  return state.metamask.CustodyController.custodyStatusMaps;
}

export function getCustodyAccountDetails(
  state: MetaMaskSliceControllerState<'CustodyController'>,
) {
  return state.metamask.CustodyController.custodyAccountDetails;
}

export function getCustodyAccountSupportedChains(
  state: MetaMaskSliceControllerState<'CustodyController'>,
  address: string,
): { supportedChains: string[] } | undefined {
  const chains = state.metamask.CustodyController.custodianSupportedChains
    ? state.metamask.CustodyController.custodianSupportedChains[
        toChecksumAddress(address)
      ]
    : undefined;
  if (chains && 'supportedChains' in chains) {
    return chains;
  }
  return undefined;
}

export function getMmiPortfolioEnabled(
  state: MetaMaskSliceControllerState<'MmiConfigurationController'>,
) {
  if (process.env.IN_TEST) {
    return true;
  }

  return state.metamask.MmiConfigurationController.mmiConfiguration?.portfolio
    ?.enabled;
}

export function getMmiPortfolioUrl(
  state: MetaMaskSliceControllerState<'MmiConfigurationController'>,
) {
  return (
    state.metamask.MmiConfigurationController.mmiConfiguration?.portfolio
      ?.url ?? ''
  );
}

export function getConfiguredCustodians(
  state: MetaMaskSliceControllerState<'MmiConfigurationController'>,
) {
  return (
    state.metamask.MmiConfigurationController.mmiConfiguration?.custodians || []
  );
}

export function getCustodianIconForAddress(
  state: MetaMaskSliceControllerState<
    'CustodyController' | 'MmiConfigurationController'
  >,
  address: string,
) {
  let custodianIcon;

  const checksummedAddress = address && normalizeSafeAddress(address);
  if (
    checksummedAddress &&
    state.metamask.CustodyController.custodyAccountDetails?.[checksummedAddress]
  ) {
    const { custodianName } =
      state.metamask.CustodyController.custodyAccountDetails[
        checksummedAddress
      ];
    custodianIcon =
      state.metamask.MmiConfigurationController.mmiConfiguration?.custodians?.find(
        (custodian) => custodian.envName === custodianName,
      )?.iconUrl;
  }

  return custodianIcon;
}

export function getIsCustodianSupportedChain(
  state: MetaMaskSliceControllerState<'CustodyController'> &
    Parameters<typeof getSelectedInternalAccount>[0] &
    Parameters<typeof getAccountType>[0] &
    ProviderConfigState,
) {
  try {
    const selectedAccount = getSelectedInternalAccount(state);
    const accountType = getAccountType(state);

    if (!selectedAccount || !accountType) {
      throw new Error('Invalid state');
    }

    const providerConfig = getProviderConfig(state);

    if (typeof providerConfig.chainId !== 'string') {
      throw new Error('Chain ID must be a string');
    }

    // eslint-disable-next-line require-unicode-regexp
    if (!/^0x[0-9a-f]+$/i.test(providerConfig.chainId)) {
      throw new Error('Chain ID must be a hexadecimal number');
    }

    if (accountType !== AccountType.CUSTODY) {
      return true;
    }

    const supportedChains = getCustodyAccountSupportedChains(
      state,
      selectedAccount.address,
    );

    if (!supportedChains?.supportedChains) {
      return true;
    }

    return supportedChains.supportedChains.includes(
      hexToDecimal(providerConfig.chainId),
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export function getMMIAddressFromModalOrAddress(
  state: MetaMaskSliceControllerState<'MmiConfigurationController'> &
    Parameters<typeof getSelectedInternalAccount>[0] &
    Pick<MetaMaskReduxState, 'appState'>,
) {
  const modalAddress = state?.appState?.modal?.modalState?.props?.address;
  const selectedAddress = getSelectedInternalAccount(state)?.address;

  return modalAddress || selectedAddress;
}

export function getMMIConfiguration(
  state: MetaMaskSliceControllerState<'MmiConfigurationController'>,
) {
  return state.metamask.MmiConfigurationController.mmiConfiguration ?? {};
}

export function getInteractiveReplacementToken(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  return state.metamask.AppStateController.interactiveReplacementToken ?? {};
}

export function getCustodianDeepLink(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  return state.metamask.AppStateController.custodianDeepLink ?? {};
}

export function getIsNoteToTraderSupported(
  state: MetaMaskSliceControllerState<
    'CustodyController' | 'MmiConfigurationController'
  >,
  fromChecksumHexAddress: string,
) {
  const {
    CustodyController: { custodyAccountDetails },
    MmiConfigurationController: { mmiConfiguration },
  } = state.metamask;
  const accountDetails = custodyAccountDetails?.[fromChecksumHexAddress];

  if (!accountDetails) {
    return false;
  }

  const foundCustodian = mmiConfiguration?.custodians?.find(
    (custodian) => custodian.envName === accountDetails.custodianName,
  );

  return foundCustodian ? foundCustodian.isNoteToTraderSupported : false;
}

export function getIsCustodianPublishesTransactionSupported(
  state: MetaMaskSliceControllerState<
    'CustodyController' | 'MmiConfigurationController'
  >,
  fromChecksumHexAddress: string,
) {
  const {
    CustodyController: { custodyAccountDetails },
    MmiConfigurationController: { mmiConfiguration },
  } = state.metamask;
  const accountDetails = custodyAccountDetails?.[fromChecksumHexAddress];

  if (!accountDetails) {
    return false;
  }

  const foundCustodian = mmiConfiguration?.custodians?.find(
    (custodian) => custodian.envName === accountDetails.custodianName,
  );

  return foundCustodian ? foundCustodian.custodianPublishesTransaction : false;
}

export function getNoteToTraderMessage(
  state: MetaMaskSliceControllerState<'AppStateController'>,
) {
  return state.metamask.AppStateController.noteToTraderMessage ?? '';
}
