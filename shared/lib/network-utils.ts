import { CHAIN_SPEC_URL } from '../constants/network';
import { DAY } from '../constants/time';
import fetchWithCache from './fetch-with-cache';

type ChainInfo = {
  name: string;
  shortName?: string;
  chainId: number;
  rpc?: string[];
};

export async function getSafeChainsList(): Promise<ChainInfo[]> {
  return await fetchWithCache({
    url: CHAIN_SPEC_URL,
    allowStale: true,
    cacheOptions: { cacheRefreshTime: DAY },
    functionName: 'getSafeChainsList',
  });
}
