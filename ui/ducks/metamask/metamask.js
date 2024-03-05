import { addHexPrefix, isHexString } from 'ethereumjs-util';
import { createSelector } from 'reselect';
import { mergeGasFeeEstimates } from '@metamask/transaction-controller';
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
  getSelectedNetworkClientId,
  getSelectedInternalAccount,
} from '../../selectors';
import * as actionConstants from '../../store/actionConstants';
import { updateTransactionGasFees } from '../../store/actions';
import { setCustomGasLimit, setCustomGasPrice } from '../gas/gas.duck';

const initialState = {
  isInitialized: false,
  isUnlocked: false,
  isAccountMenuOpen: false,
  isNetworkMenuOpen: false,
  identities: {},
  internalAccounts: { accounts: {}, selectedAccount: '' },
  transactions: [],
  networkConfigurations: {},
  addressBook: [],
  contractExchangeRates: {},
  confirmationExchangeRates: {},
  pendingTokens: {},
  customNonceValue: '',
  useBlockie: false,
  featureFlags: {},
  welcomeScreenSeen: false,
  currentLocale: '',
  currentBlockGasLimit: '',
  currentBlockGasLimitByChainId: {},
  preferences: {
    autoLockTimeLimit: DEFAULT_AUTO_LOCK_TIME_LIMIT,
    showExtensionInFullSizeView: false,
    showFiatInTestnets: false,
    showTestNetworks: false,
    useNativeCurrencyAsPrimaryCurrency: true,
    petnamesEnabled: true,
  },
  firstTimeFlowType: null,
  completedOnboarding: false,
  knownMethodData: {},
  use4ByteResolution: true,
  participateInMetaMetrics: null,
  nextNonce: null,
  currencyRates: {
    ETH: {
      conversionRate: null,
    },
  },
  providerConfig: {
    ticker: 'ETH',
  },
};

/**
 * Temporary types for this slice so that inferrence of MetaMask state tree can
 * occur
 *
 * @param {typeof initialState} state - State
 * @param {any} action
 * @returns {typeof initialState}
 */
export default function reduceMetamask(state = initialState, action) {
  // I don't think we should be spreading initialState into this. Once the
  // state tree has begun by way of the first reduce call the initialState is
  // set. The only time it should be used again is if we reset the state with a
  // deliberate action. However, our tests are *relying upon the initialState
  // tree above to be spread into the reducer as a way of hydrating the state
  // for this slice*. I attempted to remove this and it caused nearly 40 test
  // failures. We are going to refactor this slice anyways, possibly removing
  // it so we will fix this issue when that time comes.
  const metamaskState = { ...initialState, ...state };
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
      const id = {};
      id[account] = { ...metamaskState.identities[account], name };
      const identities = { ...metamaskState.identities, ...id };
      const accountToUpdate = Object.values(
        metamaskState.internalAccounts.accounts,
      ).find((internalAccount) => {
        return internalAccount.address.toLowerCase() === account.toLowerCase();
      });

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
      return Object.assign(metamaskState, { identities, internalAccounts });
    }

    case actionConstants.UPDATE_CUSTOM_NONCE:
      return {
        ...metamaskState,
        customNonceValue: action.value,
      };

    case actionConstants.TOGGLE_ACCOUNT_MENU:
      return {
        ...metamaskState,
        isAccountMenuOpen: !metamaskState.isAccountMenuOpen,
      };

    case actionConstants.TOGGLE_NETWORK_MENU:
      return {
        ...metamaskState,
        isNetworkMenuOpen: !metamaskState.isNetworkMenuOpen,
      };

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

    case actionConstants.CLOSE_WELCOME_SCREEN:
      return {
        ...metamaskState,
        welcomeScreenSeen: true,
      };

    case actionConstants.SET_PENDING_TOKENS:
      return {
        ...metamaskState,
        pendingTokens: { ...action.payload },
      };

    case actionConstants.CLEAR_PENDING_TOKENS: {
      return {
        ...metamaskState,
        pendingTokens: {},
      };
    }

    case actionConstants.COMPLETE_ONBOARDING: {
      return {
        ...metamaskState,
        completedOnboarding: true,
      };
    }

    case actionConstants.SET_FIRST_TIME_FLOW_TYPE: {
      return {
        ...metamaskState,
        firstTimeFlowType: action.value,
      };
    }

    case actionConstants.SET_NEXT_NONCE: {
      return {
        ...metamaskState,
        nextNonce: action.payload,
      };
    }
    case actionConstants.SET_CONFIRMATION_EXCHANGE_RATES:
      return {
        ...metamaskState,
        confirmationExchangeRates: action.value,
      };

    ///: BEGIN:ONLY_INCLUDE_IF(desktop)
    case actionConstants.FORCE_DISABLE_DESKTOP: {
      return {
        ...metamaskState,
        desktopEnabled: false,
      };
    }
    ///: END:ONLY_INCLUDE_IF

    default:
      return metamaskState;
  }
}

const toHexWei = (value, expectHexWei) => {
  return addHexPrefix(expectHexWei ? value : decGWEIToHexWEI(value));
};

// Action Creators
export function updateGasFees({
  gasPrice,
  gasLimit,
  maxPriorityFeePerGas,
  maxFeePerGas,
  transaction,
  expectHexWei = false,
}) {
  return async (dispatch) => {
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

    const customGasLimit = isHexString(addHexPrefix(gasLimit))
      ? addHexPrefix(gasLimit)
      : addHexPrefix(gasLimit.toString(16));
    dispatch(setCustomGasLimit(customGasLimit));
    await dispatch(updateTransactionGasFees(updatedTx.id, updatedTx));
  };
}

// Selectors

export const getAlertEnabledness = (state) => state.metamask.alertEnabledness;

/**
 * Get the provider configuration for the current selected network.
 *
 * @param {object} state - Redux state object.
 * @returns {import('../../../app/scripts/controllers/network/network-controller').NetworkControllerState['providerConfig']} The provider configuration for the current selected network.
 */
export function getProviderConfig(state) {
  return state.metamask.providerConfig;
}

export const getUnconnectedAccountAlertEnabledness = (state) =>
  getAlertEnabledness(state)[AlertTypes.unconnectedAccount];

export const getWeb3ShimUsageAlertEnabledness = (state) =>
  getAlertEnabledness(state)[AlertTypes.web3ShimUsage];

export const getUnconnectedAccountAlertShown = (state) =>
  state.metamask.unconnectedAccountAlertShownOrigins;

export const getPendingTokens = (state) => state.metamask.pendingTokens;

export const getTokens = (state) => state.metamask.tokens;

export function getNftsDropdownState(state) {
  return state.metamask.nftsDropdownState;
}

export const getNfts = (state) => {
  const {
    metamask: { allNfts },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);

  const { chainId } = getProviderConfig(state);

  return allNfts?.[selectedAddress]?.[chainId] ?? [];
};

export const getNftContracts = (state) => {
  const {
    metamask: { allNftContracts },
  } = state;
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const { chainId } = getProviderConfig(state);
  return allNftContracts?.[selectedAddress]?.[chainId] ?? [];
};

export function getBlockGasLimit(state) {
  return state.metamask.currentBlockGasLimit;
}

export function getNativeCurrency(state) {
  return getProviderConfig(state).ticker;
}

export function getConversionRate(state) {
  return state.metamask.currencyRates[getProviderConfig(state).ticker]
    ?.conversionRate;
}

export function getSendHexDataFeatureFlagState(state) {
  return state.metamask.featureFlags.sendHexData;
}

export function getSendToAccounts(state) {
  const fromAccounts = accountsWithSendEtherInfoSelector(state);
  const addressBookAccounts = getAddressBook(state);
  return [...fromAccounts, ...addressBookAccounts];
}

/**
 * Function returns true if network details are fetched and it is found to not support EIP-1559
 *
 * @param state
 */
export function isNotEIP1559Network(state) {
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
export function isEIP1559Network(state, networkClientId) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);
  return (
    state.metamask.networksMetadata?.[
      networkClientId ?? selectedNetworkClientId
    ].EIPS[1559] === true
  );
}

export function getGasEstimateType(state) {
  return state.metamask.gasEstimateType;
}

export function getGasFeeControllerEstimates(state) {
  return state.metamask.gasFeeEstimates;
}

export function getTransactionGasFeeEstimates(state) {
  const transactionMetadata = state.confirmTransaction?.txData;
  return transactionMetadata?.gasFeeEstimates;
}

export const getGasFeeEstimates = createSelector(
  getGasEstimateType,
  getGasFeeControllerEstimates,
  getTransactionGasFeeEstimates,
  (
    gasFeeControllerEstimateType,
    gasFeeControllerEstimates,
    transactionGasFeeEstimates,
  ) => {
    if (transactionGasFeeEstimates) {
      return mergeGasFeeEstimates({
        gasFeeControllerEstimateType,
        gasFeeControllerEstimates,
        transactionGasFeeEstimates,
      });
    }

    return gasFeeControllerEstimates;
  },
);

export function getEstimatedGasFeeTimeBounds(state) {
  return state.metamask.estimatedGasFeeTimeBounds;
}

export function getGasEstimateTypeByChainId(state, chainId) {
  return state.metamask.gasFeeEstimatesByChainId?.[chainId]?.gasEstimateType;
}

export function getGasFeeEstimatesByChainId(state, chainId) {
  return state.metamask.gasFeeEstimatesByChainId?.[chainId]?.gasFeeEstimates;
}

export function getEstimatedGasFeeTimeBoundsByChainId(state, chainId) {
  return state.metamask.gasFeeEstimatesByChainId?.[chainId]
    ?.estimatedGasFeeTimeBounds;
}

export function getIsGasEstimatesLoading(state) {
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
  state,
  { chainId, networkClientId },
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

export function getIsNetworkBusy(state) {
  const gasFeeEstimates = getGasFeeEstimates(state);
  return gasFeeEstimates?.networkCongestion >= NetworkCongestionThresholds.busy;
}

export function getIsNetworkBusyByChainId(state, chainId) {
  const gasFeeEstimates = getGasFeeEstimatesByChainId(state, chainId);
  return gasFeeEstimates?.networkCongestion >= NetworkCongestionThresholds.busy;
}

export function getCompletedOnboarding(state) {
  return state.metamask.completedOnboarding;
}
export function getIsInitialized(state) {
  return state.metamask.isInitialized;
}

export function getIsUnlocked(state) {
  return state.metamask.isUnlocked;
}

export function getSeedPhraseBackedUp(state) {
  return state.metamask.seedPhraseBackedUp;
}

/**
 * Given the redux state object and an address, finds a keyring that contains that address, if one exists
 *
 * @param {object} state - the redux state object
 * @param {string} address - the address to search for among the keyring addresses
 * @returns {object | undefined} The keyring which contains the passed address, or undefined
 */
export function findKeyringForAddress(state, address) {
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
 * @param {object} state - the redux state object
 * @returns {string} The users preferred ledger transport type. One of 'webhid' on chrome or 'u2f' on firefox
 */
export function getLedgerTransportType(state) {
  return state.metamask.ledgerTransportType;
}

/**
 * Given the redux state object and an address, returns a boolean indicating whether the passed address is part of a Ledger keyring
 *
 * @param {object} state - the redux state object
 * @param {string} address - the address to search for among all keyring addresses
 * @returns {boolean} true if the passed address is part of a ledger keyring, and false otherwise
 */
export function isAddressLedger(state, address) {
  const keyring = findKeyringForAddress(state, address);

  return keyring?.type === KeyringType.ledger;
}

/**
 * Given the redux state object, returns a boolean indicating whether the user has any Ledger accounts added to MetaMask (i.e. Ledger keyrings
 * in state)
 *
 * @param {object} state - the redux state object
 * @returns {boolean} true if the user has a Ledger account and false otherwise
 */
export function doesUserHaveALedgerAccount(state) {
  return state.metamask.keyrings.some((kr) => {
    return kr.type === KeyringType.ledger;
  });
}

export function isLineaMainnetNetworkReleased(state) {
  return state.metamask.isLineaMainnetReleased;
}
