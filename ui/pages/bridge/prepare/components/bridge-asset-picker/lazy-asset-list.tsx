import React, { useEffect, useMemo, useRef } from 'react';
import { type CaipAssetType } from '@metamask/utils';
import { FontWeight, Text, TextColor } from '@metamask/design-system-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type BridgeToken } from '../../../../../ducks/bridge/types';
import { useTokenSearchResults } from '../../../../../hooks/bridge/useTokenSearchResults';
import { BackgroundColor } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Column } from '../../../layout';
import { BridgeAsset } from './asset';
import { LoadingSkeleton } from './loading-skeleton';

export const BridgeAssetList = ({
  popularTokensList,
  isPopularTokensLoading,
  onAssetChange,
  selectedAssetId,
  isDestination,
  ...searchResultsProps
}: {
  popularTokensList: BridgeToken[];
  isPopularTokensLoading: boolean;
  assetsToInclude: BridgeToken[];
  onAssetChange: (asset: BridgeToken) => void;
  selectedAssetId: CaipAssetType;
} & React.ComponentProps<typeof Column> &
  Pick<React.ComponentProps<typeof BridgeAsset>, 'isDestination'> &
  Pick<
    Parameters<typeof useTokenSearchResults>[0],
    'searchQuery' | 'accountAddress' | 'chainIds'
  >) => {
  const t = useI18nContext();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { searchQuery } = searchResultsProps;

  const {
    searchResults,
    isSearchResultsLoading,
    onFetchMoreResults,
    hasMoreResults,
  } = useTokenSearchResults(searchResultsProps);

  /**
   * If there is a search query, use the search results, otherwise use the popular token list
   */
  const filteredTokenList = useMemo(
    () => (searchQuery.length > 0 ? searchResults : popularTokensList),
    [searchQuery.length, searchResults, popularTokensList],
  );

  const shouldFetchMoreResults =
    searchQuery.length > 0 && hasMoreResults && !isSearchResultsLoading;
  const shouldShowLoadingIndicator =
    shouldFetchMoreResults || isSearchResultsLoading || isPopularTokensLoading;
  const shouldShowNoResultsMessage =
    filteredTokenList.length === 0 && !shouldShowLoadingIndicator;

  /**
   * The number of all items to virtualize. When there are more results to fetch or
   * if tokens are loading, add 1 to the count to show the loading indicator
   * if there are no results after fetching tokens, add 1 to the count to show the "no results" message
   */
  const count =
    shouldShowLoadingIndicator || shouldShowNoResultsMessage
      ? filteredTokenList.length + 1
      : filteredTokenList.length;

  /**
   * The number of items to virtualize before and after the visible items
   */
  const OVERSCAN_COUNT = 10;
  /**
   * The height of the AssetListItem component
   */
  const ITEM_HEIGHT = 78;

  // Fetches and virtualizes tokens on scroll
  const virtualizer = useVirtualizer({
    count,
    gap: 0,
    estimateSize: () => ITEM_HEIGHT,
    overscan: OVERSCAN_COUNT,
    getScrollElement: () => scrollContainerRef?.current || null,
    initialOffset: scrollContainerRef?.current?.scrollTop,
    onChange: (instance) => {
      const lastVirtualItem = instance.getVirtualItems().at(-1);

      if (isSearchResultsLoading || !lastVirtualItem) {
        return;
      }

      // Fetch new search results when scrolling near the end of the list
      if (
        shouldFetchMoreResults &&
        // If the index of the last visible item is greater than the number of tokens in the list
        lastVirtualItem.index + OVERSCAN_COUNT >= filteredTokenList.length
      ) {
        onFetchMoreResults(searchQuery);
      }
    },
  });

  // Scroll to the top of the list when the search query is cleared
  useEffect(() => {
    if (scrollContainerRef.current && searchQuery.length === 0) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchQuery]);

  return (
    <Column
      ref={scrollContainerRef}
      style={{
        position: 'relative',
        height: `${virtualizer.getTotalSize()}px`,
        overflowY: 'scroll',
      }}
    >
      {virtualizer.getVirtualItems().map(({ index, start, key }) => {
        const style = {
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translateY(${start}px)`,
        } as const;
        const token = filteredTokenList[index];
        if (token) {
          return (
            <BridgeAsset
              key={key.toString()}
              ref={virtualizer.measureElement}
              dataIndex={index}
              style={style}
              asset={token}
              onClick={() => {
                onAssetChange(token);
              }}
              selected={
                selectedAssetId.toLowerCase() === token?.assetId?.toLowerCase()
              }
            />
          );
        }
        if (shouldShowNoResultsMessage) {
          return (
            <Text
              key={key.toString()}
              style={{ paddingInline: 16 }}
              fontWeight={FontWeight.Regular}
              color={TextColor.TextAlternative}
            >
              {t('bridgeTokenNotFound', [searchQuery])}
            </Text>
          );
        }
        return (
          <LoadingSkeleton
            key={key.toString()}
            ref={virtualizer.measureElement}
            data-index={index}
            style={style}
            skeletonProps={{
              isLoading: true,
              backgroundColor: BackgroundColor.backgroundSubsection,
            }}
            data-testid="bridge-asset-loading-skeleton"
          />
        );
      })}
    </Column>
  );
};
