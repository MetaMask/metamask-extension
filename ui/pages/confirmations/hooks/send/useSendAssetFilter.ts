import { useMemo } from 'react';

import { shouldHideTempoToken } from '../../../../../shared/lib/tempo-utils';
import { type Asset } from '../../types/send';

type UseSendAssetFilterProps = {
  tokens: Asset[];
  nfts: Asset[];
  selectedChainId?: string | null; // null means "All networks"
  searchQuery?: string;
};

type FilteredAssets = {
  filteredTokens: Asset[];
  filteredNfts: Asset[];
};

export const useSendAssetFilter = ({
  tokens,
  nfts,
  selectedChainId,
  searchQuery = '',
}: UseSendAssetFilterProps): FilteredAssets => {
  return useMemo(() => {
    let networkFilteredTokens = tokens;
    let networkFilteredNfts = nfts;

    if (selectedChainId !== null) {
      networkFilteredTokens = tokens.filter(
        (token) => token.chainId === selectedChainId,
      );
      networkFilteredNfts = nfts.filter(
        (nft) => nft.chainId === selectedChainId,
      );
    }

    const filteredTokens = networkFilteredTokens.filter((token) =>
      matchesSearchQuery(token, searchQuery),
    );

    const filteredNfts = networkFilteredNfts.filter((nft) =>
      matchesSearchQuery(nft, searchQuery),
    );

    const tempoFilteredTokens = filteredTokens.filter((token) => {
      const chainId =
        typeof token.chainId === 'string' ? token.chainId : undefined;
      if (!chainId) {
        return true;
      }
      return !shouldHideTempoToken(chainId, token.isNative, token.symbol);
    });

    return {
      filteredTokens: tempoFilteredTokens,
      filteredNfts,
    };
  }, [tokens, nfts, selectedChainId, searchQuery]);
};

function matchesSearchQuery(asset: Asset, query: string): boolean {
  if (!query.trim()) {
    return true;
  }

  const searchTerm = query.toLowerCase().trim();

  if (asset.name?.toLowerCase().includes(searchTerm)) {
    return true;
  }
  if (asset.symbol?.toLowerCase().includes(searchTerm)) {
    return true;
  }
  if (asset.collection?.name?.toLowerCase().includes(searchTerm)) {
    return true;
  }

  return false;
}
