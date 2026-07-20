import { addHexPrefix, isHexString } from 'ethereumjs-util';
import type { AnyAction } from 'redux';
import { createSelector } from 'reselect';
import { mergeGasFeeEstimates } from '@metamask/transaction-controller';
import { AlertTypes } from '../../../shared/constants/alerts';
import {
  GasEstimateTypes,
  NetworkCongestionThresholds,
} from '../../../shared/constants/gas';
import {
  getTokensControllerAllTokens,
  getCurrencyRateControllerCurrencyRates,
  getCurrencyRateControllerCurrentCurrency,
  getTokenBalancesControllerTokenBalances,
} from '../../../shared/lib/selectors/assets-migration';
import { KeyringType } from '../../../shared/constants/keyring';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../shared/constants/preferences';
import { decGWEIToHexWEI } from '../../../shared/lib/conversion.utils';
import {
  accountsWithSendEtherInfoSelector,
  checkNetworkAndAccountSupports1559,
  getAddressBook,
} from '../../selectors/selectors';
import { getProviderConfig } from '../../../shared/lib/selectors/networks';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import * as actionConstants from '../../store/actionConstants';
import { updateTransactionGasFees } from '../../store/actions/update-transaction-gas-fees';
import { setCustomGasLimit, setCustomGasPrice } from '../gas/gas.duck';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { EMPTY_ARRAY } from '../../selectors/shared';
import { getIsUnlocked } from './base-selectors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

export type MetamaskState = {
  isInitialized: boolean;
  isUnlocked: boolean;
  internalAccounts: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accounts: Record<string, any>;
    selectedAccount: string;
  };
  transactions: Json[];
  networkConfigurations: Json;
  addressBook: Json[] | Json;
  featureFlags: Json;
  currentLocale: string;
  preferences: Json;
  firstTimeFlowType: string | null;
  completedOnboarding: boolean;
  hasSeenOnboardingCompletionPage: boolean;
  knownMethodData: Json;
  use4ByteResolution: boolean;
  analyticsId: string | null;
  optedIn: boolean;
  completedMetaMetricsOnboarding: boolean;
  dataCollectionForMarketing: boolean | null;
  currencyRates: Record<string, { conversionRate: number | null }>;
  throttledOrigins: Json;
  isSeedlessOnboardingUserAuthenticated: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type RootState = {
  metamask: MetamaskState;
  confirmTransaction?: {
    txData?: Json;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dispatch = (...args: any[]) => any;

const initialState: MetamaskState = {
  isInitialized: false,
  isUnlocked: false,
  internalAccounts: { accounts: {}, selectedAccount: '' },
  transactions: [],
  networkConfigurations: {},
  addressBook: [],
  featureFlags: {},
  currentLocale: '',
  preferences: {
    autoLockTimeLimit: DEFAULT_AUTO_LOCK_TIME_LIMIT,
    showExtensionInFullSizeView: false,
    showFiatInTestnets: false,
    showTestNetworks: false,
    smartTransactionsOptInStatus: true,
    featureNotificationsEnabled: false,
    privacyMode: false,
    showMultiRpcModal: false,
  },
  firstTimeFlowType: null,
  completedOnboarding: false,
  hasSeenOnboardingCompletionPage: false,
  knownMethodData: {},
  use4ByteResolution: true,
  analyticsId: null,
  optedIn: false,
  completedMetaMetricsOnboarding: false,
  dataCollectionForMarketing: null,
  currencyRates: {
    ETH: {
      conversionRate: null,
    },
  },
  throttledOrigins: {},
  isSeedlessOnboardingUserAuthenticated: false,
};

/**
 * Temporary types for this slice so that inferrence of MetaMask state tree can
 * occur
 *
 * @param state - State
 * @param action
 * @returns
 */
export default function reduceMetamask(
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state: Partial<MetamaskState> = initialState,
  action: AnyAction,
): MetamaskState {
  // I don't think we should be spreading initialState into this. Once the
  // state tree has begun by way of the first reduce call the initialState is
  // set. The only time it should be used again is if we reset the state with a
  // deliberate action. However, our tests are *relying upon the initialState
  // tree above to be spread into the reducer as a way of hydrating the state
  // for this slice*. I attempted to remove this and it caused nearly 40 test
  // failures. We are going to refactor this slice anyways, possibly removing
  // it so we will fix this issue when that time comes.
  const metamaskState: MetamaskState = { ...initialState, ...state };
  switch (action.type) {
    case actionConstants.UPDATE_METAMASK_STATE:
      return { ...metamaskState, ...action.value };

    case actionConstants.LOCK_METAMASK:
      return {
        ...metamaskState,
        isUnlocked: false,
      };

    case actionConstants.SET_ACCOUNT_LABEL: {
      const { account } = action.value;
      const name = action.value.label;
      const accountToUpdate = Object.values(
        metamaskState.internalAccounts.accounts,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).find((internalAccount: any) => {
        return internalAccount.address.toLowerCase() === account.toLowerCase();
      });

      if (!accountToUpdate) {
        return metamaskState;
      }

      const internalAccounts = {
        ...metamaskState.internalAccounts,
        accounts: {
          ...metamaskState.internalAccounts.accounts,
          [accountToUpdate.id]: {
            ...accountToUpdate,
            metadata: {
              ...accountToUpdate.metadata,
              name,
            },
          },
        },
      };
      return Object.assign(metamaskState, { internalAccounts });
    }

    case actionConstants.UPDATE_TRANSACTION_PARAMS: {
      const { id: txId, value } = action;
      let { transactions } = metamaskState;
      transactions = transactions.map((tx) => {
        if (tx.id === txId) {
          const newTx = { ...tx };
          newTx.txParams = value;
          return newTx;
        }
        return tx;
      });

      return {
        ...metamaskState,
        transactions,
      };
    }

    case actionConstants.SET_PARTICIPATE_IN_METAMETRICS:
      return {
        ...metamaskState,
        completedMetaMetricsOnboarding: action.value !== null,
        optedIn: action.value === true,
      };

    case actionConstants.SET_DATA_COLLECTION_FOR_MARKETING:
      return {
        ...metamaskState,
        dataCollectionForMarketing: action.value,
      };

    case actionConstants.COMPLETE_ONBOARDING: {
      return {
        ...metamaskState,
        completedOnboarding: true,
      };
    }

    case actionConstants.COMPLETE_ONBOARDING_WITH_SIDEPANEL: {
      return {
        ...metamaskState,
        completedOnboarding: true,
        openedWithSidepanel: true,
      };
    }

    case actionConstants.SET_HAS_SEEN_ONBOARDING_COMPLETION_PAGE: {
      return {
        ...metamaskState,
        hasSeenOnboardingCompletionPage: true,
      };
    }

    case actionConstants.RESET_ONBOARDING: {
      return {
        ...metamaskState,
        isInitialized: false,
        completedOnboarding: false,
        hasSeenOnboardingCompletionPage: false,
        firstTimeFlowType: null,
        isUnlocked: false,
        onboardingTabs: {},
        seedPhraseBackedUp: null,
        // reset analytics opt-in status
        analyticsId: null,
        optedIn: false,
        completedMetaMetricsOnboarding: false,
      };
    }

    case actionConstants.SET_FIRST_TIME_FLOW_TYPE: {
      return {
        ...metamaskState,
        firstTimeFlowType: action.value,
      };
    }

    case actionConstants.RESET_SOCIAL_LOGIN_ONBOARDING: {
      return {
        ...metamaskState,
        userId: undefined,
        accessToken: undefined,
        refreshToken: undefined,
        socialLoginEmail: undefined,
        authConnection: undefined,
        nodeAuthTokens: undefined,
        passwordOutdatedCache: undefined,
        isSeedlessOnboardingUserAuthenticated: false,
      };
    }

    default:
      return metamaskState;
  }
}

const toHexWei = (value: string | number, expectHexWei?: boolean) => {
  return addHexPrefix(
    expectHexWei ? String(value) : decGWEIToHexWEI(String(value)),
  );
};

// Action Creators
export function updateGasFees({
  gasPrice,
  gasLimit,
  maxPriorityFeePerGas,
  maxFeePerGas,
  transaction,
  expectHexWei = false,
}: {
  gasPrice?: string;
  gasLimit: string | number;
  maxPriorityFeePerGas?: string;
  maxFeePerGas?: string;
  transaction: Json;
  expectHexWei?: boolean;
}) {
  return async (dispatch: Dispatch) => {
    const txParamsCopy = { ...transaction.txParams, gas: gasLimit };
    if (gasPrice) {
      dispatch(
        setCustomGasPrice(toHexWei(txParamsCopy.gasPrice, expectHexWei)),
      );
      txParamsCopy.gasPrice = toHexWei(gasPrice, expectHexWei);
    } else if (maxFeePerGas && maxPriorityFeePerGas) {
      txParamsCopy.maxFeePerGas = toHexWei(maxFeePerGas, expectHexWei);
      txParamsCopy.maxPriorityFeePerGas = addHexPrefix(
        decGWEIToHexWEI(maxPriorityFeePerGas),
      );
    }
    const updatedTx = {
      ...transaction,
      txParams: txParamsCopy,
    };

    const gasLimitAsString = String(gasLimit);
    const customGasLimit = isHexString(addHexPrefix(gasLimitAsString))
      ? addHexPrefix(gasLimitAsString)
      : addHexPrefix(gasLimit.toString(16));
    dispatch(setCustomGasLimit(customGasLimit));
    await dispatch(updateTransactionGasFees(updatedTx.id as string, updatedTx));
  };
}

// Selectors

export const getAlertEnabledness = (state: RootState) => state.metamask.alertEnabledness;

export const getUnconnectedAccountAlertEnabledness = (state: RootState) =>
  getAlertEnabledness(state)[AlertTypes.unconnectedAccount];

export const getWeb3ShimUsageAlertEnabledness = (state: RootState) =>
  getAlertEnabledness(state)[AlertTypes.web3ShimUsage];

export const getUnconnectedAccountAlertShown = (state: RootState) =>
  state.metamask.unconnectedAccountAlertShownOrigins;

export const getTokens = (state: RootState) => {
  const allTokens = getTokensControllerAllTokens(state);
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const { chainId } = getProviderConfig(state);
  return allTokens?.[chainId]?.[selectedAddress] || [];
};

export const getTokensByChainId = (state: RootState, chainId: string) => {
  const allTokens = getTokensControllerAllTokens(state);
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  return allTokens?.[chainId]?.[selectedAddress] || [];
};

export function getNftsDropdownState(state: RootState) {
  return state.metamask.nftsDropdownState;
}

export const getNfts = (state: RootState) => {
  const {
    metamask: { allNfts },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  const { chainId } = getProviderConfig(state);

  return allNfts?.[selectedAddress]?.[chainId] ?? EMPTY_ARRAY;
};

export const getAllNfts = (state: RootState) => {
  const {
    metamask: { allNfts },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  return allNfts?.[selectedAddress] ?? EMPTY_ARRAY;
};

export const getNFTsByChainId = (state: RootState, chainId: string) => {
  const {
    metamask: { allNfts },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  return allNfts?.[selectedAddress]?.[chainId] ?? EMPTY_ARRAY;
};

export const getNftContracts = (state: RootState) => {
  const {
    metamask: { allNftContracts },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const { chainId } = getProviderConfig(state);
  return allNftContracts?.[selectedAddress]?.[chainId] ?? EMPTY_ARRAY;
};

export function getNativeCurrency(state: RootState) {
  return getProviderConfig(state).ticker;
}

export function getConversionRateByTicker(state: RootState, ticker: string) {
  return getCurrencyRateControllerCurrencyRates(state)[ticker]?.conversionRate;
}

export { getCurrencyRateControllerCurrencyRates as getCurrencyRates };

export function getSendHexDataFeatureFlagState(state: RootState) {
  return state.metamask.featureFlags.sendHexData;
}

export function getSendToAccounts(state: RootState) {
  const fromAccounts = accountsWithSendEtherInfoSelector(state);
  const addressBookAccounts = getAddressBook(state);
  return [...fromAccounts, ...addressBookAccounts];
}

function getGasFeeControllerEstimateType(state: RootState) {
  return state.metamask.gasEstimateType;
}

function getGasFeeControllerEstimateTypeByChainId(state: RootState, chainId: string) {
  return state.metamask.gasFeeEstimatesByChainId?.[chainId]?.gasEstimateType;
}

function getGasFeeControllerEstimates(state: RootState) {
  return state.metamask.gasFeeEstimates;
}

function getGasFeeControllerEstimatesByChainId(state: RootState, chainId: string) {
  return state.metamask.gasFeeEstimatesByChainId?.[chainId]?.gasFeeEstimates;
}

function getTransactionGasFeeEstimates(state: RootState) {
  const transactionMetadata = state.confirmTransaction?.txData;
  return transactionMetadata?.gasFeeEstimates;
}

function getTransactionGasFeeEstimatesByChainId(state: RootState, chainId: string) {
  const transactionMetadata = state.confirmTransaction?.txData;
  const transactionChainId = transactionMetadata?.chainId;

  if (transactionChainId !== chainId) {
    return undefined;
  }

  return transactionMetadata?.gasFeeEstimates;
}

const getTransactionGasFeeEstimateType = createSelector(
  getTransactionGasFeeEstimates,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (transactionGasFeeEstimates: any) => transactionGasFeeEstimates?.type,
);

const getTransactionGasFeeEstimateTypeByChainId = createSelector(
  getTransactionGasFeeEstimatesByChainId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (transactionGasFeeEstimates: any) => transactionGasFeeEstimates?.type,
);

export const getGasEstimateType = createSelector(
  getGasFeeControllerEstimateType,
  getTransactionGasFeeEstimateType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gasFeeControllerEstimateType: any, transactionGasFeeEstimateType: any) => {
    return transactionGasFeeEstimateType ?? gasFeeControllerEstimateType;
  },
);

export const getGasEstimateTypeByChainId = createSelector(
  getGasFeeControllerEstimateTypeByChainId,
  getTransactionGasFeeEstimateTypeByChainId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gasFeeControllerEstimateType: any, transactionGasFeeEstimateType: any) => {
    return transactionGasFeeEstimateType ?? gasFeeControllerEstimateType;
  },
);

/**
 * Returns the balances of imported and detected tokens across all accounts and chains.
 *
 * @param {*} state
 * @returns { import('@metamask/assets-controllers').TokenBalancesControllerState['tokenBalances']}
 */
export { getTokenBalancesControllerTokenBalances as getTokenBalances };

export const getGasFeeEstimatesByChainId = createSelector(
  getGasFeeControllerEstimatesByChainId,
  getTransactionGasFeeEstimatesByChainId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gasFeeControllerEstimates: any, transactionGasFeeEstimates: any) => {
    if (transactionGasFeeEstimates) {
      return mergeGasFeeEstimates({
        gasFeeControllerEstimates,
        transactionGasFeeEstimates,
      });
    }

    return gasFeeControllerEstimates;
  },
);

export const getGasFeeEstimates = createSelector(
  getGasFeeControllerEstimates,
  getTransactionGasFeeEstimates,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (gasFeeControllerEstimates: any, transactionGasFeeEstimates: any) => {
    if (transactionGasFeeEstimates) {
      return mergeGasFeeEstimates({
        gasFeeControllerEstimates,
        transactionGasFeeEstimates,
      });
    }

    return gasFeeControllerEstimates;
  },
);

export function getEstimatedGasFeeTimeBounds(state: RootState) {
  return state.metamask.estimatedGasFeeTimeBounds;
}

export function getEstimatedGasFeeTimeBoundsByChainId(state: RootState, chainId: string) {
  return state.metamask.gasFeeEstimatesByChainId?.[chainId]
    ?.estimatedGasFeeTimeBounds;
}

export function getIsGasEstimatesLoading(state: RootState) {
  const networkAndAccountSupports1559 =
    checkNetworkAndAccountSupports1559(state);
  const gasEstimateType = getGasEstimateType(state);

  // We consider the gas estimate to be loading if the gasEstimateType is
  // 'NONE' or if the current gasEstimateType cannot be supported by the current
  // network
  const isEIP1559TolerableEstimateType =
    gasEstimateType === GasEstimateTypes.feeMarket ||
    gasEstimateType === GasEstimateTypes.ethGasPrice;
  const isGasEstimatesLoading =
    gasEstimateType === GasEstimateTypes.none ||
    (networkAndAccountSupports1559 && !isEIP1559TolerableEstimateType) ||
    (!networkAndAccountSupports1559 &&
      gasEstimateType === GasEstimateTypes.feeMarket);

  return isGasEstimatesLoading;
}

export function getIsGasEstimatesLoadingByChainId(
  state: RootState,
  { chainId, networkClientId }: { chainId: string; networkClientId?: string },
) {
  const networkAndAccountSupports1559 = checkNetworkAndAccountSupports1559(
    state,
    networkClientId,
  );
  const gasEstimateType = getGasEstimateTypeByChainId(state, chainId);

  // We consider the gas estimate to be loading if the gasEstimateType is
  // 'NONE' or if the current gasEstimateType cannot be supported by the current
  // network
  const isEIP1559TolerableEstimateType =
    gasEstimateType === GasEstimateTypes.feeMarket ||
    gasEstimateType === GasEstimateTypes.ethGasPrice;
  const isGasEstimatesLoading =
    gasEstimateType === GasEstimateTypes.none ||
    (networkAndAccountSupports1559 && !isEIP1559TolerableEstimateType) ||
    (!networkAndAccountSupports1559 &&
      gasEstimateType === GasEstimateTypes.feeMarket);

  return isGasEstimatesLoading;
}

export function getIsNetworkBusyByChainId(state: RootState, chainId: string) {
  const gasFeeEstimates = getGasFeeEstimatesByChainId(state, chainId);
  return gasFeeEstimates?.networkCongestion >= NetworkCongestionThresholds.busy;
}

export function getCompletedOnboarding(state: RootState) {
  return state.metamask.completedOnboarding;
}

export function getHasSeenOnboardingCompletionPage(state: RootState) {
  return state.metamask.hasSeenOnboardingCompletionPage;
}

export function getIsInitialized(state: RootState) {
  return state.metamask.isInitialized;
}

/**
 * This function checks if the wallet is currently being reset.
 *
 * @param state
 * @returns
 */
export function getIsWalletResetInProgress(state: RootState) {
  return state.metamask.isWalletResetInProgress;
}

export function getSeedPhraseBackedUp(state: RootState) {
  return state.metamask.seedPhraseBackedUp;
}

/**
 * Check whether the first (primary) seed phrase which was created during onboarding, is backed up.
 *
 * Returns true if the first (primary) seed phrase is backed up when the user creates a new wallet.
 *
 * @param state - the redux state object
 * @returns true if the first (primary) seed phrase is backed up when the user creates a new wallet, or the user has imported/restored a wallet.
 */
export function getIsPrimarySeedPhraseBackedUp(state: RootState) {
  // when user imports/restores a seed phrase, we can assume that user has already backed up the seed phrase.
  if (state.metamask.firstTimeFlowType !== FirstTimeFlowType.create) {
    return true;
  }

  return state.metamask.seedPhraseBackedUp;
}

/**
 * Retrieves the outdated status of the seedless password.
 *
 * @param state - The Redux state object.
 * @returns True if the seedless password is considered outdated, false otherwise.
 */
export function getIsSeedlessPasswordOutdated(state: RootState) {
  return Boolean(state.metamask.passwordOutdatedCache?.isExpiredPwd);
}

/**
 * Given the redux state object, returns a boolean indicating whether the user has any Ledger accounts added to MetaMask (i.e. Ledger keyrings
 * in state)
 *
 * @param state - the redux state object
 * @returns true if the user has a Ledger account and false otherwise
 */
export function doesUserHaveALedgerAccount(state: RootState) {
  return state.metamask.keyrings.some((kr) => {
    return kr.type === KeyringType.ledger;
  });
}

export { getCurrencyRateControllerCurrentCurrency as getCurrentCurrency };

/**
 * Returns a boolean indicating whether the user opened the extension with the sidepanel.
 *
 * @param state - the redux state object
 * @returns true if the user opened the extension with the sidepanel, false otherwise
 */
export function getOpenedWithSidepanel(state: RootState) {
  return state.metamask.openedWithSidepanel;
}

/**
 * When true, unlock UI must not auto-start WebAuthn passkey unlock (from background).
 *
 * @param state - Redux root state
 * @returns
 */
export function getPasskeyAutoUnlockSuppressed(state: RootState) {
  return Boolean(state.metamask.passkeyAutoUnlockSuppressed);
}

/**
 * True when a locked user should unlock before resuming the onboarding
 * completion page (return visit without tapping Done).
 *
 * @param state - MetaMask state tree
 * @returns Whether the user must unlock before onboarding completion
 */
export function getShouldUnlockBeforeOnboardingCompletion(state: RootState) {
  const { hasSeenOnboardingCompletionPage, completedOnboarding } =
    state.metamask;

  return (
    hasSeenOnboardingCompletionPage &&
    !completedOnboarding &&
    !getIsUnlocked(state) &&
    getIsInitialized(state) &&
    !getIsWalletResetInProgress(state)
  );
}
