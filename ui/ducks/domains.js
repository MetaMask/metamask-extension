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
import { NO_RESOLUTION_FOR_DOMAIN } from '../pages/confirmations/send/send.constants';
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
  typoWarning: null,
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
      state.typoWarning = null;
    },
    lookupEnd: (state, action) => {
      // first clear out the previous state
      state.resolutions = null;
      state.error = null;
      state.warning = null;
      state.domainName = null;
      state.typoWarning = null;
      const { resolutions, domainName, typoWarning } = action.payload;
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
      if (typoWarning) {
        state.typoWarning = typoWarning;
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

// Helper function to check if two strings differ by one character
function isOneCharDifferent(str1, str2) {
  if (Math.abs(str1.length - str2.length) > 1) {
    return false;
  }

  let differences = 0;
  const maxLength = Math.max(str1.length, str2.length);

  for (let i = 0; i < maxLength; i++) {
    if (str1[i] !== str2[i]) {
      differences += 1;
      if (differences > 1) {
        return false;
      }
    }
  }

  return differences === 1;
}

// Helper function to check if two characters are adjacent on a QWERTY keyboard
function areAdjacentOnKeyboard(char1, char2) {
  const keyboardLayout = {
    q: ['w', 'a', 's'],
    w: ['q', 'e', 'a', 's', 'd'],
    e: ['w', 'r', 's', 'd', 'f'],
    r: ['e', 't', 'd', 'f', 'g'],
    t: ['r', 'y', 'f', 'g', 'h'],
    y: ['t', 'u', 'g', 'h', 'j'],
    u: ['y', 'i', 'h', 'j', 'k'],
    i: ['u', 'o', 'j', 'k', 'l'],
    o: ['i', 'p', 'k', 'l'],
    p: ['o', 'l'],
    a: ['q', 'w', 's', 'z'],
    s: ['q', 'w', 'e', 'a', 'd', 'z', 'x'],
    d: ['w', 'e', 'r', 's', 'f', 'x', 'c'],
    f: ['e', 'r', 't', 'd', 'g', 'c', 'v'],
    g: ['r', 't', 'y', 'f', 'h', 'v', 'b'],
    h: ['t', 'y', 'u', 'g', 'j', 'b', 'n'],
    j: ['y', 'u', 'i', 'h', 'k', 'n', 'm'],
    k: ['u', 'i', 'o', 'j', 'l', 'm'],
    l: ['i', 'o', 'p', 'k'],
    z: ['a', 's', 'x'],
    x: ['z', 's', 'd', 'c'],
    c: ['x', 'd', 'f', 'v'],
    v: ['c', 'f', 'g', 'b'],
    b: ['v', 'g', 'h', 'n'],
    n: ['b', 'h', 'j', 'm'],
    m: ['n', 'j', 'k'],
  };

  return (
    keyboardLayout[char1.toLowerCase()]?.includes(char2.toLowerCase()) ||
    keyboardLayout[char2.toLowerCase()]?.includes(char1.toLowerCase())
  );
}

// Function to check for potential typos
function checkForTypos(domain, storedDomains) {
  if (!storedDomains || !Array.isArray(storedDomains)) {
    return null;
  }

  for (const stored of storedDomains) {
    if (isOneCharDifferent(domain, stored.ensName)) {
      // Check if the difference is due to adjacent keyboard keys
      const diffIndex = Array.from(domain).findIndex(
        (char, i) => char !== stored.ensName[i],
      );
      if (
        diffIndex !== -1 &&
        areAdjacentOnKeyboard(domain[diffIndex], stored.ensName[diffIndex])
      ) {
        return {
          warning: `Warning: "${domain}" might be a typo of "${stored.ensName}" (adjacent keys on keyboard)`,
          suggestedDomain: stored.ensName,
          resolvedAddress: stored.resolvedAddress,
          lastUpdated: stored.lastUpdated,
        };
      }
    }
  }

  return null;
}

export function lookupDomainName(domainName) {
  return async (dispatch, getState) => {
    const trimmedDomainName = domainName.trim();
    let state = getState();
    if (state[name].stage === 'UNINITIALIZED') {
      await dispatch(initializeDomainSlice());
    }
    await dispatch(lookupStart(trimmedDomainName));
    state = getState();
    log.info(`Resolvers attempting to resolve name: ${trimmedDomainName}`);
    let error;
    const chainId = getCurrentChainId(state);
    const chainIdInt = parseInt(chainId, 16);
    const resolutions = await fetchResolutions({
      domain: trimmedDomainName,
      chainId: `eip155:${chainIdInt}`,
      state,
    });

    // Check for potential typos in stored domains
    let typoWarning = null;
    try {
      const storedDomains = JSON.parse(
        window.localStorage.getItem('ensAndResolvedAddresses') || '[]',
      );
      typoWarning = checkForTypos(trimmedDomainName, storedDomains);

      // If we have a typo warning and a lastUpdated timestamp, include a human-readable date
      if (typoWarning && typoWarning.lastUpdated) {
        const date = new Date(typoWarning.lastUpdated);
        typoWarning.warning += ` (Last used: ${date.toLocaleDateString()})`;
      }
    } catch (e) {
      log.error('Error checking for typos:', e);
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
        typoWarning,
      }),
    );
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

export function getDomainTypoWarning(state) {
  return state[name].typoWarning;
}
