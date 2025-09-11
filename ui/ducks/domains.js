import { createSlice } from '@reduxjs/toolkit';
import log from 'loglevel';

import {
  getChainIdsCaveat,
  getLookupMatchersCaveat,
} from '@metamask/snaps-rpc-methods';
import { TransactionStatus } from '@metamask/transaction-controller';
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
  domainDropCatchingWarning: null,
  addressPoisoningWarning: null,
  typoDetectionEnabled: true,
  domainDropCatchingDetectionEnabled: true,
  addressPoisoningDetectionEnabled: true,
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
      state.domainDropCatchingWarning = null;
      state.addressPoisoningWarning = null;
      state.resolutions = null;
    },
    lookupEnd: (state, action) => {
      // first clear out the previous state
      state.resolutions = null;
      state.error = null;
      state.warning = null;
      state.domainName = null;
      state.typoWarning = null;
      state.domainDropCatchingWarning = null;
      state.addressPoisoningWarning = null;
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

      if (action.payload.typoWarning) {
        state.typoWarning = action.payload.typoWarning;
      }
      if (action.payload.domainDropCatchingWarning) {
        state.domainDropCatchingWarning =
          action.payload.domainDropCatchingWarning;
      }
      if (action.payload.addressPoisoningWarning) {
        state.addressPoisoningWarning = action.payload.addressPoisoningWarning;
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
      state.typoWarning = null;
      state.domainDropCatchingWarning = null;
      state.addressPoisoningWarning = null;
    },
    setTypoDetectionEnabled: (state, action) => {
      state.typoDetectionEnabled = action.payload;
    },
    setDomainDropCatchingDetectionEnabled: (state, action) => {
      state.domainDropCatchingDetectionEnabled = action.payload;
    },
    setAddressPoisoningDetectionEnabled: (state, action) => {
      state.addressPoisoningDetectionEnabled = action.payload;
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
  resetDomainResolution,
  setTypoDetectionEnabled,
  setDomainDropCatchingDetectionEnabled,
  setAddressPoisoningDetectionEnabled,
} = actions;

export {
  resetDomainResolution,
  setTypoDetectionEnabled,
  setDomainDropCatchingDetectionEnabled,
  setAddressPoisoningDetectionEnabled,
};

// Export our helper functions so they can be used directly in other components
export function checkForAddressPoisoning(
  address,
  addressPoisoningDetectionEnabled,
  transactions = [],
  internalAccounts = {},
) {
  if (!address || !addressPoisoningDetectionEnabled) {
    return null;
  }

  try {
    // If the address isn't provided or there are no transactions, exit early
    if (!address || transactions.length === 0) {
      return null;
    }

    // Check if this is one of the user's own addresses
    if (
      internalAccounts &&
      Object.values(internalAccounts).some(
        (account) =>
          account.address &&
          account.address.toLowerCase() === address.toLowerCase(),
      )
    ) {
      return null; // Don't show warnings for user's own addresses
    }

    // The normalized address for consistent comparison
    const normalizedAddress = address.toLowerCase();

    // Create sets of addresses the user has sent to and received from
    const sentToAddresses = new Set(
      transactions
        .filter(
          (tx) =>
            tx.status === TransactionStatus.confirmed &&
            tx.type !== 'incoming' && // Outgoing transactions
            tx.txParams?.to,
        )
        .map((tx) => tx.txParams.to.toLowerCase()),
    );

    const receivedFromAddresses = new Set(
      transactions
        .filter(
          (tx) =>
            tx.status === TransactionStatus.confirmed &&
            tx.type === 'incoming' && // Incoming transactions
            tx.txParams?.from,
        )
        .map((tx) => tx.txParams.from.toLowerCase()),
    );

    // CONDITION 1: Check if this is an address the user has received from but never sent to
    if (
      receivedFromAddresses.has(normalizedAddress) &&
      !sentToAddresses.has(normalizedAddress)
    ) {
      // The user has received funds from this address but never sent to it,
      // so it's likely safe and not a poisoning attack
      return null;
    }

    // If we've sent to this exact address before, it's safe
    if (sentToAddresses.has(normalizedAddress)) {
      return null;
    }

    // CONDITION 2: Check for similarity to addresses the user has sent to before
    const ADDRESS_SIMILARITY_THRESHOLD = 5; // Levenshtein distance threshold

    // Convert the set to an array for iteration
    const sentAddressesArray = Array.from(sentToAddresses);

    for (const historicAddress of sentAddressesArray) {
      // Skip the 0x prefix for comparison
      const addressWithout0x = normalizedAddress.slice(2);
      const historicWithout0x = historicAddress.slice(2);

      // Check similarity in prefix (first 8 characters)
      const prefixLength = 8;
      const addressPrefix = addressWithout0x.slice(0, prefixLength);
      const historicPrefix = historicWithout0x.slice(0, prefixLength);

      const prefixDistance = levenshteinTwoMatrixRows(
        addressPrefix,
        historicPrefix,
      );

      // Check similarity in suffix (last 8 characters)
      const suffixLength = 8;
      const addressSuffix = addressWithout0x.slice(-suffixLength);
      const historicSuffix = historicWithout0x.slice(-suffixLength);

      const suffixDistance = levenshteinTwoMatrixRows(
        addressSuffix,
        historicSuffix,
      );

      // If either prefix or suffix is very similar but not identical, it might be poisoning
      if (
        (prefixDistance > 0 &&
          prefixDistance <= ADDRESS_SIMILARITY_THRESHOLD) ||
        (suffixDistance > 0 && suffixDistance <= ADDRESS_SIMILARITY_THRESHOLD)
      ) {
        return {
          warning: 'Address poisoning attack warning',
          message: `This address is similar to one you've sent to before, but not identical. This could be an address poisoning attempt. Verify that you're sending to the correct address.`,
          similarAddress: historicAddress,
        };
      }

      // Also check for similarity in chunks as a backup detection method
      const chunks = 8; // Number of chunks to divide the address into
      const chunkSize = Math.floor(addressWithout0x.length / chunks);

      for (let i = 0; i < chunks; i++) {
        const startPos = i * chunkSize;
        const addressChunk = addressWithout0x.slice(
          startPos,
          startPos + chunkSize,
        );
        const historicChunk = historicWithout0x.slice(
          startPos,
          startPos + chunkSize,
        );

        const distance = levenshteinTwoMatrixRows(addressChunk, historicChunk);

        // If any chunk is very similar but not identical, it might be poisoning
        if (distance > 0 && distance <= ADDRESS_SIMILARITY_THRESHOLD) {
          return {
            warning: 'Address poisoning attack warning',
            message: `This address is similar to one you've sent to before, but not identical. This could be an address poisoning attempt. Verify that you're sending to the correct address.`,
            similarAddress: historicAddress,
          };
        }
      }
    }
  } catch (e) {
    console.error('Error checking for address poisoning:', e);
  }

  return null;
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

function levenshteinTwoMatrixRows(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  let prevRow = new Array(n + 1).fill(0);
  const currRow = new Array(n + 1).fill(0);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }
  for (let i = 1; i <= m; i++) {
    currRow[0] = i;

    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        currRow[j] = prevRow[j - 1];
      } else {
        currRow[j] = 1 + Math.min(currRow[j - 1], prevRow[j], prevRow[j - 1]);
      }
    }
    prevRow = [...currRow];
  }
  return currRow[n];
}

// Function to check for typos
function checkForTypos(domain, storedDomains, typoDetectionEnabled) {
  if (
    !storedDomains ||
    !Array.isArray(storedDomains) ||
    !typoDetectionEnabled
  ) {
    return null;
  }
  const TYPO_THRESHOLD = 2;

  for (const stored of storedDomains) {
    const distance = levenshteinTwoMatrixRows(
      domain.toLowerCase(),
      stored.ensName.toLowerCase(),
    );

    if (distance <= TYPO_THRESHOLD && stored.ensName !== domain) {
      return {
        warning: `Warning: "${domain}" might be a typo of "${stored.ensName}"`,
        suggestedDomain: stored.ensName,
      };
    }
  }

  return null;
}

// Function to check for domain drop catching
function checkForDomainDropCatching(
  domain,
  resolvedAddress,
  domainDropCatchingDetectionEnabled,
) {
  if (!domain || !resolvedAddress || !domainDropCatchingDetectionEnabled) {
    return null;
  }

  try {
    const storedDomains = JSON.parse(
      window.localStorage.getItem('ensAndResolvedAddresses') || '[]',
    );

    const existingDomain = storedDomains.find(
      (stored) => stored.ensName.toLowerCase() === domain.toLowerCase(),
    );

    if (existingDomain && existingDomain.resolvedAddress !== resolvedAddress) {
      return {
        warning: 'Domain drop catching warning',
        message: `The address for this domain has changed. Please verify the new address.`,
      };
    }
  } catch (e) {
    console.error('Error checking for domain drop catching:', e);
  }

  return null;
}

export function lookupDomainName(domainName) {
  return async (dispatch, getState) => {
    const trimmed = domainName.trim();

    let state = getState();
    if (state[name].stage === 'UNINITIALIZED') {
      await dispatch(initializeDomainSlice());
      state = getState();
    }

    await dispatch(lookupStart(trimmed));
    state = getState();
    log.info(`Starting ENS lookup for "${trimmed}"`);
    let error;
    let typoWarning = null;
    let domainDropCatchingWarning = null;
    const addressPoisoningWarning = null;

    const currentChainHex = getCurrentChainId(state);
    const chainInt = parseInt(currentChainHex, 16);
    const resolutions = await fetchResolutions({
      domain: trimmed,
      chainId: `eip155:${chainInt}`,
      state,
    });

    if (resolutions.length > 0) {
      const stored = JSON.parse(
        window.localStorage.getItem('ensAndResolvedAddresses') || '[]',
      );
      const cs = getState();
      if (getTypoDetectionEnabled(cs)) {
        typoWarning = checkForTypos(trimmed, stored, true);
      }
      if (getDomainDropCatchingDetectionEnabled(cs)) {
        domainDropCatchingWarning = checkForDomainDropCatching(
          trimmed,
          resolutions[0].resolvedAddress,
          true,
        );
      }
    }

    state = getState();
    if (state[name].domainName !== trimmed) {
      return;
    }

    dispatch(
      lookupEnd({
        domainName: trimmed,
        resolutions,
        error,
        typoWarning,
        domainDropCatchingWarning,
        addressPoisoningWarning,
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

export function getTypoDetectionEnabled(state) {
  return state[name].typoDetectionEnabled;
}

export function getDomainDropCatchingWarning(state) {
  return state[name].domainDropCatchingWarning;
}

export function getDomainDropCatchingDetectionEnabled(state) {
  return state[name].domainDropCatchingDetectionEnabled;
}

export function getAddressPoisoningWarning(state) {
  return state[name].addressPoisoningWarning;
}

export function getAddressPoisoningDetectionEnabled(state) {
  return state[name].addressPoisoningDetectionEnabled;
}

export function initializeDomainSlice() {
  return (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
    dispatch(enableDomainLookup(chainId));
  };
}
