import { createSlice } from '@reduxjs/toolkit';
import log from 'loglevel';
import { isConfusing } from 'unicode-confusables';
import { getCurrentChainId } from '../selectors';
import { CHAIN_ID_TO_NETWORK_ID_MAP } from '../../shared/constants/network';
import { getAndParseUdCurrencies } from '../helpers/utils/util';
import { CHAIN_CHANGED } from '../store/actionConstants';
import { BURN_ADDRESS } from '../../shared/modules/hexstring-utils';
import Resolution from "@unstoppabledomains/resolution";
import {
  UNS_COMMON_ERROR,
  UNS_CONFUSING_ERROR,
  UNS_CURRENCY_SPEC_ERROR,
  UNS_CURRENCY_ERROR,
  UNS_UNKNOWN_ERROR,
} from '../pages/send/send.constants';

// Local Constants
const ZERO_X_ERROR_ADDRESS = '0x';

const initialState = {
  stage: 'UNINITIALIZED',
  resolution: null,
  error: null,
  warning: null,
  network: null,
  domainName: null,
  tlds: null,
};

export const unsInitialState = initialState;

const name = 'UNS';

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
        } else if (error === 'UnspecifiedCurrency' || error === 'RecordNotFound') {
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
    enableUnsLookup: (state, action) => {
      state.stage = 'INITIALIZED';
      state.error = null;
      state.resolution = null;
      state.warning = null;
      state.network = action.payload;
    },
    resetUnsResolution: (state) => {
      state.resolution = null;
      state.warning = null;
      state.error = null;
    },
    updateUdTlds: (state, tlds) => {
      state.tlds = tlds;
    }
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

const {
  unsLookup,
  enableUnsLookup,
  resetUnsResolution,
  updateUdTlds,
} = actions;
const SINGLE_CHAIN = 'SINGLE_CHAIN';
const MULTI_CHAIN = 'MULTI_CHAIN';
const NATIVE = 'NATIVE';

export { resetUnsResolution, unsLookup, updateUdTlds }

export function initializeUnsSlice() {
  return (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
    const network = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];
    dispatch(enableUnsLookup(network));
  };
}

export function prepareResolutionCall(unsName) {
  return async (dispatch, getState) => {
    let state = getState();
    let result;
    if (state[name].stage === 'UNINITIALIZED') {
      await dispatch(initializeUnsSlice());
    }
    if (state.send.draftTransactions[state.send.currentTransactionUUID].asset.type === NATIVE) {
      result = await determineChainType(state.metamask.nativeCurrency);
    } else {
      result = MULTI_CHAIN;
    }
    if (result === SINGLE_CHAIN) {
      let object = await resolveUNS(unsName, state.metamask.nativeCurrency);
      await dispatch(
        unsLookup({
          unsName: object.unsName,
          address: object.address,
          error: object.error,
        }),
      );
    } else if (result === MULTI_CHAIN) {
      let object = {};
      if (state.send.draftTransactions[state.send.currentTransactionUUID].asset.type === NATIVE) {
        object = await resolveMultiChainUNS(unsName, state.metamask.nativeCurrency, state.metamask.nativeCurrency);
      } else {
        object = await resolveMultiChainUNS(unsName, state.send.draftTransactions[state.send.currentTransactionUUID].asset.details.symbol, state.send.draftTransactions[state.send.currentTransactionUUID].asset.details.standard);
      }
      await dispatch(
        unsLookup({
          unsName: object.unsName,
          address: object.address,
          error: object.error,
        }),
      );
    }
  }
}

export async function swapToken(unsName, asset) {
  let object = {}
  object.asset = asset;
    object.chainType = await determineChainType(asset);
    if (object.chainType === SINGLE_CHAIN) {
      object = await resolveUNS(unsName, asset);
    } else if (object.chainType === MULTI_CHAIN) {
      object = await resolveMultiChainUNS(unsName, asset.details.symbol, asset.details.standard);
    }
  return object;
}

async function resolveUNS(unsName, currency) {
  let object = {}
  const resolution = new Resolution();
  object.unsName = unsName;
  object.currency = currency;
  object.address = await resolution
    .addr(unsName, currency)
    .catch((err) => {
      object.error = err.code
    });
  return object
};

async function resolveMultiChainUNS(unsName, symbol, version) {
  const resolution = new Resolution();
  let object = {}
  object.unsName = unsName;
  object.currency = symbol;
  object.version = version;
  object.address = await resolution
    .multiChainAddr(unsName, symbol, version)
    .catch((err) => {
      object.error = err.code
    });
  return object;
}

async function determineChainType(asset) {
  if (typeof(asset) === 'object') {
    return MULTI_CHAIN;
  }
  const currencies = await getAndParseUdCurrencies();
  return currencies.singleChain.includes(asset) ? SINGLE_CHAIN : MULTI_CHAIN;
}

export function getUnsResolution(state) {
  return state[name].resolution;
}

export function getUnsError(state) {
  return state[name].error;
}

export function getUnsWarning(state) {
  return state[name].warning;
}
