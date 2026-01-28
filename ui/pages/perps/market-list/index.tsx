import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import {
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../../components/app/perps/mocks';
import type { PerpsMarketData } from '../../../components/app/perps/types';
import { filterMarketsByQuery } from '../../../components/app/perps/utils';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_DETAIL_ROUTE,
} from '../../../helpers/constants/routes';
import { getIsPerpsEnabled } from '../../../selectors/perps/feature-flags';
import {
  sortMarkets,
  type SortField,
  type SortDirection,
} from '../utils/sortMarkets';
import { filterMarketsByType, type CategoryFilter } from './types';
import { useWatchlist } from './hooks/useWatchlist';
import { MarketRow } from './components/market-row';
import { MarketRowSkeleton } from './components/market-row-skeleton';
import {
  SortDropdown,
  SORT_OPTIONS,
  type SortOptionId,
} from './components/sort-dropdown';
import { SearchInput } from './components/search-input';
import { CategoryBadges } from './components/category-badges';
import { WatchlistEmptyState } from './components/watchlist-empty-state';

// Combine all markets
const allMarkets: PerpsMarketData[] = [
  ...mockCryptoMarkets,
  ...mockHip3Markets,
];

/**
 * MarketListView displays a searchable, sortable list of markets
 * with category badge filtering and watchlist support.
 */
export const MarketListView: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const isPerpsEnabled = useSelector(getIsPerpsEnabled);

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSortId, setSelectedSortId] = useState<SortOptionId>('volume');
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter | null>(null);
  const [isWatchlistSelected, setIsWatchlistSelected] = useState(false);

  // Watchlist hook
  const {
    watchlist,
    toggleWatchlist,
    isInWatchlist,
    isEmpty: isWatchlistEmpty,
  } = useWatchlist();

  // Get current sort option
  const currentSortOption = SORT_OPTIONS.find(
    (option) => option.id === selectedSortId,
  );

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter and sort markets
  // When searching, bypass filters and search ALL markets (like mobile)
  // When not searching, apply filters
  const displayedMarkets = useMemo(() => {
    let markets: PerpsMarketData[];

    if (searchQuery.trim()) {
      // Searching: search across ALL markets, ignore filters
      markets = filterMarketsByQuery(allMarkets, searchQuery);
    } else if (isWatchlistSelected) {
      // Watchlist filter
      markets = filterMarketsByType(allMarkets, 'watchlist', watchlist);
    } else if (selectedCategory) {
      // Category filter
      markets = filterMarketsByType(allMarkets, selectedCategory, watchlist);
    } else {
      // No filter - show all
      markets = allMarkets;
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
    selectedCategory,
    isWatchlistSelected,
    watchlist,
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

  const handleCategorySelect = useCallback(
    (category: CategoryFilter | null) => {
      setSelectedCategory(category);
    },
    [],
  );

  const handleWatchlistToggle = useCallback(() => {
    setIsWatchlistSelected((prev) => !prev);
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

  // Determine if we should show watchlist icons (when watchlist filter is active)
  const showWatchlistIcons = isWatchlistSelected;

  // Determine if we should show the empty watchlist state
  const showEmptyWatchlistState =
    !isLoading && isWatchlistSelected && isWatchlistEmpty;

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

      {/* Category Badges Row - Hidden when searching */}
      {!searchQuery.trim() && (
        <Box
          className="border-b border-border-muted px-4 py-3"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          data-testid="market-list-category-row"
        >
          <CategoryBadges
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
            isWatchlistSelected={isWatchlistSelected}
            onToggleWatchlist={handleWatchlistToggle}
          />
        </Box>
      )}

      {/* Sort Row - Hidden when searching */}
      {!searchQuery.trim() && (
        <Box
          className="border-b border-border-muted px-4 py-3"
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Start}
          data-testid="market-list-sort-row"
        >
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

        {/* Empty watchlist state with suggestions */}
        {showEmptyWatchlistState && (
          <WatchlistEmptyState
            allMarkets={allMarkets}
            onToggleWatchlist={toggleWatchlist}
            isInWatchlist={isInWatchlist}
            onMarketPress={handleMarketSelect}
          />
        )}

        {/* Market rows */}
        {!isLoading &&
          !showEmptyWatchlistState &&
          displayedMarkets.length > 0 &&
          displayedMarkets.map((market) => (
            <MarketRow
              key={market.symbol}
              market={market}
              displayMetric={currentSortOption?.field || 'volume'}
              onPress={handleMarketSelect}
              showWatchlistIcon={showWatchlistIcons}
              isInWatchlist={isInWatchlist(market.symbol)}
              onToggleWatchlist={toggleWatchlist}
            />
          ))}

        {/* Empty state (for non-watchlist filters) */}
        {!isLoading &&
          !showEmptyWatchlistState &&
          displayedMarkets.length === 0 && (
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
