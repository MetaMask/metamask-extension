import { createSlice } from '@reduxjs/toolkit';
import log from 'loglevel';

import { formatChainIdToCaip } from '@metamask/bridge-controller';
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
import { NO_RESOLUTION_FOR_DOMAIN } from '../pages/confirmations/send-utils/send.constants';
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
const MAX_CACHE_SIZE = 100;

function enrichResolutionsWithAddressBook(resolutions, state) {
  return resolutions.map((resolution) => ({
    ...resolution,
    addressBookEntryName: getAddressBookEntry(state, resolution.resolvedAddress)
      ?.name,
  }));
}

/**
 * Removes expired entries from the cache to prevent unbounded memory growth.
 * Called periodically during cache operations.
 */
function pruneExpiredCacheEntries() {
  const now = Date.now();
  for (const [key, value] of resolutionCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL_MS) {
      resolutionCache.delete(key);
    }
  }
}

export async function fetchResolutions({ domain, chainId, state, signal }) {
  const cacheKey = `${domain}:${chainId}`;
  const cached = resolutionCache.get(cacheKey);

  if (signal?.aborted) {
    return [];
  }

  // Only use cache if we have completed results that haven't expired
  if (cached?.result && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return enrichResolutionsWithAddressBook(cached.result, state);
  }

  // Delete expired entry if it exists
  if (cached) {
    resolutionCache.delete(cacheKey);
  }

  const NAME_LOOKUP_PERMISSION = 'endowment:name-lookup';
  const subjects = getPermissionSubjects(state);
  const nameLookupSnaps = getNameLookupSnapsIds(state);

  if (signal?.aborted) {
    return [];
  }

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

  if (domain.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    filteredNameLookupSnapsIds.map((snapId) => {
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

  if (signal?.aborted) {
    return [];
  }

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
          }),
        );
        return successfulResolutions.concat(resolutions);
      }
      return successfulResolutions;
    },
    [],
  );

  // Prune expired entries and enforce max cache size before adding new entry
  if (resolutionCache.size >= MAX_CACHE_SIZE) {
    pruneExpiredCacheEntries();
    // If still at max after pruning, remove oldest entry
    if (resolutionCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = resolutionCache.keys().next().value;
      resolutionCache.delete(oldestKey);
    }
  }

  // Cache only completed results with current timestamp
  resolutionCache.set(cacheKey, {
    timestamp: Date.now(),
    result: filteredResults,
  });

  return enrichResolutionsWithAddressBook(filteredResults, state);
}

export function lookupDomainName(domainName, chainId, signal) {
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
    const caipChainId = formatChainIdToCaip(finalChainId);
    const resolutions = await fetchResolutions({
      domain: trimmedDomainName,
      chainId: caipChainId,
      state,
      signal,
    });

    // Due to the asynchronous nature of looking up domains, we could reach this point
    // while a new lookup has started, if so we discard the stale result.
    state = getState();
    if (trimmedDomainName !== state[name].domainName) {
      return [];
    }

    await dispatch(
      lookupEnd({
        resolutions,
        chainId: caipChainId,
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
