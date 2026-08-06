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
import type { Json } from '@metamask/utils';
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
import { isCaipAssetType } from '@metamask/utils';

import { MarketRow } from '../../components/app/perps/market-row';
import { Tab, Tabs } from '../../components/ui/tabs';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
} from '../../helpers/constants/routes';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { DISCOVER_SEARCH_PREVIEW_COUNT } from '../../hooks/discover-search/constants';
import { getDiscoverViewMoreAction } from '../../hooks/discover-search/get-discover-view-more-action';
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

type DiscoverSearchEmptyStateProps = {
  noResultsMessage: string;
  query: string;
};

const DiscoverSearchEmptyState = ({
  noResultsMessage,
  query,
}: DiscoverSearchEmptyStateProps) => {
  const navigate = useNavigate();

  if (query) {
    return (
      <DiscoverNoResultsState
        query={query}
        onAssetPress={(assetId) => navigate(buildAssetRoutePath(assetId))}
      />
    );
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

type ExploreSearchTabName = 'all' | 'tokens' | 'perps' | 'stocks';

type ExploreSearchSectionName = Exclude<ExploreSearchTabName, 'all'>;

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
  const isPerpsAvailable = useSelector(getIsPerpsExperienceAvailable);
  const trackedSearchQuery = useRef<string | null>(null);
  const hasTrackedScroll = useRef(false);

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
      trackExploreSearchEvent({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        interaction_type: 'tab_switched',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        search_query: searchQuery,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        tab_name: getExploreSearchTabName(tab),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        previous_tab: getExploreSearchTabName(activeTab),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        comes_from_view_all_tap: comesFromViewAllTap || undefined,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        result_count: getResultCount(tab),
      });
      setActiveTab(tab);
      updateRouteSearchParams({ tab });
    },
    [
      activeTab,
      getResultCount,
      searchQuery,
      trackExploreSearchEvent,
      updateRouteSearchParams,
    ],
  );

  const handleAssetPress = useCallback(
    (
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
        navigate(buildAssetRoutePath(asset.assetId));
      }
    },
    [activeTab, getResultCount, navigate, searchQuery, trackExploreSearchEvent],
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
    if (!trimmedSearchQuery) {
      trackedSearchQuery.current = null;
      return;
    }
    if (
      isDebouncing ||
      activeTabIsLoading ||
      trackedSearchQuery.current === trimmedSearchQuery
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
    trackedSearchQuery.current = trimmedSearchQuery;
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

  const hasAnyPreview =
    previewCrypto.length > 0 ||
    (isPerpsAvailable && previewPerps.length > 0) ||
    previewStocks.length > 0;

  const showAllLoading = allLoading && !hasAnyPreview;
  const showAllEmpty = !allLoading && !hasAnyPreview;
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
    testIdPrefix: string,
    section: DiscoverSearchSectionId,
  ) => {
    if (isLoading && items.length === 0) {
      return <DiscoverSearchSectionSkeleton testIdPrefix={testIdPrefix} />;
    }
    if (items.length === 0) {
      return (
        <DiscoverSearchEmptyState
          noResultsMessage={noResultsMessage}
          query={trimmedSearchQuery}
        />
      );
    }
    return items.map((asset, position) => (
      <DiscoverAssetRow
        key={asset.assetId}
        asset={asset}
        onPress={() => handleAssetPress(asset, section, position)}
        data-testid={`${testIdPrefix}-${asset.assetId}`}
      />
    ));
  };

  const renderPerpsList = (items: PerpsMarketData[], isLoading: boolean) => {
    if (isLoading && items.length === 0) {
      return <DiscoverSearchSectionSkeleton testIdPrefix="discover-perps" />;
    }
    if (items.length === 0) {
      return (
        <DiscoverSearchEmptyState
          noResultsMessage={noResultsMessage}
          query={trimmedSearchQuery}
        />
      );
    }
    return items.map((market, position) => (
      <MarketRow
        key={market.symbol}
        market={market}
        onPress={() => handlePerpsPress(market, position)}
        displayMetric="volume"
        data-testid={`discover-perps-row-${market.symbol.replaceAll(':', '-')}`}
      />
    ));
  };

  const allTabContent = (() => {
    if (showAllLoading) {
      return renderAllTabSkeleton();
    }
    if (showAllEmpty) {
      return (
        <DiscoverSearchEmptyState
          noResultsMessage={noResultsMessage}
          query={trimmedSearchQuery}
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
                undefined,
                perps.isLoading,
              )}
              data-testid="discover-section-perps"
            />
            {renderPerpsList(previewPerps, perps.isLoading)}
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
          className: 'min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6',
          onScroll: handleResultsScroll,
        }}
      >
        <Tab name={t('all')} tabKey="all" data-testid="discover-tab-all">
          {allTabContent}
        </Tab>

        <Tab
          name={t('perpsFilterCrypto')}
          tabKey="crypto"
          data-testid="discover-tab-crypto"
        >
          {renderAssetList(
            cryptoSection.items,
            cryptoSection.isLoading,
            'discover-crypto',
            'crypto',
          )}
        </Tab>

        {isPerpsAvailable ? (
          <Tab
            name={t('perps')}
            tabKey="perps"
            data-testid="discover-tab-perps"
          >
            {renderPerpsList(perps.items, perps.isLoading)}
          </Tab>
        ) : null}

        <Tab
          name={t('tokenStock')}
          tabKey="stocks"
          data-testid="discover-tab-stocks"
        >
          {renderAssetList(
            stocks.items,
            stocks.isLoading,
            'discover-stocks',
            'stocks',
          )}
        </Tab>
      </Tabs>
    </Box>
  );
};

export default DiscoverSearchPage;
