import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { TrendingAsset } from '@metamask/assets-controllers';
import type { PerpsMarketData } from '@metamask/perps-controller';
import {
  isCaipAssetType,
  type CaipAssetType,
  type Json,
} from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
  TextAlign,
  TextColor,
  TextFieldSearch,
  TextVariant,
} from '@metamask/design-system-react';

import { MarketRow } from '../../components/app/perps/market-row';
import { Tab, Tabs } from '../../components/ui/tabs';
import { toast, ToastContent } from '../../components/ui/toast/toast';
import { VirtualizedList } from '../../components/ui/virtualized-list/virtualized-list';
import { ScrollContainer } from '../../contexts/scroll-container';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
} from '../../helpers/constants/routes';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { DISCOVER_SEARCH_PREVIEW_COUNT } from '../../hooks/discover-search/constants';
import { getDiscoverViewMoreAction } from '../../hooks/discover-search/get-discover-view-more-action';
import { useEnableFeaturedEvmNetwork } from '../../hooks/useEnableFeaturedEvmNetwork';
import { useDiscoverSearch } from '../../hooks/discover-search/useDiscoverSearch';
import type {
  DiscoverSearchSectionId,
  DiscoverSearchTab,
} from '../../hooks/discover-search/types';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { buildAssetRoutePath } from '../../../shared/lib/asset-route';
import { useGlobalMenuRouteTransition } from '../routes/global-menu-route-transition';
import { DiscoverAssetRow } from './discover-asset-row';
import { DiscoverNoResultsState } from './discover-no-results-state';
import { DiscoverSearchSectionHeader } from './discover-search-section-header';
import { DiscoverSearchSectionSkeleton } from './discover-search-section-skeleton';

const EmptyState = ({ message }: { message: string }) => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    alignItems={BoxAlignItems.Center}
    justifyContent={BoxJustifyContent.Center}
    padding={6}
    data-testid="discover-search-empty"
  >
    <Text
      variant={TextVariant.BodyMd}
      textAlign={TextAlign.Center}
      color={TextColor.TextAlternative}
    >
      {message}
    </Text>
  </Box>
);

const DiscoverSearchErrorState = () => {
  const t = useI18nContext();

  return (
    <Box data-testid="discover-search-error">
      <EmptyState message={t('somethingWentWrong')} />
    </Box>
  );
};

type DiscoverSearchEmptyStateProps = {
  noResultsMessage: string;
  query: string;
  onAssetPress: (assetId: CaipAssetType) => void;
};

const DiscoverSearchEmptyState = ({
  noResultsMessage,
  query,
  onAssetPress,
}: DiscoverSearchEmptyStateProps) => {
  if (query) {
    return <DiscoverNoResultsState query={query} onAssetPress={onAssetPress} />;
  }

  return <EmptyState message={noResultsMessage} />;
};

const DiscoverSearchSectionDivider = () => (
  <Box className="px-4 py-2">
    <Box className="border-t border-muted" />
  </Box>
);

const SEARCH_QUERY_PARAM = 'q';
const SEARCH_TAB_PARAM = 'tab';
const DEFAULT_DISCOVER_SEARCH_TAB: DiscoverSearchTab = 'all';
const DISCOVER_SEARCH_ROW_HEIGHT = 72;

type ExploreSearchTabName = 'all' | 'tokens' | 'perps' | 'stocks';

type ExploreSearchSectionName = Exclude<ExploreSearchTabName, 'all'>;

type PendingTabSwitch = {
  tab: DiscoverSearchTab;
  previousTab: DiscoverSearchTab;
  searchQuery: string;
  comesFromViewAllTap: boolean;
};

const getExploreSearchTabName = (
  tab: DiscoverSearchTab,
): ExploreSearchTabName => (tab === 'crypto' ? 'tokens' : tab);

const getExploreSearchSectionName = (
  section: DiscoverSearchSectionId,
): ExploreSearchSectionName => (section === 'crypto' ? 'tokens' : section);

const isDiscoverSearchTab = (
  value: string | null,
): value is DiscoverSearchTab =>
  value === 'all' ||
  value === 'crypto' ||
  value === 'perps' ||
  value === 'stocks';

type DiscoverSearchRouteParamUpdates = {
  query?: string;
  tab?: DiscoverSearchTab;
};

const getInitialDiscoverSearchTab = (
  searchParams: URLSearchParams,
): DiscoverSearchTab => {
  const tab = searchParams.get(SEARCH_TAB_PARAM);
  return isDiscoverSearchTab(tab) ? tab : DEFAULT_DISCOVER_SEARCH_TAB;
};

const getNextDiscoverSearchParams = (
  previousParams: URLSearchParams,
  updates: DiscoverSearchRouteParamUpdates,
) => {
  const nextParams = new URLSearchParams(previousParams);

  if (updates.query !== undefined) {
    if (updates.query) {
      nextParams.set(SEARCH_QUERY_PARAM, updates.query);
    } else {
      nextParams.delete(SEARCH_QUERY_PARAM);
    }
  }

  if (updates.tab !== undefined) {
    if (updates.tab === DEFAULT_DISCOVER_SEARCH_TAB) {
      nextParams.delete(SEARCH_TAB_PARAM);
    } else {
      nextParams.set(SEARCH_TAB_PARAM, updates.tab);
    }
  }

  return nextParams;
};

/**
 * Discover search page: search + All / Crypto / Perps / Stock tabs.
 */
export const DiscoverSearchPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { createEventBuilder, trackEvent } = useAnalytics();
  const [searchParams, setSearchParams] = useSearchParams();
  const runCloseTransition = useGlobalMenuRouteTransition();
  const enableFeaturedEvmNetwork = useEnableFeaturedEvmNetwork();
  const isPerpsAvailable = useSelector(getIsPerpsExperienceAvailable);
  const trackedSearchKey = useRef<string | null>(null);
  const pendingTabSwitch = useRef<PendingTabSwitch | null>(null);
  const hasTrackedScroll = useRef(false);
  const isLoadingNextPageRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get(SEARCH_QUERY_PARAM) ?? '',
  );
  const [activeTab, setActiveTab] = useState<DiscoverSearchTab>(() =>
    getInitialDiscoverSearchTab(searchParams),
  );

  const {
    crypto: cryptoSection,
    perps,
    stocks,
    isDebouncing,
  } = useDiscoverSearch({
    query: searchQuery,
    activeTab,
  });

  const getSectionResultCount = useCallback(
    (section: DiscoverSearchSectionId) => {
      let searchSection;
      switch (section) {
        case 'crypto':
          searchSection = cryptoSection;
          break;
        case 'perps':
          searchSection = perps;
          break;
        case 'stocks':
          searchSection = stocks;
          break;
        default:
          throw new Error('Unknown Discover Search section');
      }
      return searchSection.totalCount ?? searchSection.items.length;
    },
    [cryptoSection, perps, stocks],
  );

  const getResultCount = useCallback(
    (tab: DiscoverSearchTab) => {
      if (tab === 'all') {
        return (
          getSectionResultCount('crypto') +
          (isPerpsAvailable ? getSectionResultCount('perps') : 0) +
          getSectionResultCount('stocks')
        );
      }
      return getSectionResultCount(tab);
    },
    [getSectionResultCount, isPerpsAvailable],
  );

  const trackExploreSearchEvent = useCallback(
    (properties: Record<string, Json | undefined>) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.ExploreSearchInteracted)
          .addProperties(properties)
          .build(),
      ).catch(() => undefined);
    },
    [createEventBuilder, trackEvent],
  );

  const handleBack = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      runCloseTransition(() => navigate(DEFAULT_ROUTE));
    },
    [navigate, runCloseTransition],
  );

  const updateRouteSearchParams = useCallback(
    (updates: DiscoverSearchRouteParamUpdates) => {
      setSearchParams(
        (previousParams) =>
          getNextDiscoverSearchParams(previousParams, updates),
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const updateSearchQuery = useCallback(
    (nextQuery: string) => {
      pendingTabSwitch.current = null;
      setSearchQuery(nextQuery);
      updateRouteSearchParams({ query: nextQuery });
    },
    [updateRouteSearchParams],
  );

  const handleSearchClear = useCallback(() => {
    updateSearchQuery('');
  }, [updateSearchQuery]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateSearchQuery(event.target.value);
    },
    [updateSearchQuery],
  );

  const updateActiveTab = useCallback(
    (tab: DiscoverSearchTab, comesFromViewAllTap = false) => {
      if (tab === activeTab) {
        return;
      }
      pendingTabSwitch.current = {
        tab,
        previousTab: activeTab,
        searchQuery,
        comesFromViewAllTap,
      };
      setActiveTab(tab);
      updateRouteSearchParams({ tab });
    },
    [activeTab, searchQuery, updateRouteSearchParams],
  );

  const handleAssetPress = useCallback(
    async (
      asset: TrendingAsset,
      section: DiscoverSearchSectionId,
      position: number,
    ) => {
      trackExploreSearchEvent({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        interaction_type: 'result_clicked',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        search_query: searchQuery,
        ...(activeTab === 'all'
          ? {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              section_name: getExploreSearchSectionName(section),
            }
          : {}),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        tab_name: getExploreSearchTabName(activeTab),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        item_clicked: asset.assetId,
        position,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_count: getResultCount(activeTab),
      });
      if (isCaipAssetType(asset.assetId)) {
        const addedNetwork = await enableFeaturedEvmNetwork(asset.assetId);
        navigate(buildAssetRoutePath(asset.assetId));
        if (addedNetwork) {
          toast.success(
            <ToastContent
              title={t('newNetworkAdded', [addedNetwork.name])}
              dataTestId="discover-network-added-success-toast"
            />,
          );
        }
      }
    },
    [
      activeTab,
      enableFeaturedEvmNetwork,
      getResultCount,
      navigate,
      searchQuery,
      t,
      trackExploreSearchEvent,
    ],
  );

  const handlePopularAssetPress = useCallback(
    async (assetId: CaipAssetType) => {
      const addedNetwork = await enableFeaturedEvmNetwork(assetId);
      navigate(buildAssetRoutePath(assetId));
      if (addedNetwork) {
        toast.success(
          <ToastContent
            title={t('newNetworkAdded', [addedNetwork.name])}
            dataTestId="discover-network-added-success-toast"
          />,
        );
      }
    },
    [enableFeaturedEvmNetwork, navigate, t],
  );

  const handlePerpsPress = useCallback(
    (market: PerpsMarketData, position: number) => {
      trackExploreSearchEvent({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        interaction_type: 'result_clicked',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        search_query: searchQuery,
        ...(activeTab === 'all'
          ? {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              section_name: 'perps',
            }
          : {}),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        tab_name: getExploreSearchTabName(activeTab),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        item_clicked: market.symbol,
        position,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_count: getResultCount(activeTab),
      });
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(market.symbol)}`,
      );
    },
    [activeTab, getResultCount, navigate, searchQuery, trackExploreSearchEvent],
  );

  const handleViewAll = useCallback(
    (tab: DiscoverSearchTab) => {
      updateActiveTab(tab, true);
    },
    [updateActiveTab],
  );

  const handleTabContentScroll = useCallback(
    (event: React.UIEvent<HTMLElement>) => {
      if (activeTab !== 'crypto' && activeTab !== 'stocks') {
        return;
      }

      const section = activeTab === 'crypto' ? cryptoSection : stocks;
      const { currentTarget } = event;
      const distanceToBottom =
        currentTarget.scrollHeight -
        currentTarget.scrollTop -
        currentTarget.clientHeight;

      if (
        distanceToBottom > 200 ||
        !section.hasNextPage ||
        section.isFetchingNextPage ||
        !section.fetchNextPage ||
        isLoadingNextPageRef.current
      ) {
        return;
      }

      isLoadingNextPageRef.current = true;
      section
        .fetchNextPage()
        .catch(() => undefined)
        .finally(() => {
          isLoadingNextPageRef.current = false;
        });
    },
    [activeTab, cryptoSection, stocks],
  );

  const getSectionViewAllLabel = useCallback(
    (
      sectionId: DiscoverSearchSectionId,
      visibleCount: number,
      serverTotal?: number,
      isLoading = false,
    ): string | null => {
      if (isLoading) {
        return null;
      }

      const action = getDiscoverViewMoreAction(
        sectionId,
        visibleCount,
        searchQuery,
        serverTotal,
      );

      if (!action) {
        return null;
      }

      if (action.kind === 'viewMore') {
        return t('viewXMore', [String(action.count)]);
      }

      return t('viewAll');
    },
    [searchQuery, t],
  );

  const trimmedSearchQuery = searchQuery.trim();
  const noResultsMessage = t('discoverSearchNoResults');

  const previewCrypto = useMemo(
    () => cryptoSection.items.slice(0, DISCOVER_SEARCH_PREVIEW_COUNT),
    [cryptoSection.items],
  );
  const previewPerps = useMemo(
    () => perps.items.slice(0, DISCOVER_SEARCH_PREVIEW_COUNT),
    [perps.items],
  );
  const previewStocks = useMemo(
    () => stocks.items.slice(0, DISCOVER_SEARCH_PREVIEW_COUNT),
    [stocks.items],
  );

  const allLoading =
    cryptoSection.isLoading ||
    (isPerpsAvailable && perps.isLoading) ||
    stocks.isLoading;

  let activeTabIsLoading: boolean;
  switch (activeTab) {
    case 'all':
      activeTabIsLoading = allLoading;
      break;
    case 'crypto':
      activeTabIsLoading = cryptoSection.isLoading;
      break;
    case 'perps':
      activeTabIsLoading = perps.isLoading;
      break;
    case 'stocks':
      activeTabIsLoading = stocks.isLoading;
      break;
    default:
      throw new Error('Unknown Discover Search tab');
  }

  useEffect(() => {
    const pendingSwitch = pendingTabSwitch.current;
    if (
      !pendingSwitch ||
      pendingSwitch.tab !== activeTab ||
      pendingSwitch.searchQuery !== searchQuery ||
      isDebouncing ||
      activeTabIsLoading
    ) {
      return;
    }

    trackExploreSearchEvent({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      interaction_type: 'tab_switched',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      search_query: pendingSwitch.searchQuery,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tab_name: getExploreSearchTabName(pendingSwitch.tab),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      previous_tab: getExploreSearchTabName(pendingSwitch.previousTab),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      comes_from_view_all_tap: pendingSwitch.comesFromViewAllTap || undefined,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_count: getResultCount(pendingSwitch.tab),
    });
    pendingTabSwitch.current = null;
  }, [
    activeTab,
    activeTabIsLoading,
    getResultCount,
    isDebouncing,
    searchQuery,
    trackExploreSearchEvent,
  ]);

  useEffect(() => {
    if (!trimmedSearchQuery) {
      trackedSearchKey.current = null;
      return;
    }
    const searchKey = `${activeTab}:${trimmedSearchQuery}`;
    if (
      isDebouncing ||
      activeTabIsLoading ||
      trackedSearchKey.current === searchKey
    ) {
      return;
    }
    trackExploreSearchEvent({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      interaction_type: 'searched',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      search_query: searchQuery,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tab_name: getExploreSearchTabName(activeTab),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_count: getResultCount(activeTab),
    });
    trackedSearchKey.current = searchKey;
  }, [
    activeTab,
    activeTabIsLoading,
    getResultCount,
    isDebouncing,
    searchQuery,
    trackExploreSearchEvent,
    trimmedSearchQuery,
  ]);

  useEffect(() => {
    hasTrackedScroll.current = false;
  }, [activeTab, trimmedSearchQuery]);

  const handleResultsScroll = useCallback(() => {
    if (!trimmedSearchQuery || hasTrackedScroll.current) {
      return;
    }
    hasTrackedScroll.current = true;
    trackExploreSearchEvent({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      interaction_type: 'scrolled',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      search_query: searchQuery,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      tab_name: getExploreSearchTabName(activeTab),
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_count: getResultCount(activeTab),
    });
  }, [
    activeTab,
    getResultCount,
    searchQuery,
    trackExploreSearchEvent,
    trimmedSearchQuery,
  ]);

  const handleResultsContainerScroll = useCallback(
    (event: React.UIEvent<HTMLElement>) => {
      handleResultsScroll();
      handleTabContentScroll(event);
    },
    [handleResultsScroll, handleTabContentScroll],
  );

  const hasAnyPreview =
    previewCrypto.length > 0 ||
    (isPerpsAvailable && previewPerps.length > 0) ||
    previewStocks.length > 0;

  const showAllLoading = allLoading && !hasAnyPreview;
  const showAllEmpty = !allLoading && !hasAnyPreview;
  const hasAllError = Boolean(
    cryptoSection.error || stocks.error || (isPerpsAvailable && perps.error),
  );
  const showCryptoPreview = previewCrypto.length > 0 || cryptoSection.isLoading;
  const showPerpsPreview =
    isPerpsAvailable && (previewPerps.length > 0 || perps.isLoading);
  const showStocksPreview = previewStocks.length > 0 || stocks.isLoading;

  const renderAllTabSkeleton = () => (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid="discover-search-loading"
    >
      <DiscoverSearchSectionHeader
        title={t('perpsFilterCrypto')}
        showViewAll={false}
        data-testid="discover-section-crypto"
      />
      <DiscoverSearchSectionSkeleton testIdPrefix="discover-crypto-preview" />

      {isPerpsAvailable ? (
        <>
          <DiscoverSearchSectionDivider />
          <DiscoverSearchSectionHeader
            title={t('perps')}
            showViewAll={false}
            data-testid="discover-section-perps"
          />
          <DiscoverSearchSectionSkeleton testIdPrefix="discover-perps" />
        </>
      ) : null}

      <DiscoverSearchSectionDivider />
      <DiscoverSearchSectionHeader
        title={t('perpsFilterStocks')}
        showViewAll={false}
        data-testid="discover-section-stocks"
      />
      <DiscoverSearchSectionSkeleton testIdPrefix="discover-stocks-preview" />
    </Box>
  );

  const renderAssetList = (
    items: TrendingAsset[],
    isLoading: boolean,
    error: Error | null | undefined,
    testIdPrefix: string,
    section: DiscoverSearchSectionId,
  ) => {
    if (isLoading && items.length === 0) {
      return <DiscoverSearchSectionSkeleton testIdPrefix={testIdPrefix} />;
    }
    if (error && items.length === 0) {
      return <DiscoverSearchErrorState />;
    }
    if (items.length === 0) {
      return (
        <DiscoverSearchEmptyState
          noResultsMessage={noResultsMessage}
          query={trimmedSearchQuery}
          onAssetPress={handlePopularAssetPress}
        />
      );
    }
    return (
      <VirtualizedList
        data={items}
        estimatedItemSize={DISCOVER_SEARCH_ROW_HEIGHT}
        overscan={10}
        keyExtractor={(asset) => asset.assetId}
        enableScrollMargin
        renderItem={({ item: asset, index }) => (
          <DiscoverAssetRow
            asset={asset}
            onPress={() => handleAssetPress(asset, section, index)}
            data-testid={`${testIdPrefix}-${asset.assetId}`}
          />
        )}
      />
    );
  };

  const renderPerpsList = (
    items: PerpsMarketData[],
    isLoading: boolean,
    error: Error | null | undefined,
  ) => {
    if (isLoading && items.length === 0) {
      return <DiscoverSearchSectionSkeleton testIdPrefix="discover-perps" />;
    }
    if (error && items.length === 0) {
      return <DiscoverSearchErrorState />;
    }
    if (items.length === 0) {
      return (
        <DiscoverSearchEmptyState
          noResultsMessage={noResultsMessage}
          query={trimmedSearchQuery}
          onAssetPress={handlePopularAssetPress}
        />
      );
    }
    return (
      <VirtualizedList
        data={items}
        estimatedItemSize={DISCOVER_SEARCH_ROW_HEIGHT}
        overscan={10}
        keyExtractor={(market) => market.symbol}
        enableScrollMargin
        renderItem={({ item: market, index }) => (
          <MarketRow
            market={market}
            onPress={() => handlePerpsPress(market, index)}
            displayMetric="volume"
            data-testid={`discover-perps-row-${market.symbol.replaceAll(':', '-')}`}
          />
        )}
      />
    );
  };

  const renderScrollableTabContent = (content: React.ReactNode) => (
    <ScrollContainer
      className="h-full min-h-0 overflow-y-auto overscroll-contain pb-6"
      onScroll={handleResultsContainerScroll}
    >
      {content}
    </ScrollContainer>
  );

  const allTabContent = (() => {
    if (showAllLoading) {
      return renderAllTabSkeleton();
    }
    if (showAllEmpty) {
      return hasAllError ? (
        <DiscoverSearchErrorState />
      ) : (
        <DiscoverSearchEmptyState
          noResultsMessage={noResultsMessage}
          query={trimmedSearchQuery}
          onAssetPress={handlePopularAssetPress}
        />
      );
    }
    return (
      <Box flexDirection={BoxFlexDirection.Column}>
        {showCryptoPreview ? (
          <>
            <DiscoverSearchSectionHeader
              title={t('perpsFilterCrypto')}
              onViewAll={() => handleViewAll('crypto')}
              viewAllLabel={getSectionViewAllLabel(
                'crypto',
                cryptoSection.items.length,
                cryptoSection.totalCount,
                cryptoSection.isLoading,
              )}
              data-testid="discover-section-crypto"
            />
            {renderAssetList(
              previewCrypto,
              cryptoSection.isLoading,
              cryptoSection.error,
              'discover-crypto-preview',
              'crypto',
            )}
          </>
        ) : null}

        {showPerpsPreview ? (
          <>
            {showCryptoPreview ? <DiscoverSearchSectionDivider /> : null}
            <DiscoverSearchSectionHeader
              title={t('perps')}
              onViewAll={() => handleViewAll('perps')}
              viewAllLabel={getSectionViewAllLabel(
                'perps',
                perps.items.length,
                perps.totalCount,
                perps.isLoading,
              )}
              data-testid="discover-section-perps"
            />
            {renderPerpsList(previewPerps, perps.isLoading, perps.error)}
          </>
        ) : null}

        {showStocksPreview ? (
          <>
            {showCryptoPreview || showPerpsPreview ? (
              <DiscoverSearchSectionDivider />
            ) : null}
            <DiscoverSearchSectionHeader
              title={t('perpsFilterStocks')}
              onViewAll={() => handleViewAll('stocks')}
              viewAllLabel={getSectionViewAllLabel(
                'stocks',
                stocks.items.length,
                stocks.totalCount,
                stocks.isLoading,
              )}
              data-testid="discover-section-stocks"
            />
            {renderAssetList(
              previewStocks,
              stocks.isLoading,
              stocks.error,
              'discover-stocks-preview',
              'stocks',
            )}
          </>
        ) : null}
      </Box>
    );
  })();

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className="h-full min-h-0 w-full overflow-hidden"
      data-testid="discover-search-page"
    >
      <Box
        className="shrink-0 gap-2 bg-background-default px-4 py-4"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
      >
        <Link
          to={DEFAULT_ROUTE}
          aria-label={t('back')}
          onClick={handleBack}
          className="shrink-0"
        >
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            ariaLabel={t('back')}
            size={ButtonIconSize.Md}
            data-testid="discover-search-back-button"
          />
        </Link>
        <TextFieldSearch
          autoFocus={true}
          className="min-w-0 flex-1"
          placeholder={t('searchTokens')}
          value={searchQuery}
          onChange={handleSearchChange}
          clearButtonOnClick={handleSearchClear}
          inputProps={
            {
              'data-testid': 'discover-search-input',
              spellCheck: false,
            } as React.ComponentPropsWithoutRef<'input'>
          }
        />
      </Box>

      <Tabs
        animated
        activeTab={activeTab}
        onTabClick={(tab) => updateActiveTab(tab as DiscoverSearchTab)}
        className="min-h-0 flex-1"
        flexDirection={BoxFlexDirection.Column}
        tabListProps={{ className: 'px-4 pb-4 shrink-0' }}
        tabContentProps={{
          className: 'min-h-0 flex-1',
        }}
      >
        <Tab name={t('all')} tabKey="all" data-testid="discover-tab-all">
          {renderScrollableTabContent(allTabContent)}
        </Tab>

        <Tab
          name={t('perpsFilterCrypto')}
          tabKey="crypto"
          data-testid="discover-tab-crypto"
        >
          {renderScrollableTabContent(
            renderAssetList(
              cryptoSection.items,
              cryptoSection.isLoading,
              cryptoSection.error,
              'discover-crypto',
              'crypto',
            ),
          )}
        </Tab>

        {isPerpsAvailable ? (
          <Tab
            name={t('perps')}
            tabKey="perps"
            data-testid="discover-tab-perps"
          >
            {renderScrollableTabContent(
              renderPerpsList(perps.items, perps.isLoading, perps.error),
            )}
          </Tab>
        ) : null}

        <Tab
          name={t('perpsFilterStocks')}
          tabKey="stocks"
          data-testid="discover-tab-stocks"
        >
          {renderScrollableTabContent(
            renderAssetList(
              stocks.items,
              stocks.isLoading,
              stocks.error,
              'discover-stocks',
              'stocks',
            ),
          )}
        </Tab>
      </Tabs>
    </Box>
  );
};

export default DiscoverSearchPage;
