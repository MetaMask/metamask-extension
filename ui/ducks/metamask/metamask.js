import { createSlice } from '@reduxjs/toolkit';
import { addHexPrefix, isHexString } from 'ethereumjs-util';
import { ALERT_TYPES } from '../../../shared/constants/alerts';
import {
  GAS_ESTIMATE_TYPES,
  NETWORK_CONGESTION_THRESHOLDS,
} from '../../../shared/constants/gas';
import { NETWORK_TYPES } from '../../../shared/constants/network';
import {
  accountsWithSendEtherInfoSelector,
  checkNetworkAndAccountSupports1559,
  getAddressBook,
} from '../../selectors';
import { updateTransactionGasFees } from '../../store/actions';
import { setCustomGasLimit, setCustomGasPrice } from '../gas/gas.duck';
import { decGWEIToHexWEI } from '../../helpers/utils/conversions.util';

import { KEYRING_TYPES } from '../../../shared/constants/hardware-wallets';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import { stripHexPrefix } from '../../../shared/modules/hexstring-utils';

const name = 'metamask';

const initialState = {
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
};

// Slice (reducer plus auto-generated actions and action creators)

const slice = createSlice({
  name,
  initialState,
  reducers: {
    updateMetaMaskState: (state, action) => {
      return { ...state, ...action.payload };
    },
    lockMetaMask: (state) => {
      return {
        ...state,
        isUnlocked: false,
      };
    },
    setRpcTarget: (state, action) => {
      return {
        ...state,
        provider: {
          type: NETWORK_TYPES.RPC,
          rpcUrl: action.payload,
        },
      };
    },
    setProviderType: (state, action) => {
      return {
        ...state,
        provider: {
          type: action.payload,
        },
      };
    },
    showAccountDetail: (state, action) => {
      return {
        ...state,
        isUnlocked: true,
        isInitialized: true,
        selectedAddress: action.payload,
      };
    },
    setAccountLabel: (state, action) => {
      const { account } = action.payload;
      const id = {};
      id[account] = {
        ...state.identities[account],
        name: action.payload.label,
      };
      state.identities = { ...state.identities, ...id };
    },
    updateCustomNonce: (state, action) => {
      state.customNonceValue = action.payload;
    },
    toggleAccountMenu: (state) => {
      state.isAccountMenuOpen = !state.isAccountMenuOpen;
    },
    updateTransactionParams: (state, action) => {
      const { id: txId, value } = action.payload;
      state.currentNetworkTxList = state.currentNetworkTxList.map((tx) => {
        if (tx.id === txId) {
          const newTx = { ...tx };
          newTx.txParams = value;
          return newTx;
        }
        return tx;
      });
    },
    setParticipateInMetaMetrics: (state, action) => {
      state.participateInMetaMetrics = action.payload;
    },
    setUseBlockie: (state, action) => {
      state.useBlockie = action.payload;
    },
    updateFeatureFlags: (state, action) => {
      state.featureFlags = action.payload;
    },
    closeWelcomeScreen: (state) => {
      state.welcomeScreenSeen = true;
    },
    setCurrentLocale: (state, action) => {
      state.currentLocale = action.payload.locale;
    },
    setPendingTokens: (state, action) => {
      state.pendingTokens = action.payload;
    },
    clearPendingTokens: (state) => {
      state.pendingTokens = {};
    },
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    completeOnboarding: (state) => {
      state.completedOnboarding = true;
    },
    setFirstTimeFlowType: (state, action) => {
      state.firstTimeFlowType = action.payload;
    },
    setNextNonce: (state, action) => {
      state.nextNonce = action.payload;
    },
  },
});

const { actions, reducer } = slice;

export default reducer;

// Action Creators

const {
  updateMetaMaskState,
  lockMetaMask,
  setRpcTarget,
  setProviderType,
  showAccountDetail,
  setAccountLabel,
  updateCustomNonce,
  toggleAccountMenu,
  updateTransactionParams,
  setParticipateInMetaMetrics,
  setUseBlockie,
  updateFeatureFlags,
  closeWelcomeScreen,
  setCurrentLocale,
  setPendingTokens,
  clearPendingTokens,
  updatePreferences,
  completeOnboarding,
  setFirstTimeFlowType,
  setNextNonce,
} = actions;

export {
  updateMetaMaskState,
  lockMetaMask,
  setRpcTarget,
  setProviderType,
  showAccountDetail,
  setAccountLabel,
  updateCustomNonce,
  toggleAccountMenu,
  updateTransactionParams,
  setParticipateInMetaMetrics,
  setUseBlockie,
  updateFeatureFlags,
  closeWelcomeScreen,
  setCurrentLocale,
  setPendingTokens,
  clearPendingTokens,
  updatePreferences,
  completeOnboarding,
  setFirstTimeFlowType,
  setNextNonce,
};

const toHexWei = (value, expectHexWei) => {
  return addHexPrefix(expectHexWei ? value : decGWEIToHexWEI(value));
};

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

export const getCurrentLocale = (state) => state.metamask.currentLocale;

export const getAlertEnabledness = (state) => state.metamask.alertEnabledness;

export const getUnconnectedAccountAlertEnabledness = (state) =>
  getAlertEnabledness(state)[ALERT_TYPES.unconnectedAccount];

export const getWeb3ShimUsageAlertEnabledness = (state) =>
  getAlertEnabledness(state)[ALERT_TYPES.web3ShimUsage];

export const getUnconnectedAccountAlertShown = (state) =>
  state.metamask.unconnectedAccountAlertShownOrigins;

export const getPendingTokens = (state) => state.metamask.pendingTokens;

export const getTokens = (state) => state.metamask.tokens;

export function getCollectiblesDetectionNoticeDismissed(state) {
  return state.metamask.collectiblesDetectionNoticeDismissed;
}

export function getCollectiblesDropdownState(state) {
  return state.metamask.collectiblesDropdownState;
}

export function getEnableEIP1559V2NoticeDismissed(state) {
  return state.metamask.enableEIP1559V2NoticeDismissed;
}

export const getCollectibles = (state) => {
  const {
    metamask: {
      allCollectibles,
      provider: { chainId },
      selectedAddress,
    },
  } = state;

  return allCollectibles?.[selectedAddress]?.[chainId] ?? [];
};

export const getCollectibleContracts = (state) => {
  const {
    metamask: {
      allCollectibleContracts,
      provider: { chainId },
      selectedAddress,
    },
  } = state;

  return allCollectibleContracts?.[selectedAddress]?.[chainId] ?? [];
};

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
 *
 * @param state
 */
export function isNotEIP1559Network(state) {
  return state.metamask.networkDetails?.EIPS[1559] === false;
}

/**
 * Function returns true if network details are fetched and it is found to support EIP-1559
 *
 * @param state
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
  const networkAndAccountSupports1559 =
    checkNetworkAndAccountSupports1559(state);
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

export function getIsNetworkBusy(state) {
  const gasFeeEstimates = getGasFeeEstimates(state);
  return (
    gasFeeEstimates?.networkCongestion >= NETWORK_CONGESTION_THRESHOLDS.BUSY
  );
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
 * @returns {string} The users preferred ledger transport type. One of'ledgerLive', 'webhid' or 'u2f'
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

  return keyring?.type === KEYRING_TYPES.LEDGER;
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
    return kr.type === KEYRING_TYPES.LEDGER;
  });
}
