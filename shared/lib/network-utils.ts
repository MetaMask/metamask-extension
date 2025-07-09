import { CHAIN_SPEC_URL } from '../constants/network';
import { getStorageItem } from './storage-helpers';

const cacheKey = `cachedFetch:${CHAIN_SPEC_URL}`;

type ChainInfo = {
  name: string;
  shortName?: string;
  chainId: number;
  rpc?: string[];
};

/**
 * Get chains list from cache only without making network requests. This
 * function is temporary and will be replaced the work being done in PR
 * https://github.com/MetaMask/metamask-extension/pull/32297
 */
export async function getSafeChainsListFromCacheOnly(): Promise<ChainInfo[]> {
  try {
    const { cachedResponse } = (await getStorageItem(cacheKey)) || {};
    return cachedResponse || [];
  } catch (error) {
    console.error('Error retrieving chains list from cache', error);
    return [];
  }
}
