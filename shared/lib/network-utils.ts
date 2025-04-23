import fetchWithCache from './fetch-with-cache';
import { CHAIN_SPEC_URL } from '../constants/network';
import { DAY } from '../constants/time';

interface ChainInfo {
  name: string;
  shortName?: string;
  chainId: number;
  rpc?: string[];
}

export async function getSafeChainsList(): Promise<ChainInfo[]> {
  return await fetchWithCache({
    url: CHAIN_SPEC_URL,
    allowStale: true,
    cacheOptions: { cacheRefreshTime: DAY },
    functionName: 'getSafeChainsList',
  });
}
