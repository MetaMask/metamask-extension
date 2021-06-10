import { createSlice } from '@reduxjs/toolkit';
import ENS from 'ethjs-ens';
import log from 'loglevel';
import networkMap from 'ethereum-ens-network-map';
import { isConfusing } from 'unicode-confusables';
import { isHexString } from 'ethereumjs-util';

import { getCurrentChainId } from '../selectors';
import {
  CHAIN_ID_TO_NETWORK_ID_MAP,
  MAINNET_NETWORK_ID,
} from '../../shared/constants/network';
import {
  CONFUSING_ENS_ERROR,
  ENS_ILLEGAL_CHARACTER,
  ENS_NOT_FOUND_ON_NETWORK,
  ENS_NOT_SUPPORTED_ON_NETWORK,
  ENS_NO_ADDRESS_FOR_NAME,
  ENS_REGISTRATION_ERROR,
  ENS_UNKNOWN_ERROR,
} from '../pages/send/send.constants';
import { isValidDomainName } from '../helpers/utils/util';
import { CHAIN_CHANGED } from '../store/actionConstants';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../shared/modules/hexstring-utils';

// Local Constants
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO_X_ERROR_ADDRESS = '0x';

const initialState = {
  stage: 'UNINITIALIZED',
  resolution: null,
  error: null,
  warning: null,
  network: null,
};

export const ensInitialState = initialState;

const name = 'ENS';

let ens = null;

const slice = createSlice({
  name,
  initialState,
  reducers: {
    processEnsError: (state, action) => {
      const { recipient, network, reason } = action.payload;
      if (
        isValidDomainName(recipient) &&
        reason.message === 'ENS name not defined.'
      ) {
        state.error =
          network === MAINNET_NETWORK_ID
            ? ENS_NO_ADDRESS_FOR_NAME
            : ENS_NOT_FOUND_ON_NETWORK;
      } else if (reason.message === 'Illegal Character for ENS.') {
        state.error = ENS_ILLEGAL_CHARACTER;
      } else {
        log.error(reason);
        state.error = ENS_UNKNOWN_ERROR;
      }
    },
    processEnsResult: (state, action) => {
      state.resolution = action.payload;
      if (state.resolution === ZERO_ADDRESS) {
        state.error = ENS_NO_ADDRESS_FOR_NAME;
      }
      if (state.resolution === ZERO_X_ERROR_ADDRESS) {
        state.error = ENS_REGISTRATION_ERROR;
      }
      if (
        isValidDomainName(state.resolution) &&
        isConfusing(state.resolution)
      ) {
        state.warning = CONFUSING_ENS_ERROR;
      }
    },
    enableEnsLookup: (state, action) => {
      state.stage = 'INITIALIZED';
      state.error = null;
      state.resolution = null;
      state.warning = null;
      state.network = action.payload;
    },
    disableEnsLookup: (state) => {
      state.stage = 'NO_NETWORK_SUPPORT';
      state.error = ENS_NOT_SUPPORTED_ON_NETWORK;
      state.warning = null;
      state.resolution = null;
      state.network = null;
    },
    resetResolution: (state) => {
      state.resolution = null;
      state.warning = null;
      state.error =
        state.stage === 'NO_NETWORK_SUPPORT'
          ? ENS_NOT_SUPPORTED_ON_NETWORK
          : null;
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

const {
  disableEnsLookup,
  processEnsError,
  processEnsResult,
  enableEnsLookup,
  resetResolution,
} = actions;
export { resetResolution };

export function initializeEnsSlice() {
  return async (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
    const network = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];
    const networkIsSupported = Boolean(networkMap[network]);
    if (networkIsSupported) {
      ens = new ENS({ provider: global.ethereumProvider, network });
      await dispatch(enableEnsLookup(network));
    } else {
      ens = null;
      await dispatch(disableEnsLookup());
    }
  };
}

export function lookupEnsName(ensName) {
  return async (dispatch, getState) => {
    let state = getState();
    if (state[name].stage === 'UNINITIALIZED' || ens === null) {
      await dispatch(initializeEnsSlice());
    }
    state = getState();
    if (
      state[name].stage === 'NO_NETWORK_SUPPORT' &&
      !(
        isBurnAddress(ensName) === false &&
        isValidHexAddress(ensName, { mixedCaseUseChecksum: true })
      ) &&
      !isHexString(ensName)
    ) {
      await dispatch(resetResolution());
    } else {
      const recipient = ensName.trim();

      log.info(`ENS attempting to resolve name: ${recipient}`);
      try {
        const address = await ens.lookup(recipient);
        await dispatch(processEnsResult(address));
      } catch (reason) {
        await dispatch(processEnsError({ recipient, reason }));
      }
    }
  };
}

export function getEnsResolution(state) {
  return state[name].resolution;
}

export function getEnsError(state) {
  return state[name].error;
}

export function getEnsWarning(state) {
  return state[name].warning;
}
