import React, { useState, useCallback } from 'react';

import { useSendAssets } from '../../../hooks/send/useSendAssets';
import { useSendAssetFilter } from '../../../hooks/send/useSendAssetFilter';
import { Header } from '../header';
import { AssetList } from '../asset-list';
import { AssetFilterInput } from '../asset-filter-input';
import { NetworkFilter } from '../network-filter';

export const Asset = () => {
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { tokens, nfts } = useSendAssets();
  const { filteredTokens, filteredNfts } = useSendAssetFilter({
    tokens,
    nfts,
    selectedChainId,
    searchQuery,
  });

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedChainId(null);
  }, []);

  return (
    <div className="send__wrapper">
      <div className="send__container">
        <div className="send__content">
          <Header />
          <AssetFilterInput
            searchQuery={searchQuery}
            onChange={setSearchQuery}
          />
          <NetworkFilter
            tokens={tokens}
            nfts={nfts}
            selectedChainId={selectedChainId}
            onChainIdChange={setSelectedChainId}
          />
          <AssetList
            tokens={filteredTokens}
            nfts={filteredNfts}
            allTokens={tokens}
            allNfts={nfts}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>
    </div>
  );
};
