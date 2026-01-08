import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { type CaipAssetType } from '@metamask/utils';
import { FontWeight, Text, TextColor } from '@metamask/design-system-react';
import { type BridgeToken } from '../../../../../ducks/bridge/types';
import { useTokenSearchResults } from '../../../../../hooks/bridge/useTokenSearchResults';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { Column } from '../../../layout';
import { AssetListItem } from './asset';
import { LoadingSkeleton } from './loading-skeleton';

export const BridgeAssetList = ({
  popularTokensList,
  isPopularTokensLoading,
  onAssetChange,
  selectedAssetId,
  excludedAssetId,
  searchQuery,
  ...searchResultsProps
}: {
  popularTokensList: BridgeToken[];
  isPopularTokensLoading: boolean;
  assetsToInclude: BridgeToken[];
  onAssetChange: (asset: BridgeToken) => void;
  selectedAssetId: CaipAssetType;
  excludedAssetId?: CaipAssetType;
} & React.ComponentProps<typeof Column> &
  Pick<
    Parameters<typeof useTokenSearchResults>[0],
    'searchQuery' | 'accountAddress' | 'chainIds'
  >) => {
  const {
    searchResults,
    isSearchResultsLoading,
    onFetchMoreResults,
    hasMoreResults,
  } = useTokenSearchResults({
    ...searchResultsProps,
    searchQuery: searchQuery.trim(),
  });

  const loadingRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];

      if (target.isIntersecting && hasMoreResults && !isSearchResultsLoading) {
        onFetchMoreResults(searchQuery);
      }
    },
    [hasMoreResults, searchQuery, isSearchResultsLoading, onFetchMoreResults],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }
    return () => {
      observer.disconnect();
    };
  }, [handleObserver]);

  /**
   * Whether to show the loading indicator
   * When the indicator is visible, the next page of search results will be fetched
   */
  const shouldShowLoadingIndicator =
    isPopularTokensLoading || hasMoreResults || isSearchResultsLoading;
  /**
   * If there is a search query, use the search results, otherwise use the popular token list
   * Filter out the excluded asset
   */
  const filteredTokenList = useMemo(
    () =>
      (searchQuery.length > 0 ? searchResults : popularTokensList).filter(
        (token) =>
          token.assetId.toLowerCase() !== excludedAssetId?.toLowerCase(),
      ),
    [searchQuery.length, searchResults, popularTokensList, excludedAssetId],
  );

  return (
    <Column gap={0} style={{ overflowY: 'scroll', maxWidth: '100%' }}>
      {filteredTokenList.map((token) => (
        <AssetListItem
          key={token.assetId}
          asset={token}
          onClick={() => {
            onAssetChange(token);
          }}
          selected={selectedAssetId === token.assetId}
        />
      ))}
      {filteredTokenList.length < 1 && !shouldShowLoadingIndicator ? (
        <Text
          style={{ paddingInline: 16 }}
          fontWeight={FontWeight.Regular}
          color={TextColor.TextAlternative}
        >
          No tokens match &quot;{searchQuery}&quot;
        </Text>
      ) : (
        <LoadingSkeleton
          isLoading={shouldShowLoadingIndicator}
          style={{ backgroundColor: BackgroundColor.backgroundSubsection }}
          ref={loadingRef}
        />
      )}
    </Column>
  );
};
