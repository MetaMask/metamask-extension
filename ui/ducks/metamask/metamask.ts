import { addHexPrefix, isHexString } from 'ethereumjs-util';
import type { AnyAction, Dispatch } from 'redux';
import { createSelector } from 'reselect';
import {
  mergeGasFeeEstimates,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';

import { FlattenedBackgroundStateProxy } from '../../../shared/types/background';
import { AlertTypes } from '../../../shared/constants/alerts';
import {
  GasEstimateTypes,
  NetworkCongestionThresholds,
} from '../../../shared/constants/gas';
import { KeyringType } from '../../../shared/constants/keyring';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../shared/constants/preferences';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import { stripHexPrefix } from '../../../shared/modules/hexstring-utils';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import {
  accountsWithSendEtherInfoSelector,
  checkNetworkAndAccountSupports1559,
  getAddressBook,
} from '../../selectors/selectors';
import {
  getProviderConfig,
  getSelectedNetworkClientId,
} from '../../../shared/modules/selectors/networks';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { MetaMaskReduxState } from '../../store/store';
import * as actionConstants from '../../store/actionConstants';
import { updateTransactionGasFees } from '../../store/actions';
import { setCustomGasLimit, setCustomGasPrice } from '../gas/gas.duck';
import { isEtherDenomination } from '../../selectors/selectors.utils';

const initialState = {
  isInitialized: false,
  isUnlocked: false,
  internalAccounts: { accounts: {}, selectedAccount: '' },
  transactions: [],
  networkConfigurations: {},
  addressBook: [],
  useBlockie: false,
  featureFlags: {},
  currentLocale: '',
  currentBlockGasLimit: '',
  currentBlockGasLimitByChainId: {},
  preferences: {
    autoLockTimeLimit: DEFAULT_AUTO_LOCK_TIME_LIMIT,
    showExtensionInFullSizeView: false,
    showFiatInTestnets: false,
    showTestNetworks: false,
    smartTransactionsOptInStatus: true,
    petnamesEnabled: true,
    featureNotificationsEnabled: false,
    privacyMode: false,
    showMultiRpcModal: false,
  },
  firstTimeFlowType: null,
  completedOnboarding: false,
  knownMethodData: {},
  use4ByteResolution: true,
  participateInMetaMetrics: null,
  dataCollectionForMarketing: null,
  currencyRates: {
    ETH: {
      conversionRate: null,
    },
  },
  throttledOrigins: {},
};

/**
 * Temporary types for this slice so that inference of MetaMask state tree can
 * occur
 *
 * @param state - State
 * @param action
 */
export default function reduceMetamask(
  state: FlattenedBackgroundStateProxy,
  action: AnyAction,
): FlattenedBackgroundStateProxy {
  // I don't think we should be spreading initialState into this. Once the
  // state tree has begun by way of the first reduce call the initialState is
  // set. The only time it should be used again is if we reset the state with a
  // deliberate action. However, our tests are *relying upon the initialState
  // tree above to be spread into the reducer as a way of hydrating the state
  // for this slice*. I attempted to remove this and it caused nearly 40 test
  // failures. We are going to refactor this slice anyways, possibly removing
  // it so we will fix this issue when that time comes.
  const metamaskState = { ...initialState, ...(state ?? {}) };
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
      ).find((internalAccount) => {
        return internalAccount.address.toLowerCase() === account.toLowerCase();
      });

      const internalAccounts = accountToUpdate
        ? {
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
          }
        : { ...metamaskState.internalAccounts };
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
        participateInMetaMetrics: action.value,
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

    case actionConstants.RESET_ONBOARDING: {
      return {
        ...metamaskState,
        isInitialized: false,
        completedOnboarding: false,
        firstTimeFlowType: null,
        isUnlocked: false,
        onboardingTabs: {},
        seedPhraseBackedUp: null,
      };
    }

    case actionConstants.SET_FIRST_TIME_FLOW_TYPE: {
      return {
        ...metamaskState,
        firstTimeFlowType: action.value,
      };
    }

    default:
      return metamaskState;
  }
}

const toHexWei = (value: string, expectHexWei: boolean) => {
  return addHexPrefix(expectHexWei ? value : decGWEIToHexWEI(value));
};

// Action Creators

type UpdateGasFeeOptions = Required<
  Pick<
    TransactionParams,
    'gasPrice' | 'gasLimit' | 'maxPriorityFeePerGas' | 'maxFeePerGas'
  >
> & {
  transaction: TransactionMeta;
  expectHexWei: boolean;
};
export function updateGasFees({
  gasPrice,
  gasLimit,
  maxPriorityFeePerGas,
  maxFeePerGas,
  transaction,
  expectHexWei = false,
}: UpdateGasFeeOptions) {
  return async (dispatch: Dispatch) => {
    const txParamsCopy = { ...transaction.txParams, gas: gasLimit };
    if (gasPrice) {
      dispatch(
        setCustomGasPrice(toHexWei(txParamsCopy.gasPrice ?? '0', expectHexWei)),
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

    const customGasLimit = isHexString(addHexPrefix(gasLimit))
      ? addHexPrefix(gasLimit)
      : addHexPrefix(gasLimit.toString());
    dispatch(setCustomGasLimit(customGasLimit));
    await dispatch(
      // TODO: Fix type for ThunkAction involving async background update
      updateTransactionGasFees(updatedTx.id, updatedTx) as unknown as AnyAction,
    );
  };
}

// Selectors

export const getAlertEnabledness = (state: MetaMaskReduxState) =>
  state.metamask.alertEnabledness;

export const getUnconnectedAccountAlertEnabledness = (
  state: MetaMaskReduxState,
) => getAlertEnabledness(state)[AlertTypes.unconnectedAccount];

export const getWeb3ShimUsageAlertEnabledness = (state: MetaMaskReduxState) =>
  getAlertEnabledness(state)[AlertTypes.web3ShimUsage];

export const getUnconnectedAccountAlertShown = (state: MetaMaskReduxState) =>
  state.metamask.unconnectedAccountAlertShownOrigins;

export const getTokens = (state: MetaMaskReduxState) => state.metamask.tokens;

export function getNftsDropdownState(state: MetaMaskReduxState) {
  return state.metamask.nftsDropdownState;
}

export const getNfts = (state: MetaMaskReduxState) => {
  const {
    metamask: { allNfts },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  const { chainId } = getProviderConfig(state);

  return allNfts?.[selectedAddress]?.[chainId] ?? [];
};

export const getNFTsByChainId = (state: MetaMaskReduxState, chainId: Hex) => {
  const {
    metamask: { allNfts },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  return allNfts?.[selectedAddress]?.[chainId] ?? [];
};

export const getNftContracts = (state: MetaMaskReduxState) => {
  const {
    metamask: { allNftContracts },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const { chainId } = getProviderConfig(state);
  return allNftContracts?.[selectedAddress]?.[chainId] ?? [];
};

export function getBlockGasLimit(state: MetaMaskReduxState) {
  return state.metamask.currentBlockGasLimit;
}

export function getNativeCurrency(state: MetaMaskReduxState) {
  const { ticker } = getProviderConfig(state);
  return isEtherDenomination(ticker) ? ticker : undefined;
}

export function getConversionRate(state: MetaMaskReduxState) {
  return state.metamask.currencyRates[getProviderConfig(state).ticker]
    ?.conversionRate;
}

export function getCurrencyRates(state: MetaMaskReduxState) {
  return state.metamask.currencyRates;
}

export function getSendHexDataFeatureFlagState(state: MetaMaskReduxState) {
  return state.metamask.featureFlags.sendHexData;
}

export function getSendToAccounts(state: MetaMaskReduxState) {
  const fromAccounts = accountsWithSendEtherInfoSelector(state);
  const addressBookAccounts = getAddressBook(state);
  return [...fromAccounts, ...addressBookAccounts];
}

/**
 * Function returns true if network details are fetched and it is found to not support EIP-1559
 *
 * @param state
 */
export function isNotEIP1559Network(state: MetaMaskReduxState) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);
  return (
    state.metamask.networksMetadata[selectedNetworkClientId].EIPS[1559] ===
    false
  );
}

/**
 * Function returns true if network details are fetched and it is found to support EIP-1559
 *
 * @param state
 * @param networkClientId - The optional network client ID to check for EIP-1559 support. Defaults to the currently selected network.
 */
export function isEIP1559Network(
  state: MetaMaskReduxState,
  networkClientId?: string,
) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);

  return (
    state.metamask.networksMetadata?.[
      networkClientId ?? selectedNetworkClientId
    ]?.EIPS[1559] === true
  );
}

function getGasFeeControllerEstimateType(state: MetaMaskReduxState) {
  return state.metamask.gasEstimateType;
}

function getGasFeeControllerEstimateTypeByChainId(
  state: MetaMaskReduxState,
  chainId: Hex,
) {
  return state.metamask.gasFeeEstimatesByChainId?.[chainId]?.gasEstimateType;
}

function getGasFeeControllerEstimates(state: MetaMaskReduxState) {
  return state.metamask.gasFeeEstimates;
}

function getGasFeeControllerEstimatesByChainId(
  state: MetaMaskReduxState,
  chainId: Hex,
) {
  return (
    state.metamask.gasFeeEstimatesByChainId?.[chainId]?.gasFeeEstimates ?? {}
  );
}

function getTransactionGasFeeEstimates(state: MetaMaskReduxState) {
  const transactionMetadata = state.confirmTransaction?.txData;
  return transactionMetadata?.gasFeeEstimates;
}

function getTransactionGasFeeEstimatesByChainId(
  state: MetaMaskReduxState,
  chainId: Hex,
) {
  const transactionMetadata = state.confirmTransaction?.txData;
  const transactionChainId = transactionMetadata?.chainId;

  if (transactionChainId !== chainId) {
    return undefined;
  }

  return transactionMetadata?.gasFeeEstimates;
}

const getTransactionGasFeeEstimateType = createSelector(
  getTransactionGasFeeEstimates,
  (transactionGasFeeEstimates) => transactionGasFeeEstimates?.type,
);

const getTransactionGasFeeEstimateTypeByChainId = createSelector(
  getTransactionGasFeeEstimatesByChainId,
  (transactionGasFeeEstimates) => transactionGasFeeEstimates?.type,
);

export const getGasEstimateType = createSelector(
  getGasFeeControllerEstimateType,
  getTransactionGasFeeEstimateType,
  (gasFeeControllerEstimateType, transactionGasFeeEstimateType) => {
    return transactionGasFeeEstimateType ?? gasFeeControllerEstimateType;
  },
);

export const getGasEstimateTypeByChainId = createSelector(
  getGasFeeControllerEstimateTypeByChainId,
  getTransactionGasFeeEstimateTypeByChainId,
  (gasFeeControllerEstimateType, transactionGasFeeEstimateType) => {
    return transactionGasFeeEstimateType ?? gasFeeControllerEstimateType;
  },
);

/**
 * Returns the balances of imported and detected tokens across all accounts and chains.
 *
 * @param state
 * @returns Object of type `TokenBalancesControllerState['tokenBalances']`
 */
export function getTokenBalances(state: MetaMaskReduxState) {
  return state.metamask.tokenBalances;
}

export const getGasFeeEstimatesByChainId = createSelector(
  getGasFeeControllerEstimatesByChainId,
  getTransactionGasFeeEstimatesByChainId,
  (gasFeeControllerEstimates, transactionGasFeeEstimates) => {
    if (
      transactionGasFeeEstimates &&
      !((obj): obj is Record<string, never> => Object.keys(obj).length === 0)(
        gasFeeControllerEstimates,
      )
    ) {
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
  (gasFeeControllerEstimates, transactionGasFeeEstimates) => {
    if (
      transactionGasFeeEstimates &&
      !((obj): obj is Record<string, never> => Object.keys(obj).length === 0)(
        gasFeeControllerEstimates,
      )
    ) {
      return mergeGasFeeEstimates({
        gasFeeControllerEstimates,
        transactionGasFeeEstimates,
      });
    }

    return gasFeeControllerEstimates;
  },
);

export function getEstimatedGasFeeTimeBounds(state: MetaMaskReduxState) {
  return state.metamask.estimatedGasFeeTimeBounds;
}

export function getEstimatedGasFeeTimeBoundsByChainId(
  state: MetaMaskReduxState,
  chainId: Hex,
) {
  return state.metamask.gasFeeEstimatesByChainId?.[chainId]
    ?.estimatedGasFeeTimeBounds;
}

export function getIsGasEstimatesLoading(state: MetaMaskReduxState) {
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
  state: MetaMaskReduxState,
  { chainId, networkClientId }: { chainId: Hex; networkClientId: string },
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

export function getIsNetworkBusyByChainId(
  state: MetaMaskReduxState,
  chainId: Hex,
) {
  const gasFeeEstimates = getGasFeeEstimatesByChainId(state, chainId);
  return (
    gasFeeEstimates &&
    'networkCongestion' in gasFeeEstimates &&
    (gasFeeEstimates.networkCongestion ?? -Math.min) >=
      NetworkCongestionThresholds.busy
  );
}

export function getCompletedOnboarding(state: MetaMaskReduxState) {
  return state.metamask.completedOnboarding;
}
export function getIsInitialized(state: MetaMaskReduxState) {
  return state.metamask.isInitialized;
}

export function getIsUnlocked(state: MetaMaskReduxState) {
  return state.metamask.isUnlocked;
}

export function getSeedPhraseBackedUp(state: MetaMaskReduxState) {
  return state.metamask.seedPhraseBackedUp;
}

/**
 * Given the redux state object and an address, finds a keyring that contains that address, if one exists
 *
 * @param state - the redux state object
 * @param address - the address to search for among the keyring addresses
 * @returns The keyring which contains the passed address, or undefined
 */
export function findKeyringForAddress(
  state: MetaMaskReduxState,
  address: string,
) {
  const keyring = state.metamask.keyrings.find((kr) => {
    return kr.accounts.some((account) => {
      return (
        isEqualCaseInsensitive(account, addHexPrefix(address)) ||
        isEqualCaseInsensitive(account, stripHexPrefix(address))
      );
    });
  });

  return keyring;
}

/**
 * Given the redux state object, returns the users preferred ledger transport type
 *
 * @param state - the redux state object
 * @returns The users preferred ledger transport type. One of 'webhid' on chrome or 'u2f' on firefox
 */
export function getLedgerTransportType(state: MetaMaskReduxState) {
  return state.metamask.ledgerTransportType;
}

/**
 * Given the redux state object and an address, returns a boolean indicating whether the passed address is part of a Ledger keyring
 *
 * @param state - the redux state object
 * @param address - the address to search for among all keyring addresses
 * @returns true if the passed address is part of a ledger keyring, and false otherwise
 */
export function isAddressLedger(state: MetaMaskReduxState, address: string) {
  const keyring = findKeyringForAddress(state, address);

  return keyring?.type === KeyringType.ledger;
}

/**
 * Given the redux state object, returns a boolean indicating whether the user has any Ledger accounts added to MetaMask (i.e. Ledger keyrings
 * in state)
 *
 * @param state - the redux state object
 * @returns true if the user has a Ledger account and false otherwise
 */
export function doesUserHaveALedgerAccount(state: MetaMaskReduxState) {
  return state.metamask.keyrings.some((kr) => {
    return kr.type === KeyringType.ledger;
  });
}

export function getCurrentCurrency(state: MetaMaskReduxState) {
  return state.metamask.currentCurrency;
}
