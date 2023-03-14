import { createSlice } from '@reduxjs/toolkit';
import log from 'loglevel';
import networkMap from 'ethereum-ens-network-map';
import { isConfusing } from 'unicode-confusables';
import { isHexString } from 'ethereumjs-util';
import { Web3Provider, JsonRpcProvider } from '@ethersproject/providers';
import { getCurrentChainId } from '../selectors';
import {
  CHAIN_ID_TO_NETWORK_ID_MAP,
  NETWORK_IDS,
  NETWORK_ID_TO_ETHERS_NETWORK_NAME_MAP,
  infuraProjectId,
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
  BURN_ADDRESS,
  isBurnAddress,
  isValidHexAddress,
} from '../../shared/modules/hexstring-utils';
import { getEVMChainAddress } from './ens';

// Local Constants
const ZERO_X_ERROR_ADDRESS = '0x';
const ENS = 'ENS';
const mainnetProviderUrl = `https://mainnet.infura.io/v3/${infuraProjectId}`;

const initialState = {
  stage: 'UNINITIALIZED',
  resolution: null,
  error: null,
  warning: null,
  network: null,
  domainType: null,
  domainName: null,
};

export const domainInitialState = initialState;

const name = 'DNS';

let web3Provider = null;

const slice = createSlice({
  name,
  initialState,
  reducers: {
    domainLookup: (state, action) => {
      // first clear out the previous state
      state.resolution = null;
      state.error = null;
      state.warning = null;
      const { address, error, network, domainType, domainName } =
        action.payload;
      state.domainType = domainType;
      if (state.domainType === ENS) {
        if (error) {
          if (
            isValidDomainName(domainName) &&
            error.message === 'ENS name not defined.'
          ) {
            state.error =
              network === NETWORK_IDS.MAINNET
                ? ENS_NO_ADDRESS_FOR_NAME
                : ENS_NOT_FOUND_ON_NETWORK;
          } else if (error.message === 'Illegal character for ENS.') {
            state.error = ENS_ILLEGAL_CHARACTER;
          } else {
            log.error(error);
            state.error = ENS_UNKNOWN_ERROR;
          }
        } else if (address) {
          if (address === BURN_ADDRESS) {
            state.error = ENS_NO_ADDRESS_FOR_NAME;
          } else if (address === ZERO_X_ERROR_ADDRESS) {
            state.error = ENS_REGISTRATION_ERROR;
          } else {
            state.resolution = address;
          }
          if (isValidDomainName(address) && isConfusing(address)) {
            state.warning = CONFUSING_ENS_ERROR;
          }
        } else {
          state.error = ENS_NO_ADDRESS_FOR_NAME;
        }
      }
    },
    enableDomainLookup: (state, action) => {
      state.stage = 'INITIALIZED';
      state.error = null;
      state.resolution = null;
      state.warning = null;
      state.network = action.payload;
    },
    ensNotSupported: (state) => {
      state.resolution = null;
      state.warning = null;
      state.error = ENS_NOT_SUPPORTED_ON_NETWORK;
    },
    resetDomainResolution: (state) => {
      state.resolution = null;
      state.warning = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(CHAIN_CHANGED, (state, action) => {
      if (action.payload !== state.currentChainId) {
        state.stage = 'UNINITIALIZED';
        web3Provider = null;
      }
    });
  },
});

const { reducer, actions } = slice;
export default reducer;

const {
  domainLookup,
  enableDomainLookup,
  ensNotSupported,
  resetDomainResolution,
} = actions;
export { resetDomainResolution };

export function initializeDomainSlice() {
  return (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
    const network = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];
    const networkName = NETWORK_ID_TO_ETHERS_NETWORK_NAME_MAP[network];
    const ensAddress = networkMap[network];
    const networkIsSupported = Boolean(ensAddress);
    if (networkIsSupported) {
      web3Provider = new Web3Provider(global.ethereumProvider, {
        chainId: parseInt(network, 10),
        name: networkName,
        ensAddress,
      });
    } else {
      web3Provider = new JsonRpcProvider(mainnetProviderUrl);
    }
    dispatch(enableDomainLookup(network));
  };
}

export function lookupEnsName(domainName) {
  return async (dispatch, getState) => {
    console.log('***lookupEnsName1', { domainName });
    const trimmedDomainName = domainName.trim();
    let state = getState();
    if (state[name].stage === 'UNINITIALIZED') {
      console.log('***lookupEnsName2', { domainName });
      await dispatch(initializeDomainSlice());
    }
    state = getState();
    if (
      state[name].stage === 'NO_NETWORK_SUPPORT' &&
      !(
        isBurnAddress(trimmedDomainName) === false &&
        isValidHexAddress(trimmedDomainName, { mixedCaseUseChecksum: true })
      ) &&
      !isHexString(trimmedDomainName)
    ) {
      console.log('***lookupEnsName3', { domainName });
      await dispatch(ensNotSupported());
    } else {
      console.log('***lookupEnsName4', { domainName });
      const chainId = getCurrentChainId(state);
      const logMessage = `ENS attempting to resolve name: ${trimmedDomainName} for chainId ${chainId}`;
      log.info(logMessage);
      const network = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];
      console.log('***lookupEnsName4.1', { network });
      const ensAddress = networkMap[network];
      console.log('***lookupEnsName4.2', { ensAddress });
      const networkIsSupported = Boolean(ensAddress);
      console.log('***lookupEnsName4.3', { networkIsSupported });
      const address = await getEVMChainAddress(
        web3Provider,
        trimmedDomainName,
        networkIsSupported ? 1 : chainId,
      );
      console.log('***lookupEnsName5', { address });

      await dispatch(
        domainLookup({
          address,
          error: null,
          chainId,
          network,
          domainType: ENS,
          domainName: trimmedDomainName,
        }),
      );
    }
  };
}

export function getDomainResolution(state) {
  return state[name].resolution;
}

export function getDomainError(state) {
  return state[name].error;
}

export function getDomainWarning(state) {
  return state[name].warning;
}
