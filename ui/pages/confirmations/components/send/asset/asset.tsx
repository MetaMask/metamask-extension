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
import { NetworkFilter } from '../../network-filter';

export const Asset = () => {
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { addAssetFilterMethod, removeAssetFilterMethod, setAssetListSize } =
    useAssetSelectionMetrics();

  const { tokens, nfts } = useSendAssets();
  const { filteredTokens, filteredNfts } = useSendAssetFilter({
    tokens,
    nfts,
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

  const onChainIdChange = useCallback(
    (chainId: string | null) => {
      setSelectedChainId(chainId);
      if (chainId === null) {
        removeAssetFilterMethod(AssetFilterMethod.Network);
      } else {
        addAssetFilterMethod(AssetFilterMethod.Network);
      }
    },
    [addAssetFilterMethod, removeAssetFilterMethod],
  );

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

  // Extract and sort unique chain IDs by total fiat balance from tokens only
  const uniqueChainIds = useMemo(() => {
    const chainIds = new Set<string>();
    const chainIdBalances = new Map<string, number>();

    // Calculate total fiat balance for each chain from tokens only
    tokens.forEach((token) => {
      if (token.chainId) {
        const chainId = String(token.chainId);
        chainIds.add(chainId);

        if (token.fiat?.balance) {
          const currentTotal = chainIdBalances.get(chainId) || 0;
          chainIdBalances.set(chainId, currentTotal + token.fiat.balance);
        }
      }
    });

    // Add chain IDs from NFTs but don't include their fiat balance in sorting
    nfts.forEach((nft) => {
      if (nft.chainId) {
        chainIds.add(String(nft.chainId));
      }
    });

    // Sort chain IDs by total fiat balance (descending - highest first)
    return Array.from(chainIds).sort((chainIdA, chainIdB) => {
      const balanceA = chainIdBalances.get(chainIdA) || 0;
      const balanceB = chainIdBalances.get(chainIdB) || 0;
      return balanceB - balanceA;
    });
  }, [tokens, nfts]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      style={{ flex: 1 }}
    >
      <AssetFilterInput
        searchQuery={searchQuery}
        onChange={handleSearchQueryChange}
      />
      <NetworkFilter
        boxProps={{ marginLeft: 4, marginBottom: 2, marginTop: 2 }}
        chainIds={uniqueChainIds}
        selectedChainId={selectedChainId}
        onChainIdChange={onChainIdChange}
      />
      <AssetList
        tokens={filteredTokens}
        nfts={filteredNfts}
        allTokens={tokens}
        allNfts={nfts}
        onClearFilters={handleClearFilters}
      />
    </Box>
  );
};
