import { addHexPrefix, isHexString, stripHexPrefix } from 'ethereumjs-util';
import * as actionConstants from '../../store/actionConstants';
import { ALERT_TYPES } from '../../../shared/constants/alerts';
import { NETWORK_TYPE_RPC } from '../../../shared/constants/network';
import {
  accountsWithSendEtherInfoSelector,
  checkNetworkAndAccountSupports1559,
  getAddressBook,
} from '../../selectors';
import { updateTransaction } from '../../store/actions';
import { setCustomGasLimit, setCustomGasPrice } from '../gas/gas.duck';
import { decGWEIToHexWEI } from '../../helpers/utils/conversions.util';
import { isEqualCaseInsensitive } from '../../helpers/utils/util';
import { GAS_ESTIMATE_TYPES } from '../../../shared/constants/gas';
import { KEYRING_TYPES } from '../../../shared/constants/hardware-wallets';

export default function reduceMetamask(state = {}, action) {
  const metamaskState = {
    isInitialized: false,
    isUnlocked: false,
    isAccountMenuOpen: false,
    identities: {},
    unapprovedTxs: {},
    frequentRpcList: [],
    addressBook: [],
    contractExchangeRates: {},
    pendingTokens: {},
    customNonceValue: '',
    useBlockie: false,
    featureFlags: {},
    welcomeScreenSeen: false,
    currentLocale: '',
    currentBlockGasLimit: '',
    preferences: {
      autoLockTimeLimit: undefined,
      showFiatInTestnets: false,
      showTestNetworks: false,
      useNativeCurrencyAsPrimaryCurrency: true,
    },
    firstTimeFlowType: null,
    completedOnboarding: false,
    knownMethodData: {},
    participateInMetaMetrics: null,
    nextNonce: null,
    conversionRate: null,
    nativeCurrency: 'ETH',
    ...state,
  };

  switch (action.type) {
    case actionConstants.UPDATE_METAMASK_STATE:
      return { ...metamaskState, ...action.value };

    case actionConstants.LOCK_METAMASK:
      return {
        ...metamaskState,
        isUnlocked: false,
      };

    case actionConstants.SET_RPC_TARGET:
      return {
        ...metamaskState,
        provider: {
          type: NETWORK_TYPE_RPC,
          rpcUrl: action.value,
        },
      };

    case actionConstants.SET_PROVIDER_TYPE:
      return {
        ...metamaskState,
        provider: {
          type: action.value,
        },
      };

    case actionConstants.SHOW_ACCOUNT_DETAIL:
      return {
        ...metamaskState,
        isUnlocked: true,
        isInitialized: true,
        selectedAddress: action.value,
      };

    case actionConstants.SET_ACCOUNT_LABEL: {
      const { account } = action.value;
      const name = action.value.label;
      const id = {};
      id[account] = { ...metamaskState.identities[account], name };
      const identities = { ...metamaskState.identities, ...id };
      return Object.assign(metamaskState, { identities });
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

    case actionConstants.UPDATE_TRANSACTION_PARAMS: {
      const { id: txId, value } = action;
      let { currentNetworkTxList } = metamaskState;
      currentNetworkTxList = currentNetworkTxList.map((tx) => {
        if (tx.id === txId) {
          const newTx = { ...tx };
          newTx.txParams = value;
          return newTx;
        }
        return tx;
      });

      return {
        ...metamaskState,
        currentNetworkTxList,
      };
    }

    case actionConstants.SET_PARTICIPATE_IN_METAMETRICS:
      return {
        ...metamaskState,
        participateInMetaMetrics: action.value,
      };

    case actionConstants.SET_USE_BLOCKIE:
      return {
        ...metamaskState,
        useBlockie: action.value,
      };

    case actionConstants.UPDATE_FEATURE_FLAGS:
      return {
        ...metamaskState,
        featureFlags: action.value,
      };

    case actionConstants.CLOSE_WELCOME_SCREEN:
      return {
        ...metamaskState,
        welcomeScreenSeen: true,
      };

    case actionConstants.SET_CURRENT_LOCALE:
      return {
        ...metamaskState,
        currentLocale: action.value.locale,
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

    case actionConstants.UPDATE_PREFERENCES: {
      return {
        ...metamaskState,
        preferences: {
          ...metamaskState.preferences,
          ...action.payload,
        },
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
        nextNonce: action.value,
      };
    }

    default:
      return metamaskState;
  }
}

const toHexWei = (value, expectHexWei) => {
  return addHexPrefix(expectHexWei ? value : decGWEIToHexWEI(value));
};

// Action Creators
export function updateTransactionGasFees({
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
    await dispatch(updateTransaction(updatedTx));
  };
}

// Selectors

export const getCurrentLocale = (state) => state.metamask.currentLocale;

export const getAlertEnabledness = (state) => state.metamask.alertEnabledness;

export const getUnconnectedAccountAlertEnabledness = (state) =>
  getAlertEnabledness(state)[ALERT_TYPES.unconnectedAccount];

export const getWeb3ShimUsageAlertEnabledness = (state) =>
  getAlertEnabledness(state)[ALERT_TYPES.web3ShimUsage];

export const getUnconnectedAccountAlertShown = (state) =>
  state.metamask.unconnectedAccountAlertShownOrigins;

export const getTokens = (state) => state.metamask.tokens;

export const getCollectibles = (state) => state.metamask.collectibles;

export function getBlockGasLimit(state) {
  return state.metamask.currentBlockGasLimit;
}

export function getConversionRate(state) {
  return state.metamask.conversionRate;
}

export function getNativeCurrency(state) {
  return state.metamask.nativeCurrency;
}

export function getSendHexDataFeatureFlagState(state) {
  return state.metamask.featureFlags.sendHexData;
}

export function getSendToAccounts(state) {
  const fromAccounts = accountsWithSendEtherInfoSelector(state);
  const addressBookAccounts = getAddressBook(state);
  return [...fromAccounts, ...addressBookAccounts];
}

export function getUnapprovedTxs(state) {
  return state.metamask.unapprovedTxs;
}

/**
 * Function returns true if network details are fetched and it is found to not support EIP-1559
 */
export function isNotEIP1559Network(state) {
  return state.metamask.networkDetails?.EIPS[1559] === false;
}

/**
 * Function returns true if network details are fetched and it is found to support EIP-1559
 */
export function isEIP1559Network(state) {
  return state.metamask.networkDetails?.EIPS[1559] === true;
}

export function getGasEstimateType(state) {
  return state.metamask.gasEstimateType;
}

export function getGasFeeEstimates(state) {
  return state.metamask.gasFeeEstimates;
}

export function getEstimatedGasFeeTimeBounds(state) {
  return state.metamask.estimatedGasFeeTimeBounds;
}

export function getIsGasEstimatesLoading(state) {
  const networkAndAccountSupports1559 = checkNetworkAndAccountSupports1559(
    state,
  );
  const gasEstimateType = getGasEstimateType(state);

  // We consider the gas estimate to be loading if the gasEstimateType is
  // 'NONE' or if the current gasEstimateType cannot be supported by the current
  // network
  const isEIP1559TolerableEstimateType =
    gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET ||
    gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE;
  const isGasEstimatesLoading =
    gasEstimateType === GAS_ESTIMATE_TYPES.NONE ||
    (networkAndAccountSupports1559 && !isEIP1559TolerableEstimateType) ||
    (!networkAndAccountSupports1559 &&
      gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET);

  return isGasEstimatesLoading;
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
 * @param {Object} state - the redux state object
 * @param {string} address - the address to search for among the keyring addresses
 * @returns {Object|undefined} The keyring which contains the passed address, or undefined
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
 * @param {Object} state - the redux state object
 * @returns {string} The users preferred ledger transport type. One of'ledgerLive', 'webhid' or 'u2f'
 */
export function getLedgerTransportType(state) {
  return state.metamask.ledgerTransportType;
}

/**
 * Given the redux state object and an address, returns a boolean indicating whether the passed address is part of a Ledger keyring
 *
 * @param {Object} state - the redux state object
 * @param {string} address - the address to search for among all keyring addresses
 * @returns {boolean} true if the passed address is part of a ledger keyring, and false otherwise
 */
export function isAddressLedger(state, address) {
  const keyring = findKeyringForAddress(state, address);

  return keyring?.type === KEYRING_TYPES.LEDGER;
}

/**
 * Given the redux state object, returns a boolean indicating whether the user has any Ledger accounts added to MetaMask (i.e. Ledger keyrings
 * in state)
 *
 * @param {Object} state - the redux state object
 * @returns {boolean} true if the user has a Ledger account and false otherwise
 */
export function doesUserHaveALedgerAccount(state) {
  return state.metamask.keyrings.some((kr) => {
    return kr.type === KEYRING_TYPES.LEDGER;
  });
}
