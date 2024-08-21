import { createSlice } from '@reduxjs/toolkit';
import log from 'loglevel';
import { isHexString } from 'ethereumjs-util';

import {
  getChainIdsCaveat,
  getLookupMatchersCaveat,
} from '@metamask/snaps-rpc-methods';
import {
  getAddressBookEntry,
  getCurrentChainId,
  getNameLookupSnapsIds,
  getPermissionSubjects,
  getSnapMetadata,
} from '../selectors';
import { handleSnapRequest } from '../store/actions';
import {
  DOMAIN_NOT_SUPPORTED_ON_NETWORK,
  NO_RESOLUTION_FOR_DOMAIN,
} from '../pages/confirmations/send/send.constants';
import { CHAIN_CHANGED } from '../store/actionConstants';
import {
  isBurnAddress,
  isValidHexAddress,
} from '../../shared/modules/hexstring-utils';

const initialState = {
  stage: 'UNINITIALIZED',
  resolutions: null,
  error: null,
  warning: null,
  chainId: null,
  domainName: null,
};

export const domainInitialState = initialState;

const name = 'DNS';

const slice = createSlice({
  name,
  initialState,
  reducers: {
    lookupStart: (state, action) => {
      state.domainName = action.payload;
    },
    lookupEnd: (state, action) => {
      // first clear out the previous state
      state.resolutions = null;
      state.error = null;
      state.warning = null;
      state.domainName = null;
      const { resolutions, domainName } = action.payload;
      if (resolutions.length > 0) {
        state.resolutions = resolutions;
      } else if (domainName.length > 0) {
        state.error = NO_RESOLUTION_FOR_DOMAIN;
      }
    },
    enableDomainLookup: (state, action) => {
      state.stage = 'INITIALIZED';
      state.error = null;
      state.resolutions = null;
      state.warning = null;
      state.chainId = action.payload;
    },
    disableDomainLookup: (state) => {
      state.stage = 'NO_NETWORK_SUPPORT';
      state.error = null;
      state.warning = null;
      state.resolutions = null;
      state.chainId = null;
    },
    domainNotSupported: (state) => {
      state.resolutions = null;
      state.warning = null;
      state.error = DOMAIN_NOT_SUPPORTED_ON_NETWORK;
    },
    resetDomainResolution: (state) => {
      state.resolutions = null;
      state.warning = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(CHAIN_CHANGED, (state, action) => {
      if (action.payload !== state.chainId) {
        state.stage = 'UNINITIALIZED';
      }
    });
  },
});

const { reducer, actions } = slice;
export default reducer;

const {
  lookupStart,
  lookupEnd,
  enableDomainLookup,
  domainNotSupported,
  resetDomainResolution,
} = actions;
export { resetDomainResolution };

export function initializeDomainSlice() {
  return (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
    dispatch(enableDomainLookup(chainId));
  };
}

export async function fetchResolutions({ domain, chainId, state }) {
  const NAME_LOOKUP_PERMISSION = 'endowment:name-lookup';
  const subjects = getPermissionSubjects(state);
  const nameLookupSnaps = getNameLookupSnapsIds(state);

  const filteredNameLookupSnapsIds = nameLookupSnaps.filter((snapId) => {
    const permission = subjects[snapId]?.permissions[NAME_LOOKUP_PERMISSION];
    const chainIdCaveat = getChainIdsCaveat(permission);
    const lookupMatchersCaveat = getLookupMatchersCaveat(permission);

    if (chainIdCaveat && !chainIdCaveat.includes(chainId)) {
      return false;
    }

    if (lookupMatchersCaveat) {
      const { tlds, schemes } = lookupMatchersCaveat;
      return (
        tlds?.some((tld) => domain.endsWith(`.${tld}`)) ||
        schemes?.some((scheme) => domain.startsWith(`${scheme}:`))
      );
    }

    return true;
  });

  // previous logic would switch request args based on the domain property to determine
  // if this should have been a domain request or a reverse resolution request
  // since reverse resolution is not supported in the send screen flow,
  // the logic was changed to cancel the request, because otherwise a snap can erroneously
  // check for the domain property without checking domain length and return faulty results.
  if (domain.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    filteredNameLookupSnapsIds.map((snapId) => {
      return handleSnapRequest({
        snapId,
        origin: '',
        handler: 'onNameLookup',
        request: {
          jsonrpc: '2.0',
          method: ' ',
          params: {
            domain,
            chainId,
          },
        },
      });
    }),
  );

  const filteredResults = results.reduce(
    (successfulResolutions, result, idx) => {
      if (result.status !== 'rejected' && result.value !== null) {
        const resolutions = result.value.resolvedAddresses.map(
          (resolution) => ({
            ...resolution,
            resolvingSnap: getSnapMetadata(
              state,
              filteredNameLookupSnapsIds[idx],
            )?.name,
            addressBookEntryName: getAddressBookEntry(
              state,
              resolution.resolvedAddress,
            )?.name,
          }),
        );
        return successfulResolutions.concat(resolutions);
      }
      return successfulResolutions;
    },
    [],
  );

  return filteredResults;
}

export function lookupDomainName(domainName) {
  return async (dispatch, getState) => {
    const trimmedDomainName = domainName.trim();
    let state = getState();
    if (state[name].stage === 'UNINITIALIZED') {
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
      await dispatch(domainNotSupported());
    } else {
      await dispatch(lookupStart(trimmedDomainName));
      log.info(`Resolvers attempting to resolve name: ${trimmedDomainName}`);
      let resolutions = [];
      let hasSnapResolution = false;
      let error;
      const chainId = getCurrentChainId(state);
      const chainIdInt = parseInt(chainId, 16);
      const fetchedResolutions = await fetchResolutions({
        domain: trimmedDomainName,
        chainId: `eip155:${chainIdInt}`,
        state,
      });
      hasSnapResolution = fetchedResolutions.length > 0;
      if (hasSnapResolution) {
        resolutions = fetchedResolutions;
      }

      // Due to the asynchronous nature of looking up domains, we could reach this point
      // while a new lookup has started, if so we don't use the found result.
      state = getState();
      if (trimmedDomainName !== state[name].domainName) {
        return;
      }

      await dispatch(
        lookupEnd({
          resolutions,
          error,
          chainId,
          network: chainIdInt,
          domainName: trimmedDomainName,
        }),
      );
    }
  };
}

export function getDomainResolutions(state) {
  return state[name].resolutions;
}

export function getDomainError(state) {
  return state[name].error;
}

export function getDomainWarning(state) {
  return state[name].warning;
}
