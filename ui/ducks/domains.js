import { createSlice } from '@reduxjs/toolkit';
import log from 'loglevel';

import {
  getChainIdsCaveat,
  getLookupMatchersCaveat,
} from '@metamask/snaps-rpc-methods';
import {
  getAddressBookEntry,
  getNameLookupSnapsIds,
  getPermissionSubjects,
  getSnapMetadata,
} from '../selectors';
import { getCurrentChainId } from '../../shared/modules/selectors/networks';
import { handleSnapRequest } from '../store/actions';
import { NO_RESOLUTION_FOR_DOMAIN } from '../pages/confirmations/send-legacy/send.constants';
import { CHAIN_CHANGED } from '../store/actionConstants';
import { BURN_ADDRESS } from '../../shared/modules/hexstring-utils';

// Local Constants
const ZERO_X_ERROR_ADDRESS = '0x';

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
      state.warning = 'loading';
      state.error = null;
    },
    lookupEnd: (state, action) => {
      // first clear out the previous state
      state.resolutions = null;
      state.error = null;
      state.warning = null;
      state.domainName = null;
      const { resolutions, domainName } = action.payload;
      const filteredResolutions = resolutions.filter((resolution) => {
        return (
          resolution.resolvedAddress !== BURN_ADDRESS &&
          resolution.resolvedAddress !== ZERO_X_ERROR_ADDRESS
        );
      });
      if (filteredResolutions.length > 0) {
        state.resolutions = filteredResolutions;
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

const { lookupStart, lookupEnd, enableDomainLookup, resetDomainResolution } =
  actions;
export { resetDomainResolution };

export function initializeDomainSlice() {
  return (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
    dispatch(enableDomainLookup(chainId));
  };
}

const resolutionCache = new Map();
const CACHE_TTL_MS = 60000;

export async function fetchResolutions({ domain, chainId, state }) {
  const cacheKey = `${domain}:${chainId}`;
  const cached = resolutionCache.get(cacheKey);

  console.log(
    `[ENS Debug] fetchResolutions called for domain="${domain}" chainId="${chainId}" cacheKey="${cacheKey}"`,
  );

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[ENS Debug] CACHE HIT for ${cacheKey}`);
    if (cached.result) {
      return cached.result;
    }
    console.log(`[ENS Debug] Returning cached promise for ${cacheKey}`);
    return cached.promise;
  }

  console.log(`[ENS Debug] CACHE MISS for ${cacheKey} - making new request`);

  const promise = (async () => {
    const NAME_LOOKUP_PERMISSION = 'endowment:name-lookup';
    const subjects = getPermissionSubjects(state);
    const nameLookupSnaps = getNameLookupSnapsIds(state);

    console.log(
      `[ENS Debug] Found ${nameLookupSnaps.length} name lookup snaps:`,
      nameLookupSnaps,
    );

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

    console.log(
      `[ENS Debug] Filtered to ${filteredNameLookupSnapsIds.length} snaps:`,
      filteredNameLookupSnapsIds,
    );

    if (domain.length === 0) {
      return [];
    }

    console.log(
      `[ENS Debug] About to call ${filteredNameLookupSnapsIds.length} snaps in parallel`,
    );

    const results = await Promise.allSettled(
      filteredNameLookupSnapsIds.map((snapId) => {
        console.log(
          `[ENS Debug] ⚡ Making API call via snap: "${snapId}" for domain "${domain}"`,
        );
        return handleSnapRequest({
          snapId,
          origin: 'metamask',
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

    console.log(
      `[ENS Debug] ✅ Got ${results.length} results from snap calls:`,
      results.map((r, i) => ({
        snap: filteredNameLookupSnapsIds[i],
        status: r.status,
      })),
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

    resolutionCache.set(cacheKey, {
      promise,
      timestamp: Date.now(),
      result: filteredResults,
    });

    return filteredResults;
  })();

  resolutionCache.set(cacheKey, {
    promise,
    timestamp: Date.now(),
  });

  return promise;
}

export function lookupDomainName(domainName, chainId) {
  return async (dispatch, getState) => {
    const trimmedDomainName = domainName.trim();
    let state = getState();
    if (state[name].stage === 'UNINITIALIZED') {
      await dispatch(initializeDomainSlice());
    }
    await dispatch(lookupStart(trimmedDomainName));
    state = getState();
    log.info(`Resolvers attempting to resolve name: ${trimmedDomainName}`);
    const finalChainId = chainId || getCurrentChainId(state);
    const chainIdInt = parseInt(finalChainId, 16);
    const resolutions = await fetchResolutions({
      domain: trimmedDomainName,
      chainId: `eip155:${chainIdInt}`,
      state,
    });

    // Due to the asynchronous nature of looking up domains, we could reach this point
    // while a new lookup has started, if so we don't use the found result.
    state = getState();
    if (trimmedDomainName !== state[name].domainName) {
      return resolutions;
    }

    await dispatch(
      lookupEnd({
        resolutions,
        chainId,
        network: chainIdInt,
        domainName: trimmedDomainName,
      }),
    );

    return resolutions;
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
