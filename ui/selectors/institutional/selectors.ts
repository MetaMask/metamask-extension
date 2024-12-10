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
import { BackgroundStateProxy } from '../../../shared/types/metamask';

type MmiState = {
  metamask: Pick<
    BackgroundStateProxy,
    | 'CustodyController'
    | 'InstitutionalFeaturesController'
    | 'MmiConfigurationController'
    | 'AccountsController'
    | 'AppStateController'
    | 'KeyringController'
  >;
};

type AppState = {
  modal?: {
    modalState?: {
      props?: {
        address?: string;
      };
    };
  };
};

export type State = MmiState & {
  appState?: AppState;
};

export function getWaitForConfirmDeepLinkDialog(state: State) {
  return state.metamask.waitForConfirmDeepLinkDialog;
}

export function getTransactionStatusMap(state: State) {
  return state.metamask.custodyStatusMaps;
}

export function getCustodyAccountDetails(state: State) {
  return state.metamask.custodyAccountDetails;
}

export function getCustodyAccountSupportedChains(
  state: State,
  address: string,
): { supportedChains: string[] } | undefined {
  const chains = state.metamask.custodianSupportedChains
    ? state.metamask.custodianSupportedChains[toChecksumAddress(address)]
    : undefined;

  if (chains && 'supportedChains' in chains) {
    return chains;
  }

  return undefined;
}

export function getMmiPortfolioEnabled(state: State) {
  if (process.env.IN_TEST) {
    return true;
  }

  return state.metamask.mmiConfiguration?.portfolio?.enabled;
}

export function getMmiPortfolioUrl(state: State) {
  return state.metamask.mmiConfiguration?.portfolio?.url || '';
}

export function getConfiguredCustodians(state: State) {
  return state.metamask.mmiConfiguration?.custodians || [];
}

export function getCustodianIconForAddress(state: State, address: string) {
  let custodianIcon;

  const checksummedAddress = address && normalizeSafeAddress(address);
  if (
    checksummedAddress &&
    state.metamask.custodyAccountDetails?.[checksummedAddress]
  ) {
    const { custodianName } =
      state.metamask.custodyAccountDetails[checksummedAddress];
    custodianIcon = state.metamask.mmiConfiguration?.custodians?.find(
      (custodian) => custodian.envName === custodianName,
    )?.iconUrl;
  }

  return custodianIcon;
}

export function getIsCustodianSupportedChain(
  state: State & ProviderConfigState,
) {
  try {
    // @ts-expect-error state types don't match
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

export function getMMIAddressFromModalOrAddress(state: State) {
  const modalAddress = state?.appState?.modal?.modalState?.props?.address;
  // @ts-expect-error state types don't match
  const selectedAddress = getSelectedInternalAccount(state)?.address;

  return modalAddress || selectedAddress;
}

export function getMMIConfiguration(state: State): MmiConfiguration {
  return state.metamask.mmiConfiguration || {};
}

export function getInteractiveReplacementToken(state: State) {
  return state.metamask.interactiveReplacementToken || {};
}

export function getCustodianDeepLink(state: State) {
  return state.metamask.custodianDeepLink || {};
}

export function getIsNoteToTraderSupported(
  state: State,
  fromChecksumHexAddress: string,
) {
  const { custodyAccountDetails, mmiConfiguration } = state.metamask;
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
  state: State,
  fromChecksumHexAddress: string,
) {
  const { custodyAccountDetails, mmiConfiguration } = state.metamask;
  const accountDetails = custodyAccountDetails?.[fromChecksumHexAddress];

  if (!accountDetails) {
    return false;
  }

  const foundCustodian = mmiConfiguration?.custodians?.find(
    (custodian) => custodian.envName === accountDetails.custodianName,
  );

  return foundCustodian ? foundCustodian.custodianPublishesTransaction : false;
}

export function getNoteToTraderMessage(state: State) {
  return state.metamask.noteToTraderMessage || '';
}
