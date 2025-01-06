import { toChecksumAddress } from 'ethereumjs-util';
import { getAccountType } from '../selectors';
import { AccountsState, getSelectedInternalAccount } from '../accounts';
import {
  ProviderConfigState,
  getProviderConfig,
} from '../../../shared/modules/selectors/networks';
import { hexToDecimal } from '../../../shared/modules/conversion.utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../app/scripts/lib/multichain/address';
import { AccountType } from '../../../shared/constants/custody';
import { BackgroundStateProxy } from '../../../shared/types/metamask';
import { MetaMaskReduxState } from '../../store/store';

export function getWaitForConfirmDeepLinkDialog(state: {
  metamask: Pick<BackgroundStateProxy, 'CustodyController'>;
}) {
  return state.metamask.CustodyController.waitForConfirmDeepLinkDialog;
}

export function getTransactionStatusMap(state: {
  metamask: Pick<BackgroundStateProxy, 'CustodyController'>;
}) {
  return state.metamask.CustodyController.custodyStatusMaps;
}

export function getCustodyAccountDetails(state: {
  metamask: Pick<BackgroundStateProxy, 'CustodyController'>;
}) {
  return state.metamask.CustodyController.custodyAccountDetails;
}

export function getCustodyAccountSupportedChains(
  state: {
    metamask: Pick<BackgroundStateProxy, 'CustodyController'>;
  },
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

export function getMmiPortfolioEnabled(state: {
  metamask: Pick<BackgroundStateProxy, 'MmiConfigurationController'>;
}) {
  if (process.env.IN_TEST) {
    return true;
  }

  return state.metamask.MmiConfigurationController.mmiConfiguration?.portfolio
    ?.enabled;
}

export function getMmiPortfolioUrl(state: {
  metamask: Pick<BackgroundStateProxy, 'MmiConfigurationController'>;
}) {
  return (
    state.metamask.MmiConfigurationController.mmiConfiguration?.portfolio
      ?.url || ''
  );
}

export function getConfiguredCustodians(state: {
  metamask: Pick<BackgroundStateProxy, 'MmiConfigurationController'>;
}) {
  return (
    state.metamask.MmiConfigurationController.mmiConfiguration?.custodians || []
  );
}

export function getCustodianIconForAddress(
  state: {
    metamask: Pick<
      BackgroundStateProxy,
      'CustodyController' | 'MmiConfigurationController'
    >;
  },
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
  state: {
    metamask: Pick<BackgroundStateProxy, 'CustodyController'>;
  } & AccountsState &
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
  state: {
    metamask: Pick<BackgroundStateProxy, 'MmiConfigurationController'>;
  } & AccountsState &
    Pick<MetaMaskReduxState, 'appState'>,
) {
  const modalAddress = state?.appState?.modal?.modalState?.props?.address;
  const selectedAddress = getSelectedInternalAccount(state)?.address;

  return modalAddress || selectedAddress;
}

export function getMMIConfiguration(state: {
  metamask: Pick<BackgroundStateProxy, 'MmiConfigurationController'>;
}) {
  return state.metamask.MmiConfigurationController.mmiConfiguration ?? {};
}

export function getInteractiveReplacementToken(state: {
  metamask: Pick<BackgroundStateProxy, 'AppStateController'>;
}) {
  return state.metamask.AppStateController.interactiveReplacementToken ?? {};
}

export function getCustodianDeepLink(state: {
  metamask: Pick<BackgroundStateProxy, 'AppStateController'>;
}) {
  return state.metamask.AppStateController.custodianDeepLink ?? {};
}

export function getIsNoteToTraderSupported(
  state: {
    metamask: Pick<
      BackgroundStateProxy,
      'CustodyController' | 'MmiConfigurationController'
    >;
  },
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
  state: {
    metamask: Pick<
      BackgroundStateProxy,
      'CustodyController' | 'MmiConfigurationController'
    >;
  },
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

export function getNoteToTraderMessage(state: {
  metamask: Pick<BackgroundStateProxy, 'AppStateController'>;
}) {
  return state.metamask.AppStateController.noteToTraderMessage ?? '';
}
