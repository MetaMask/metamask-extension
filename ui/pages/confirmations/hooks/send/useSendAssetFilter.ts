import { useMemo } from 'react';

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

    return {
      filteredTokens,
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
