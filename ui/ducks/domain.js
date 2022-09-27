import { createSlice } from '@reduxjs/toolkit';
import log from 'loglevel';
import networkMap from 'ethereum-ens-network-map';
import { isConfusing } from 'unicode-confusables';
import { isHexString } from 'ethereumjs-util';
import { ethers } from 'ethers';
import Resolution from '@unstoppabledomains/resolution';
import { udResolverKeys } from '@unstoppabledomains/tldsresolverkeys';
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
  UNS_COMMON_ERROR,
  UNS_CONFUSING_ERROR,
  UNS_CURRENCY_SPEC_ERROR,
  UNS_CURRENCY_ERROR,
  UNS_UNKNOWN_ERROR,
} from '../pages/send/send.constants';
import { isValidENSDomainName } from '../helpers/utils/util';
import { CHAIN_CHANGED } from '../store/actionConstants';
import {
  BURN_ADDRESS,
  isBurnAddress,
  isValidHexAddress,
} from '../../shared/modules/hexstring-utils';

// Local Constants
const ZERO_X_ERROR_ADDRESS = '0x';
const SINGLE_CHAIN = 'SINGLE_CHAIN';
const MULTI_CHAIN = 'MULTI_CHAIN';
const NATIVE = 'NATIVE';
const UNS = 'UNS';
const ENS = 'ENS';

// Sets the Provider URLS to the MetaMask default infura
const ethereumProviderUrl = `https://mainnet.infura.io/v3/${infuraProjectId}`;
const polygonProviderUrl = `https://polygon-mainnet.infura.io/v3/${infuraProjectId}`;

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

const name = 'domainState';

let provider = null;

const slice = createSlice({
  name,
  initialState,
  reducers: {
    domainLookup: (state, action) => {
      // first clear out the previous state
      state.resolution = null;
      state.error = null;
      state.warning = null;
      const { address, domainName, error, network, domainType } =
        action.payload;
      state.domainType = domainType;
      if (domainType === UNS) {
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
            state.domainName = domainName;
          }
          if (isConfusing(domainName)) {
            state.warning = UNS_CONFUSING_ERROR;
          }
        } else {
          state.error = UNS_COMMON_ERROR;
        }
      } else if (domainType === ENS) {
        if (error) {
          if (
            isValidENSDomainName(domainName) &&
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
          if (isValidENSDomainName(address) && isConfusing(address)) {
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
    disableDomainLookup: (state) => {
      state.stage = 'NO_NETWORK_SUPPORT';
      state.error = null;
      state.warning = null;
      state.resolution = null;
      state.network = null;
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
        provider = null;
      }
    });
  },
});

const { reducer, actions } = slice;
export default reducer;

const {
  enableDomainLookup,
  resetDomainResolution,
  disableDomainLookup,
  ensNotSupported,
  domainLookup,
} = actions;

export { resetDomainResolution, domainLookup };

// creates a slice of state that contains both ENS and UNS resolution as long as we are not no a testnet
export function initializeDomainSlice() {
  return (dispatch, getState) => {
    const state = getState();
    console.log('inside initialize', state);
    const chainId = getCurrentChainId(state);
    const network = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];
    const networkName = NETWORK_ID_TO_ETHERS_NETWORK_NAME_MAP[network];
    const ensAddress = networkMap[network];
    const networkIsSupported = Boolean(ensAddress);
    if (networkIsSupported) {
      provider = new ethers.providers.Web3Provider(global.ethereumProvider, {
        chainId: parseInt(network, 10),
        name: networkName,
        ensAddress,
      });
      dispatch(enableDomainLookup(network));
    } else {
      provider = null;
      dispatch(disableDomainLookup());
    }
  };
}

/**
 * Prepares and Executes an ENS Call
 * determines if network is supported
 * attempts to resolve
 * dispatches state changes
 *
 * @param {string} ensName - inputted ENS domain name
 */
export function lookupEnsName(ensName) {
  return async (dispatch, getState) => {
    const trimmedEnsName = ensName.trim();
    let state = getState();
    if (state[name].stage === 'UNINITIALIZED') {
      await dispatch(initializeDomainSlice());
    }
    state = getState();
    if (
      state[name].stage === 'NO_NETWORK_SUPPORT' &&
      !(
        isBurnAddress(trimmedEnsName) === false &&
        isValidHexAddress(trimmedEnsName, { mixedCaseUseChecksum: true })
      ) &&
      !isHexString(trimmedEnsName)
    ) {
      await dispatch(ensNotSupported());
    } else {
      log.info(`ENS attempting to resolve name: ${trimmedEnsName}`);
      let address;
      let error;
      try {
        address = await provider.resolveName(trimmedEnsName);
      } catch (err) {
        error = err;
      }
      const chainId = getCurrentChainId(state);
      const network = CHAIN_ID_TO_NETWORK_ID_MAP[chainId];
      await dispatch(
        domainLookup({
          domainName: trimmedEnsName,
          address,
          error,
          chainId,
          network,
          domainType: ENS,
        }),
      );
    }
  };
}

/**
 * Prepares and Executes an Unstoppable Domain Resolution Call
 * takes an Unstoppable Domain
 * determines transaction chaintype
 * calls appropriate Uns Resolution for either single or multi chain
 * dispatches state changes
 *
 * @param {string} unsName - inputted Unstoppable Domain Name
 */
export function lookupUnsName(unsName) {
  return async (dispatch, getState) => {
    const state = getState();
    let result;
    if (state[name].stage === 'UNINITIALIZED') {
      await dispatch(initializeDomainSlice());
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
        domainLookup({
          domainName: resolution.unsName,
          address: resolution.address,
          error: resolution.error,
          domainType: UNS,
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
        domainLookup({
          domainName: resolution.unsName,
          address: resolution.address,
          error: resolution.error,
          domainType: UNS,
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

export function getDomainResolution(state) {
  return state[name].resolution;
}

export function getDomainError(state) {
  return state[name].error;
}

export function getDomainWarning(state) {
  return state[name].warning;
}
