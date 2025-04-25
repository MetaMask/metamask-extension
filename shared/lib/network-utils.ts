import { type WellknownChain } from 'eth-chainlist';
import { useSelector } from 'react-redux';
import { useSafeChainsListValidationSelector } from '../../ui/selectors';
import { DAY } from '../constants/time';
import fetchWithCache from './fetch-with-cache';
import { getStorageItem, setStorageItem } from './storage-helpers';

export type { WellknownChain } from 'eth-chainlist';
const CHAIN_SPEC_URL = 'https://chainid.network/chains.json';
export const cacheKey = `cachedFetch:${CHAIN_SPEC_URL}`;

/**
 * Retrieve well-known chains from the cache.
 */
async function getWellknownChainsFromCache(): Promise<WellknownChain[] | null> {
  const cachedResponse = (await getStorageItem(cacheKey)) || {};
  if (cachedResponse) {
    return cachedResponse;
  } else {
    return null;
  }
}

/**
 * Returns a list of well-known chains either from the cache (which might be
 * a build-time compiled list of networks), or from an up-to-date remote network
 * list of well-known chains (if the user's `useSafeChainsListValidation`
 * security setting allows for it).
 */
export async function getWellknownChains(): Promise<WellknownChain[]> {
  await preSeedPromise;

  const useSafeChainsListValidation = useSelector(
    useSafeChainsListValidationSelector,
  );
  // don't send a network request if the user has disabled the setting,
  // instead, we'll use the cached response if available
  if (useSafeChainsListValidation) {
    return await fetchWithCache({
      url: CHAIN_SPEC_URL,
      allowStale: true,
      cacheOptions: { cacheRefreshTime: DAY },
      functionName: 'getWellknownChains',
      cacheKey,
    });
  } else {
    return (await getWellknownChainsFromCache()) || [];
  }
}

/**
 * Requests for the chainlist need to wait for the pre-seed to finish
 * before they can be used, otherwise it theoretically can return an empty list,
 * when we do actually have the data already.
 */
let preSeedPromise: Promise<void> | null = null;

/**
 * Pre-seed the well-known chains cache with data from the `eth-chainlist`
 * package. This avoids a condition where network conditions or user security
 * settings prevent us from updating the list of well-known chains at runtime.
 * This function should be called at the start of the app, as part of
 * initialization.
 * @returns
 */
export async function preSeedWellknownChains() {
  if (preSeedPromise) {
    return preSeedPromise;
  } else {
    preSeedPromise = new Promise(async (resolve, reject) => {
      try {
        const cachedResponse = await getWellknownChainsFromCache();
        if (cachedResponse) {
          // already seeded, no need to update the cache
          resolve();
          return;
        }
        const { rawChainData } = await import('eth-chainlist');
        await setStorageItem(cacheKey, {
          cachedResponse: rawChainData(),
          // Cached value is immediately invalidated
          cachedTime: 0,
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
}
