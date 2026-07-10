import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { type CaipChainId } from '@metamask/utils';
import { type RampsToken } from '@metamask/ramps-controller';

type UseRampsSearchTokenResultsParams = {
  tokens: RampsToken[];
  networkFilter: CaipChainId | null;
  searchString: string;
  networkNameByChainId: Map<string, string>;
};

type RampsTokenWithNetworkName = RampsToken & { networkName: string };

export function useRampsSearchTokenResults({
  tokens,
  networkFilter,
  searchString,
  networkNameByChainId,
}: UseRampsSearchTokenResultsParams): RampsTokenWithNetworkName[] {
  const networkFilteredTokens = useMemo(() => {
    if (!networkFilter) {
      return tokens;
    }

    return tokens.filter((token) => token.chainId === networkFilter);
  }, [tokens, networkFilter]);

  const tokensWithNetworkName = useMemo(
    (): RampsTokenWithNetworkName[] =>
      networkFilteredTokens.map((token) => ({
        ...token,
        networkName: networkNameByChainId.get(token.chainId) ?? '',
      })),
    [networkFilteredTokens, networkNameByChainId],
  );

  const tokenFuse = useMemo(
    () =>
      new Fuse<RampsTokenWithNetworkName>(tokensWithNetworkName, {
        shouldSort: true,
        threshold: 0.6,
        location: 0,
        distance: 100,
        minMatchCharLength: 1,
        keys: ['symbol', 'assetId', 'name', 'chainId', 'networkName'],
      }),
    [tokensWithNetworkName],
  );

  return useMemo(() => {
    if (!searchString.trim() || tokensWithNetworkName.length === 0) {
      return tokensWithNetworkName;
    }

    return tokenFuse.search(searchString) as RampsTokenWithNetworkName[];
  }, [searchString, tokensWithNetworkName, tokenFuse]);
}
