import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import type { TrendingAsset } from '@metamask/assets-controllers';
import type { PerpsMarketData } from '@metamask/perps-controller';
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
import { DISCOVER_SEARCH_PREVIEW_COUNT } from '../../hooks/discover-search/constants';
import { getDiscoverViewMoreAction } from '../../hooks/discover-search/get-discover-view-more-action';
import { useDiscoverSearch } from '../../hooks/discover-search/useDiscoverSearch';
import type {
  DiscoverSearchSectionId,
  DiscoverSearchTab,
} from '../../hooks/discover-search/types';
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

/**
 * Discover search page: search + All / Crypto / Perps / Stock tabs.
 */
export const DiscoverSearchPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const runCloseTransition = useGlobalMenuRouteTransition();
  const isPerpsAvailable = useSelector(getIsPerpsExperienceAvailable);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<DiscoverSearchTab>('all');

  const {
    crypto: cryptoSection,
    perps,
    stocks,
  } = useDiscoverSearch({
    query: searchQuery,
    activeTab,
  });

  const handleBack = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      runCloseTransition(() => navigate(DEFAULT_ROUTE));
    },
    [navigate, runCloseTransition],
  );

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleAssetPress = useCallback(
    (asset: TrendingAsset) => {
      if (isCaipAssetType(asset.assetId)) {
        navigate(buildAssetRoutePath(asset.assetId));
      }
    },
    [navigate],
  );

  const handlePerpsPress = useCallback(
    (market: PerpsMarketData) => {
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(market.symbol)}`,
      );
    },
    [navigate],
  );

  const handleViewAll = useCallback((tab: DiscoverSearchTab) => {
    setActiveTab(tab);
  }, []);

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
    return items.map((asset) => (
      <DiscoverAssetRow
        key={asset.assetId}
        asset={asset}
        onPress={handleAssetPress}
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
    return items.map((market) => (
      <MarketRow
        key={market.symbol}
        market={market}
        onPress={handlePerpsPress}
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
      className="w-full h-full min-h-0"
      data-testid="discover-search-page"
    >
      <Box
        className="shrink-0 gap-2 px-4 py-4"
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
          onChange={(event) => setSearchQuery(event.target.value)}
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
        onTabClick={(tab) => setActiveTab(tab as DiscoverSearchTab)}
        className="min-h-0 flex-1"
        tabListProps={{ className: 'px-4 pb-4 shrink-0' }}
        tabContentProps={{ className: 'min-h-0 overflow-y-auto pb-6' }}
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
          {renderAssetList(stocks.items, stocks.isLoading, 'discover-stocks')}
        </Tab>
      </Tabs>
    </Box>
  );
};

export default DiscoverSearchPage;
