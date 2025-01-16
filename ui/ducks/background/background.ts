/* eslint-disable jsdoc/require-param */
import { addHexPrefix, isHexString } from 'ethereumjs-util';
import type { AnyAction, Dispatch } from 'redux';
import { createSelector } from 'reselect';
import {
  mergeGasFeeEstimates,
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { AlertTypes } from '../../../shared/constants/alerts';
import {
  GasEstimateTypes,
  NetworkCongestionThresholds,
} from '../../../shared/constants/gas';
import { KeyringType } from '../../../shared/constants/keyring';
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
import * as actionConstants from '../../store/actionConstants';
import { updateTransactionGasFees } from '../../store/actions';
import { setCustomGasLimit, setCustomGasPrice } from '../gas/gas.duck';
import { MetaMaskReduxState } from '../../store/store';
import { BackgroundStateProxy } from '../../../shared/types/background';
import { initialBackgroundState } from './constants';

export type BackgroundSliceState = {
  background: BackgroundStateProxy
};

/**
 * Temporary types for this slice so that inference of MetaMask state tree can
 * occur
 *
 * @param state - State
 * @param action
 * @returns
 */
export default function reduceBackground(
  state: BackgroundSliceState,
  action: AnyAction,
): BackgroundStateProxy {
  // I don't think we should be spreading initialMetamaskState into this. Once the
  // state tree has begun by way of the first reduce call the initialMetamaskState is
  // set. The only time it should be used again is if we reset the state with a
  // deliberate action. However, our tests are *relying upon the initialState
  // tree above to be spread into the reducer as a way of hydrating the state
  // for this slice*. I attempted to remove this and it caused nearly 40 test
  // failures. We are going to refactor this slice anyways, possibly removing
  // it so we will fix this issue when that time comes.
  const backgroundState = { ...initialBackgroundState, ...state.background };
  switch (action.type) {
    case actionConstants.UPDATE_METAMASK_STATE:
      return { ...backgroundState, ...action.value };

    case actionConstants.LOCK_METAMASK:
      return {
        ...backgroundState,
        KeyringController: {
          ...backgroundState.KeyringController,
          isUnlocked: false,
        },
      };

    case actionConstants.SET_ACCOUNT_LABEL: {
      const { account } = action.value;
      const name = action.value.label;
      const accountToUpdate = Object.values(
        backgroundState.AccountsController.internalAccounts.accounts,
      ).find((internalAccount) => {
        return internalAccount.address.toLowerCase() === account.toLowerCase();
      });
      if (!accountToUpdate) {
        return backgroundState;
      }

      const internalAccounts = {
        ...backgroundState.AccountsController.internalAccounts,
        accounts: {
          ...backgroundState.AccountsController.internalAccounts.accounts,
          [accountToUpdate.id]: {
            ...accountToUpdate,
            metadata: {
              ...accountToUpdate.metadata,
              name,
            },
          },
        },
      };
      return Object.assign(backgroundState, { internalAccounts });
    }

    case actionConstants.UPDATE_TRANSACTION_PARAMS: {
      const { id: txId, value } = action;
      let { transactions } = backgroundState.TxController ?? {};
      transactions = transactions?.map((tx) => {
        if (tx.id === txId) {
          const newTx = { ...tx };
          newTx.txParams = value;
          return newTx;
        }
        return tx;
      });

      return {
        ...backgroundState,
        TxController: { ...backgroundState.TxController, transactions },
      };
    }

    case actionConstants.SET_PARTICIPATE_IN_METAMETRICS:
      return {
        ...backgroundState,
        MetaMetricsController: {
          ...backgroundState.MetaMetricsController,
          participateInMetaMetrics: action.value,
        },
      };

    case actionConstants.SET_DATA_COLLECTION_FOR_MARKETING:
      return {
        ...backgroundState,
        MetaMetricsController: {
          ...backgroundState.MetaMetricsController,
          dataCollectionForMarketing: action.value,
        },
      };

    case actionConstants.COMPLETE_ONBOARDING: {
      return {
        ...backgroundState,
        OnboardingController: {
          ...backgroundState.OnboardingController,
          completedOnboarding: true,
        },
      };
    }

    case actionConstants.RESET_ONBOARDING: {
      return {
        ...backgroundState,
        isInitialized: false,
        OnboardingController: {
          ...backgroundState.OnboardingController,
          completedOnboarding: false,
          firstTimeFlowType: null,
          onboardingTabs: {},
          seedPhraseBackedUp: null,
        },
        KeyringController: {
          ...backgroundState.KeyringController,
          isUnlocked: false,
        },
      };
    }

    case actionConstants.SET_FIRST_TIME_FLOW_TYPE: {
      return {
        ...backgroundState,
        OnboardingController: {
          ...backgroundState.OnboardingController,
          firstTimeFlowType: action.value,
        },
      };
    }

    default:
      return backgroundState;
  }
}

const toHexWei = (value: string, expectHexWei: boolean) => {
  return addHexPrefix(expectHexWei ? value : decGWEIToHexWEI(value));
};

type UpdateGasFeeOptions = Required<
  Pick<
    TransactionParams,
    'gasPrice' | 'gasLimit' | 'maxPriorityFeePerGas' | 'maxFeePerGas'
  >
> & {
  transaction: TransactionMeta;
  expectHexWei: boolean;
};

// Action Creators
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
    if (gasPrice && txParamsCopy.gasPrice) {
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

export const getAlertEnabledness = (state: BackgroundSliceState) =>
  state.background.AlertController.alertEnabledness;

export const getUnconnectedAccountAlertEnabledness = (
  state: BackgroundSliceState,
) => getAlertEnabledness(state)[AlertTypes.unconnectedAccount];

export const getWeb3ShimUsageAlertEnabledness = (state: BackgroundSliceState) =>
  getAlertEnabledness(state)[AlertTypes.web3ShimUsage];

export const getUnconnectedAccountAlertShown = (state: BackgroundSliceState) =>
  state.background.AlertController.unconnectedAccountAlertShownOrigins;

export const getTokens = (state: BackgroundSliceState) =>
  state.background.TokensController.tokens;

export function getNftsDropdownState(state: BackgroundSliceState) {
  return state.background.AppStateController.nftsDropdownState;
}

export const getNfts = (state: BackgroundSliceState) => {
  const {
    background: {
      NftController: { allNfts },
    },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  const { chainId } = getProviderConfig(state);

  return allNfts?.[selectedAddress]?.[chainId] ?? [];
};

export const getNFTsByChainId = (state: BackgroundSliceState, chainId: Hex) => {
  const {
    background: {
      NftController: { allNfts },
    },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  return allNfts?.[selectedAddress]?.[chainId] ?? [];
};

export const getNftContracts = (state: BackgroundSliceState) => {
  const {
    background: {
      NftController: { allNftContracts },
    },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const { chainId } = getProviderConfig(state);
  return allNftContracts?.[selectedAddress]?.[chainId];
};

export function getBlockGasLimit(state: BackgroundSliceState) {
  return state.background.AccountTracker.currentBlockGasLimit;
}

export function getNativeCurrency(state: BackgroundSliceState) {
  return getProviderConfig(state).ticker;
}

export function getConversionRate(state: BackgroundSliceState) {
  return state.background.CurrencyController.currencyRates[
    getProviderConfig(state).ticker
  ]?.conversionRate;
}

export function getCurrencyRates(state: BackgroundSliceState) {
  return state.background.CurrencyController.currencyRates;
}

export function getSendHexDataFeatureFlagState(state: BackgroundSliceState) {
  return state.background.PreferencesController.featureFlags.sendHexData;
}

export function getSendToAccounts(state: BackgroundSliceState) {
  const fromAccounts = accountsWithSendEtherInfoSelector(state);
  const addressBookAccounts = getAddressBook(state);
  return [...fromAccounts, ...addressBookAccounts];
}

/**
 * Function returns true if network details are fetched and it is found to not support EIP-1559
 *
 * @param state
 */
export function isNotEIP1559Network(state: BackgroundSliceState) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);
  return (
    state.background.NetworkController.networksMetadata[selectedNetworkClientId]
      .EIPS[1559] === false
  );
}

/**
 * Function returns true if network details are fetched and it is found to support EIP-1559
 *
 * @param state
 * @param networkClientId - The optional network client ID to check for EIP-1559 support. Defaults to the currently selected network.
 */
export function isEIP1559Network(
  state: BackgroundSliceState,
  networkClientId: string,
) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);

  return (
    state.background.NetworkController.networksMetadata?.[
      networkClientId ?? selectedNetworkClientId
    ]?.EIPS[1559] === true
  );
}

function getGasFeeControllerEstimateType(state: BackgroundSliceState) {
  return state.background.GasFeeController.gasEstimateType;
}

function getGasFeeControllerEstimateTypeByChainId(
  state: BackgroundSliceState,
  chainId: Hex,
) {
  return state.background.GasFeeController.gasFeeEstimatesByChainId?.[chainId]
    ?.gasEstimateType;
}

function getGasFeeControllerEstimates(state: BackgroundSliceState) {
  return state.background.GasFeeController.gasFeeEstimates;
}

function getGasFeeControllerEstimatesByChainId(
  state: BackgroundSliceState,
  chainId: Hex,
) {
  return (
    state.background.GasFeeController.gasFeeEstimatesByChainId?.[chainId]
      ?.gasFeeEstimates ?? {}
  );
}

function getTransactionGasFeeEstimates(
  state: BackgroundSliceState & Pick<MetaMaskReduxState, 'confirmTransaction'>,
) {
  const transactionMetadata = state.confirmTransaction?.txData;
  return transactionMetadata?.gasFeeEstimates;
}

function getTransactionGasFeeEstimatesByChainId(
  state: BackgroundSliceState & Pick<MetaMaskReduxState, 'confirmTransaction'>,
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
 * @param state
 * @returns The balances of imported and detected tokens across all accounts and chains.
 */
export function getTokenBalances(state: BackgroundSliceState) {
  return state.background.TokenBalancesController.tokenBalances;
}

export const getGasFeeEstimatesByChainId = createSelector(
  getGasFeeControllerEstimatesByChainId,
  getTransactionGasFeeEstimatesByChainId,
  (gasFeeControllerEstimates, transactionGasFeeEstimates) => {
    if (transactionGasFeeEstimates) {
      return mergeGasFeeEstimates({
        // TODO: Explicitly handle case where there are no gas fee estimates.
        gasFeeControllerEstimates: gasFeeControllerEstimates as Exclude<
          ReturnType<typeof getGasFeeControllerEstimatesByChainId>,
          Record<string, never>
        >,
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
    if (transactionGasFeeEstimates) {
      return mergeGasFeeEstimates({
        // TODO: Explicitly handle case where there are no gas fee estimates.
        gasFeeControllerEstimates: gasFeeControllerEstimates as Exclude<
          ReturnType<typeof getGasFeeControllerEstimatesByChainId>,
          Record<string, never>
        >,
        transactionGasFeeEstimates,
      });
    }

    return gasFeeControllerEstimates;
  },
);

export function getEstimatedGasFeeTimeBounds(state: BackgroundSliceState) {
  return state.background.GasFeeController.estimatedGasFeeTimeBounds;
}

export function getEstimatedGasFeeTimeBoundsByChainId(
  state: BackgroundSliceState,
  chainId: Hex,
) {
  return state.background.GasFeeController.gasFeeEstimatesByChainId?.[chainId]
    ?.estimatedGasFeeTimeBounds;
}

export function getIsGasEstimatesLoading(
  state: BackgroundSliceState & Pick<MetaMaskReduxState, 'confirmTransaction'>,
) {
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
  state: BackgroundSliceState & Pick<MetaMaskReduxState, 'confirmTransaction'>,
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
  state: BackgroundSliceState & Pick<MetaMaskReduxState, 'confirmTransaction'>,
  chainId: Hex,
) {
  const gasFeeEstimates = getGasFeeEstimatesByChainId(state, chainId);
  return 'networkCongestion' in gasFeeEstimates
    ? (gasFeeEstimates?.networkCongestion ?? 0) >=
        NetworkCongestionThresholds.busy
    : false;
}

export function getCompletedOnboarding(state: BackgroundSliceState) {
  return state.background.OnboardingController.completedOnboarding;
}
export function getIsInitialized(state: BackgroundSliceState) {
  return state.background.isInitialized;
}

export function getIsUnlocked(state: BackgroundSliceState) {
  return state.background.KeyringController.isUnlocked;
}

export function getSeedPhraseBackedUp(state: BackgroundSliceState) {
  return state.background.OnboardingController.seedPhraseBackedUp;
}

/**
 * Given the redux state object and an address, finds a keyring that contains that address, if one exists
 *
 * @param state - the redux state object
 * @param address - the address to search for among the keyring addresses
 * @returns The keyring which contains the passed address, or undefined
 */
export function findKeyringForAddress(
  state: BackgroundSliceState,
  address: string,
) {
  const keyring = state.background.KeyringController.keyrings.find((kr) => {
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
 * @returns The user's preferred ledger transport type as a string. One of 'webhid' on chrome or 'u2f' on firefox
 */
export function getLedgerTransportType(state: BackgroundSliceState) {
  return state.background.PreferencesController.ledgerTransportType;
}

/**
 * Given the redux state object and an address, returns a boolean indicating whether the passed address is part of a Ledger keyring
 *
 * @param state - the redux state object
 * @param address - the address to search for among all keyring addresses
 * @returns 'true' if the passed address is part of a ledger keyring, and 'false' otherwise
 */
export function isAddressLedger(state: BackgroundSliceState, address: string) {
  const keyring = findKeyringForAddress(state, address);

  return keyring?.type === KeyringType.ledger;
}

/**
 * Given the redux state object, returns a boolean indicating whether the user has any Ledger accounts added to MetaMask (i.e. Ledger keyrings
 * in state)
 *
 * @param state - the redux state object
 * @param state.background
 * @returns true if the user has a Ledger account and false otherwise
 */
export function doesUserHaveALedgerAccount(state: BackgroundSliceState) {
  return state.background.KeyringController.keyrings.some((kr) => {
    return kr.type === KeyringType.ledger;
  });
}

export function getCurrentCurrency(state) {
  return state.background.currentCurrency;
}
