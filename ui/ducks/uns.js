import { createSlice } from '@reduxjs/toolkit';
import log from 'loglevel';
import Resolution from '@unstoppabledomains/resolution';
import { udResolverKeys } from '@unstoppabledomains/tldsresolverkeys';
import { isConfusing } from 'unicode-confusables';
import { getCurrentChainId } from '../selectors';
import {
  CHAIN_ID_TO_NETWORK_ID_MAP,
  infuraProjectId,
} from '../../shared/constants/network';
import { CHAIN_CHANGED } from '../store/actionConstants';
import { BURN_ADDRESS } from '../../shared/modules/hexstring-utils';
import {
  UNS_COMMON_ERROR,
  UNS_CONFUSING_ERROR,
  UNS_CURRENCY_SPEC_ERROR,
  UNS_CURRENCY_ERROR,
  UNS_UNKNOWN_ERROR,
} from '../pages/send/send.constants';

// Sets the Provider URLS to the MetaMask default infura
const ethereumProviderUrl = `https://mainnet.infura.io/v3/${infuraProjectId}`;
const polygonProviderUrl = `https://polygon-mainnet.infura.io/v3/${infuraProjectId}`;

// Local Constants
const ZERO_X_ERROR_ADDRESS = '0x';

const initialState = {
  stage: 'UNINITIALIZED',
  resolution: null,
  error: null,
  warning: null,
  network: null,
  domainName: null,
};

export const unsInitialState = initialState;

const name = 'UNS';
/**
 * Creates a Slice of Unstoppable Domains State.
 *
 * @param {string} error - conatins errors from resolution calls
 * @param {string} stage - tells whether or not a UD call has initialized
 * @param {string} resolution - holds the resolved crypto address (08x....)
 * @param {string} warning - contains warnings from resolution calls
 * @param {string} network - chain network
 * @param {string} domainName - contains the Unstoppable Domain name (blah.crypto)
 */
const slice = createSlice({
  name,
  initialState,
  reducers: {
    unsLookup: (state, action) => {
      // first clear out the previous state
      state.resolution = null;
      state.error = null;
      state.warning = null;
      state.domainName = null;
      let { address, unsName, error } = action.payload;
      if (!action.payload) {
        address = action.address;
        unsName = action.unsName;
        error = action.error;
      }
      if (error) {
        if (error === 'UnregisteredDomain') {
          state.error = UNS_COMMON_ERROR;
        } else if (
          error === 'UnspecifiedCurrency' ||
          error === 'RecordNotFound'
        ) {
          state.error = UNS_CURRENCY_SPEC_ERROR;
        } else if (error === 'UnsupportedCurrency') {
          state.error = UNS_CURRENCY_ERROR;
        } else {
          log.error(error);
          state.error = UNS_UNKNOWN_ERROR;
        }
      } else if (address) {
        if (address === BURN_ADDRESS || address === ZERO_X_ERROR_ADDRESS) {
          state.error = UNS_COMMON_ERROR;
        } else {
          state.resolution = address;
          state.domainName = unsName;
        }
        if (isConfusing(unsName)) {
          state.warning = UNS_CONFUSING_ERROR;
        }
      } else {
        state.error = UNS_COMMON_ERROR;
      }
    },
    // lookup Uns State
    enableUnsLookup: (state, action) => {
      state.stage = 'INITIALIZED';
      state.error = null;
      state.resolution = null;
      state.warning = null;
      state.network = action.payload;
    },
    // reset Uns State
    resetUnsResolution: (state) => {
      state.resolution = null;
      state.warning = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(CHAIN_CHANGED, (state, action) => {
      if (action.payload !== state.currentChainId) {
        state.stage = 'UNINITIALIZED';
      }
    });
  },
});

const { reducer, actions } = slice;
export default reducer;

const { unsLookup, enableUnsLookup, resetUnsResolution } = actions;
const SINGLE_CHAIN = 'SINGLE_CHAIN';
const MULTI_CHAIN = 'MULTI_CHAIN';
const NATIVE = 'NATIVE';

export { resetUnsResolution, unsLookup };
// initialize slice of state
export function initializeUnsSlice() {
  return (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
    const network = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];
    dispatch(enableUnsLookup(network));
  };
}
/**
 * Prepares and Executes an Unstoppable Domain Resolution Call
 * takes an Unstoppable Domain
 * determines transaction chaintype
 * calls appropriate Uns Resolution
 * dispatches state changes
 *
 * @param {string} unsName - inputted Unstoppable Domain Name
 */
export function prepareResolutionCall(unsName) {
  return async (dispatch, getState) => {
    const state = getState();
    let result;
    if (state[name].stage === 'UNINITIALIZED') {
      await dispatch(initializeUnsSlice());
    }
    if (
      state.send.draftTransactions[state.send.currentTransactionUUID].asset
        .type === NATIVE
    ) {
      result = await determineChainType(state.metamask.nativeCurrency);
    } else {
      result = MULTI_CHAIN;
    }
    if (result === SINGLE_CHAIN) {
      const resolution = await resolveSingleChainUns(
        unsName,
        state.metamask.nativeCurrency,
      );
      await dispatch(
        unsLookup({
          unsName: resolution.unsName,
          address: resolution.address,
          error: resolution.error,
        }),
      );
    } else if (result === MULTI_CHAIN) {
      let resolution = {};
      if (
        state.send.draftTransactions[state.send.currentTransactionUUID].asset
          .type === NATIVE
      ) {
        resolution = await resolveMultiChainUNS(
          unsName,
          state.metamask.nativeCurrency,
          state.metamask.nativeCurrency,
        );
      } else {
        resolution = await resolveMultiChainUNS(
          unsName,
          state.send.draftTransactions[state.send.currentTransactionUUID].asset
            .details.symbol,
          state.send.draftTransactions[state.send.currentTransactionUUID].asset
            .details.standard,
        );
      }
      await dispatch(
        unsLookup({
          unsName: resolution.unsName,
          address: resolution.address,
          error: resolution.error,
        }),
      );
    }
  };
}
/**
 * When a token is swapped on the send asset screen, re resolve to the corresponding Uns Crypto Address
 * takes an Unstoppable Domain and a token
 * determines transaction chaintype
 * calls appropriate Uns Resolution
 * returns the resolved addresses
 *
 * @param {string} unsName - inputted Unstoppable Domain Name
 * @param {string} asset - swapped to token
 */
export async function swapUdOnTokenChange(unsName, asset) {
  let resolution = {};
  resolution.asset = asset;
  resolution.chainType = await determineChainType(asset);
  if (resolution.chainType === SINGLE_CHAIN) {
    resolution = await resolveSingleChainUns(unsName, asset);
  } else if (resolution.chainType === MULTI_CHAIN) {
    resolution = await resolveMultiChainUNS(
      unsName,
      asset.details.symbol,
      asset.details.standard,
    );
  }
  return resolution;
}
/**
 * Resolves Unstoppable Domains into Single Chain currency addresses
 * takes an Unstoppable Domain and a currency/token
 * calls the Uns Resolution
 * returns the resolved addresses
 *
 * @param {string} unsName - inputted Unstoppable Domain Name
 * @param {string} symbol - inputted token symbol
 */
export async function resolveSingleChainUns(unsName, symbol) {
  const resolution = {};
  const udResolutionInstance = new Resolution({
    sourceConfig: {
      uns: {
        locations: {
          Layer1: {
            url: ethereumProviderUrl,
            network: 'mainnet',
          },
          Layer2: {
            url: polygonProviderUrl,
            network: 'polygon-mainnet',
          },
        },
      },
    },
  });
  resolution.unsName = unsName;
  resolution.currency = symbol;
  resolution.address = await udResolutionInstance
    .addr(unsName, symbol)
    .catch((err) => {
      resolution.error = err.code;
    });
  return resolution;
}
/**
 * Resolves Unstoppable Domains into Multi Chain currency addresses
 * takes an Unstoppable Domain, a token symbol (MATIC), and a token version (ERC...)
 * calls the Uns Resolution
 * returns the resolved addresses
 *
 * @param {string} unsName - inputted Unstoppable Domain Name
 * @param {string} symbol - inputted token symbol
 * @param {string} version - inputted token version
 */
export async function resolveMultiChainUNS(unsName, symbol, version) {
  const udResolutionInstance = new Resolution({
    sourceConfig: {
      uns: {
        locations: {
          Layer1: {
            url: ethereumProviderUrl,
            network: 'mainnet',
          },
          Layer2: {
            url: polygonProviderUrl,
            network: 'polygon-mainnet',
          },
        },
      },
    },
  });
  const resolution = {};
  resolution.unsName = unsName;
  resolution.currency = symbol;
  resolution.version = version;
  resolution.address = await udResolutionInstance
    .multiChainAddr(unsName, symbol, version)
    .catch((err) => {
      resolution.error = err.code;
    });
  return resolution;
}
/**
 * determines the chaintype of a given asset/token
 * returns Multi or SingleChain
 *
 * @param {object || string} asset - token/currency
 */
export async function determineChainType(asset) {
  if (typeof asset === 'object') {
    return MULTI_CHAIN;
  }
  return udResolverKeys.singleChain.includes(asset)
    ? SINGLE_CHAIN
    : MULTI_CHAIN;
}
// state getter methods
export function getUnsResolution(state) {
  return state[name].resolution;
}

export function getUnsError(state) {
  return state[name].error;
}

export function getUnsWarning(state) {
  return state[name].warning;
}
