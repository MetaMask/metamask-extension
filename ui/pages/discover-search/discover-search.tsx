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
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextColor,
  TextFieldSearch,
  TextFieldSize,
  TextVariant,
} from '@metamask/design-system-react';
import { isCaipAssetType, type CaipAssetType } from '@metamask/utils';

import { MarketRow } from '../../components/app/perps/market-row';
import { Tab, Tabs } from '../../components/ui/tabs';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
} from '../../helpers/constants/routes';
import { DISCOVER_SEARCH_PREVIEW_COUNT } from '../../hooks/discover-search/constants';
import { useDiscoverSearch } from '../../hooks/discover-search/useDiscoverSearch';
import type { DiscoverSearchTab } from '../../hooks/discover-search/types';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { buildAssetRoutePath } from '../../../shared/lib/asset-route';
import { useGlobalMenuRouteTransition } from '../routes/global-menu-route-transition';
import { DiscoverAssetRow } from './discover-asset-row';
import { DiscoverNoResultsState } from './discover-no-results-state';
import { DiscoverSearchSectionHeader } from './discover-search-section-header';

const LoadingState = ({ label }: { label: string }) => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    alignItems={BoxAlignItems.Center}
    justifyContent={BoxJustifyContent.Center}
    padding={6}
    aria-label={label}
    data-testid="discover-search-loading"
  >
    <Icon
      className="animate-spin"
      name={IconName.Loading}
      color={IconColor.IconMuted}
      size={IconSize.Lg}
    />
  </Box>
);

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

type DiscoverAllEmptyStateProps = {
  noResultsMessage: string;
  onAssetPress: (assetId: CaipAssetType) => void;
  query: string;
};

const DiscoverAllEmptyState = ({
  noResultsMessage,
  onAssetPress,
  query,
}: DiscoverAllEmptyStateProps) => {
  if (query) {
    return <DiscoverNoResultsState query={query} onAssetPress={onAssetPress} />;
  }

  return <EmptyState message={noResultsMessage} />;
};

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

  const trimmedSearchQuery = searchQuery.trim();

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

  const renderAssetList = (
    items: TrendingAsset[],
    isLoading: boolean,
    testIdPrefix: string,
  ) => {
    if (isLoading && items.length === 0) {
      return <LoadingState label={t('loading')} />;
    }
    if (items.length === 0) {
      return <EmptyState message={t('discoverSearchNoResults')} />;
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
      return <LoadingState label={t('loading')} />;
    }
    if (items.length === 0) {
      return <EmptyState message={t('discoverSearchNoResults')} />;
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
      return <LoadingState label={t('loading')} />;
    }
    if (showAllEmpty) {
      return (
        <DiscoverAllEmptyState
          noResultsMessage={t('discoverSearchNoResults')}
          onAssetPress={(assetId) => navigate(buildAssetRoutePath(assetId))}
          query={trimmedSearchQuery}
        />
      );
    }
    return (
      <Box flexDirection={BoxFlexDirection.Column}>
        {previewCrypto.length > 0 || cryptoSection.isLoading ? (
          <>
            <DiscoverSearchSectionHeader
              title={t('perpsFilterCrypto')}
              onViewAll={() => handleViewAll('crypto')}
              data-testid="discover-section-crypto"
            />
            {renderAssetList(
              previewCrypto,
              cryptoSection.isLoading,
              'discover-crypto-preview',
            )}
          </>
        ) : null}

        {isPerpsAvailable && (previewPerps.length > 0 || perps.isLoading) ? (
          <>
            <DiscoverSearchSectionHeader
              title={t('perps')}
              onViewAll={() => handleViewAll('perps')}
              data-testid="discover-section-perps"
            />
            {renderPerpsList(previewPerps, perps.isLoading)}
          </>
        ) : null}

        {previewStocks.length > 0 || stocks.isLoading ? (
          <>
            <DiscoverSearchSectionHeader
              title={t('perpsFilterStocks')}
              onViewAll={() => handleViewAll('stocks')}
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
        className="shrink-0 gap-2 px-4 py-3"
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
          className="app-text-field-search min-w-0 flex-1"
          placeholder={t('searchTokens')}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          clearButtonOnClick={handleSearchClear}
          size={TextFieldSize.Md}
          inputProps={
            {
              'data-testid': 'discover-search-input',
              autoFocus: true,
              spellCheck: false,
            } as React.ComponentPropsWithoutRef<'input'>
          }
        />
      </Box>

      <Tabs
        activeTab={activeTab}
        onTabClick={(tab) => setActiveTab(tab as DiscoverSearchTab)}
        className="min-h-0 flex-1"
        tabListProps={{ className: 'px-4 shrink-0' }}
        tabContentProps={{ className: 'min-h-0 overflow-y-auto' }}
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
