import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  TextColor,
  ButtonBase,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { usePerpsLiveMarketData } from '../../../hooks/perps/stream';
import {
  filterMarketsByQuery,
  isHip3Market,
  isCryptoMarket,
} from '../../../components/app/perps/utils';
import { getHip3MarketType } from '../../../components/app/perps/constants';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getIsPerpsEnabled,
  getHip3AllowedSourcesSet,
} from '../../../selectors/perps/feature-flags';
import {
  sortMarkets,
  type SortField,
  type SortDirection,
} from '../utils/sortMarkets';
import { MarketRow } from './components/market-row';
import { MarketRowSkeleton } from './components/market-row-skeleton';
import {
  SortDropdown,
  SORT_OPTIONS,
  type SortOptionId,
} from './components/sort-dropdown';
import { SearchInput } from './components/search-input';
import { FilterSelect, type MarketFilter } from './components/filter-select';
import type { PerpsMarketData } from '@metamask/perps-controller';

/**
 * Get the resolved market type for a market.
 * Uses the HIP3_ASSET_MARKET_TYPES mapping first, then falls back to the market's own marketType.
 *
 * @param market - The market data
 * @returns The resolved market type
 */
const getResolvedMarketType = (market: PerpsMarketData): string | undefined => {
  return getHip3MarketType(market.symbol, market.marketType);
};

/**
 * Check if a market is an uncategorized HIP-3 market (no market type mapping).
 * These are HIP-3 assets that haven't been classified as equity, commodity, or forex.
 *
 * @param market - The market data
 * @param allowedHip3Sources - Set of allowed HIP-3 market sources
 * @returns True if the market is HIP-3 but has no category
 */
const isUncategorizedHip3Market = (
  market: PerpsMarketData,
  allowedHip3Sources: Set<string>,
): boolean => {
  return (
    isHip3Market(market, allowedHip3Sources) && !getResolvedMarketType(market)
  );
};

/**
 * Filter markets by market type
 *
 * Crypto markets have no marketSource (main DEX).
 * HIP-3 markets (stocks, commodities, forex) come from allowed DEX providers.
 * Market type is resolved using HIP3_ASSET_MARKET_TYPES mapping first,
 * then falls back to the market's own marketType property.
 * "New" category shows HIP-3 assets that haven't been categorized yet.
 *
 * @param markets - Array of markets to filter
 * @param filter - Market type filter
 * @param allowedHip3Sources - Set of allowed HIP-3 market sources from feature flag
 * @returns Filtered array of markets
 */
const filterByType = (
  markets: PerpsMarketData[],
  filter: MarketFilter,
  allowedHip3Sources: Set<string>,
): PerpsMarketData[] => {
  switch (filter) {
    case 'all': {
      return markets;
    }
    case 'crypto': {
      return markets.filter(isCryptoMarket);
    }
    case 'stocks': {
      return markets.filter(
        (m) =>
          isHip3Market(m, allowedHip3Sources) &&
          getResolvedMarketType(m) === 'equity',
      );
    }
    case 'commodities': {
      return markets.filter(
        (m) =>
          isHip3Market(m, allowedHip3Sources) &&
          getResolvedMarketType(m) === 'commodity',
      );
    }
    case 'forex': {
      return markets.filter(
        (m) =>
          isHip3Market(m, allowedHip3Sources) &&
          getResolvedMarketType(m) === 'forex',
      );
    }
    case 'new': {
      return markets.filter((m) =>
        isUncategorizedHip3Market(m, allowedHip3Sources),
      );
    }
    default: {
      return markets;
    }
  }
};

/**
 * MarketListView displays a searchable, sortable list of markets
 */
export const MarketListView: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const isPerpsEnabled = useSelector(getIsPerpsEnabled);
  const allowedHip3Sources = useSelector(getHip3AllowedSourcesSet);

  // Use stream hooks for real-time market data
  const { markets: allMarkets, isInitialLoading: marketsLoading } =
    usePerpsLiveMarketData();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSortId, setSelectedSortId] =
    useState<SortOptionId>('volumeHigh');
  const [selectedFilter, setSelectedFilter] = useState<MarketFilter>('all');

  // Get current sort option
  const currentSortOption = SORT_OPTIONS.find(
    (option) => option.id === selectedSortId,
  );

  // Use stream loading state
  const isLoading = marketsLoading;

  // Check if there are any uncategorized HIP-3 markets (for showing "New" filter)
  const hasUncategorizedMarkets = useMemo(() => {
    return allMarkets.some((m) =>
      isUncategorizedHip3Market(m, allowedHip3Sources),
    );
  }, [allMarkets, allowedHip3Sources]);

  // Filter and sort markets
  // When searching, bypass filters and search ALL markets (like mobile)
  // When not searching, apply filters
  const displayedMarkets = useMemo(() => {
    let markets: PerpsMarketData[];

    if (searchQuery.trim()) {
      // Searching: search across ALL markets, ignore filters
      markets = filterMarketsByQuery(allMarkets, searchQuery);
    } else {
      // Not searching: apply filters
      markets = filterByType(allMarkets, selectedFilter, allowedHip3Sources);
    }

    if (currentSortOption) {
      markets = sortMarkets({
        markets,
        sortBy: currentSortOption.field,
        direction: currentSortOption.direction,
      });
    }
    return markets;
  }, [
    allMarkets,
    selectedFilter,
    allowedHip3Sources,
    searchQuery,
    currentSortOption,
  ]);

  // Handlers
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleSortChange = useCallback(
    (optionId: SortOptionId, _field: SortField, _direction: SortDirection) => {
      setSelectedSortId(optionId);
    },
    [],
  );

  const handleFilterChange = useCallback((filter: MarketFilter) => {
    setSelectedFilter(filter);
  }, []);

  const handleMarketSelect = useCallback(
    (market: PerpsMarketData) => {
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(market.symbol)}`,
      );
    },
    [navigate],
  );

  // Guard: redirect if perps feature is disabled
  if (!isPerpsEnabled) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <Box
      className="flex h-full flex-col bg-background-default"
      flexDirection={BoxFlexDirection.Column}
      data-testid="market-list-view"
    >
      {/* Header */}
      <Box
        className="border-b border-border-muted px-4 py-3"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={3}
      >
        <ButtonBase
          onClick={handleBack}
          className="rounded-full p-1 bg-transparent min-w-0 h-auto hover:bg-hover active:bg-pressed"
          data-testid="back-button"
          aria-label={t('back')}
        >
          <Icon
            name={IconName.ArrowLeft}
            size={IconSize.Md}
            color={IconColor.IconDefault}
          />
        </ButtonBase>
        <Text fontWeight={FontWeight.Medium}>{t('perpsMarkets')}</Text>
      </Box>

      {/* Search Row */}
      <Box
        className="border-b border-border-muted px-4 py-3"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
      >
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          autoFocus
        />
      </Box>

      {/* Filter and Sort Row - Hidden when searching */}
      {!searchQuery.trim() && (
        <Box
          className="border-b border-border-muted px-4 py-3 flex-wrap"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Start}
          gap={3}
          data-testid="market-list-filter-sort-row"
        >
          <FilterSelect
            value={selectedFilter}
            onChange={handleFilterChange}
            showNewFilter={hasUncategorizedMarkets}
          />
          <SortDropdown
            selectedOptionId={selectedSortId}
            onOptionChange={handleSortChange}
          />
        </Box>
      )}

      {/* Market List */}
      <Box
        className="flex-1 overflow-y-auto"
        flexDirection={BoxFlexDirection.Column}
      >
        {/* Loading skeletons */}
        {isLoading &&
          Array.from({ length: 8 }).map((_, index) => (
            <MarketRowSkeleton key={`skeleton-${index}`} />
          ))}

        {/* Market rows */}
        {!isLoading &&
          displayedMarkets.length > 0 &&
          displayedMarkets.map((market) => (
            <MarketRow
              key={market.symbol}
              market={market}
              displayMetric={currentSortOption?.field || 'volume'}
              onPress={handleMarketSelect}
            />
          ))}

        {/* Empty state */}
        {!isLoading && displayedMarkets.length === 0 && (
          <Box
            className="px-4 py-8"
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={2}
          >
            <Icon
              name={IconName.Search}
              size={IconSize.Lg}
              color={IconColor.IconMuted}
            />
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('perpsNoMarketsFound')}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MarketListView;
