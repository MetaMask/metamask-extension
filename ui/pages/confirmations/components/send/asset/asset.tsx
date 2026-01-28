import React, { useState, useCallback, useEffect, useMemo } from 'react';

import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../../components/component-library';
import { useSendAssets } from '../../../hooks/send/useSendAssets';
import { useSendAssetFilter } from '../../../hooks/send/useSendAssetFilter';
import { useAssetSelectionMetrics } from '../../../hooks/send/metrics/useAssetSelectionMetrics';
import { AssetFilterMethod } from '../../../context/send-metrics';
import { AssetList } from '../asset-list';
import { AssetFilterInput } from '../asset-filter-input';
import { NetworkFilter } from '../network-filter';
import { type Asset as AssetType } from '../../../types/send';

export type AssetProps = {
  hideNfts?: boolean;
  includeNoBalance?: boolean;
  onAssetSelect?: (asset: AssetType) => void;
  tokenFilter?: (assets: AssetType[]) => AssetType[];
};

export const Asset = ({
  hideNfts = false,
  includeNoBalance = false,
  onAssetSelect,
  tokenFilter,
}: AssetProps = {}) => {
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { addAssetFilterMethod, removeAssetFilterMethod, setAssetListSize } =
    useAssetSelectionMetrics();

  const { tokens, nfts } = useSendAssets({ includeNoBalance });

  const filteredByCustomFilter = useMemo(() => {
    return tokenFilter ? tokenFilter(tokens) : tokens;
  }, [tokens, tokenFilter]);

  const effectiveNfts = hideNfts ? [] : nfts;

  const { filteredTokens, filteredNfts } = useSendAssetFilter({
    tokens: filteredByCustomFilter,
    nfts: effectiveNfts,
    selectedChainId,
    searchQuery,
  });

  useEffect(() => {
    const allAssets = [...tokens, ...nfts];
    setAssetListSize(allAssets.length.toString());
  }, [tokens, nfts, setAssetListSize]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedChainId(null);
  }, []);

  const handleSearchQueryChange = useCallback(
    (value: string) => {
      if (value === '') {
        removeAssetFilterMethod(AssetFilterMethod.Search);
      } else {
        addAssetFilterMethod(AssetFilterMethod.Search);
      }
      setSearchQuery(value);
    },
    [addAssetFilterMethod, removeAssetFilterMethod],
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      style={{ flex: 1, height: '100%' }}
    >
      <AssetFilterInput
        searchQuery={searchQuery}
        onChange={handleSearchQueryChange}
      />
      <NetworkFilter
        tokens={filteredByCustomFilter}
        nfts={effectiveNfts}
        selectedChainId={selectedChainId}
        onChainIdChange={setSelectedChainId}
      />
      <AssetList
        tokens={filteredTokens}
        nfts={filteredNfts}
        allTokens={filteredByCustomFilter}
        allNfts={effectiveNfts}
        onClearFilters={handleClearFilters}
        hideNfts={hideNfts}
        onAssetSelect={onAssetSelect}
      />
    </Box>
  );
};
