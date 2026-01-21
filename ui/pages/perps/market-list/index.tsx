import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  mockCryptoMarkets,
  mockHip3Markets,
} from '../../../components/app/perps/mocks';
import type { PerpsMarketData } from '../../../components/app/perps/types';
import { filterMarketsByQuery } from '../../../components/app/perps/utils';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../helpers/constants/routes';
import { sortMarkets } from '../utils/sortMarkets';
import { MarketRow, type SortField } from './components/market-row';
import { MarketRowSkeleton } from './components/market-row-skeleton';
import {
  SortDropdown,
  SORT_OPTIONS,
  type SortOptionId,
  type SortDirection,
} from './components/sort-dropdown';
import { SearchInput } from './components/search-input';
import { FilterSelect, type MarketFilter } from './components/filter-select';
import {
  StockSubFilterSelect,
  type StockSubFilter,
} from './components/stock-sub-filter';

// Combine all markets
const allMarkets: PerpsMarketData[] = [
  ...mockCryptoMarkets,
  ...mockHip3Markets,
];

type StockMarketType = 'equity' | 'commodity';

const STOCK_SUB_FILTER_ALLOWED_TYPES = {
  all: new Set<StockMarketType>(['equity', 'commodity']),
  stocks: new Set<StockMarketType>(['equity']),
  commodities: new Set<StockMarketType>(['commodity']),
} satisfies Record<StockSubFilter, ReadonlySet<StockMarketType>>;

const isStockMarketType = (
  marketType: PerpsMarketData['marketType'],
): marketType is StockMarketType =>
  marketType === 'equity' || marketType === 'commodity';

/**
 * Filter markets by market type
 *
 * @param markets - Array of markets to filter
 * @param filter - Market type filter
 * @param stockSubFilter - Stock sub-filter (only used when filter is 'stocks')
 * @returns Filtered array of markets
 */
const filterByType = (
  markets: PerpsMarketData[],
  filter: MarketFilter,
  stockSubFilter: StockSubFilter,
): PerpsMarketData[] => {
  switch (filter) {
    case 'all': {
      return markets;
    }
    case 'crypto': {
      return markets.filter((m) => !m.marketType || m.marketType === 'crypto');
    }
    case 'stocks': {
      const allowedMarketTypes = STOCK_SUB_FILTER_ALLOWED_TYPES[stockSubFilter];
      return markets.filter((m) => {
        if (!isStockMarketType(m.marketType)) {
          return false;
        }
        return allowedMarketTypes.has(m.marketType);
      });
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

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSortId, setSelectedSortId] = useState<SortOptionId>('volume');
  const [selectedFilter, setSelectedFilter] = useState<MarketFilter>('all');
  const [stockSubFilter, setStockSubFilter] = useState<StockSubFilter>('all');

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
    } else {
      // Not searching: apply filters
      markets = filterByType(allMarkets, selectedFilter, stockSubFilter);
    }

    if (currentSortOption) {
      markets = sortMarkets({
        markets,
        sortBy: currentSortOption.field,
        direction: currentSortOption.direction,
      });
    }
    return markets;
  }, [selectedFilter, stockSubFilter, searchQuery, currentSortOption]);

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
    setStockSubFilter('all'); // Reset sub-filter when main filter changes
  }, []);

  const handleMarketSelect = useCallback(
    (market: PerpsMarketData) => {
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(market.symbol)}`,
      );
    },
    [navigate],
  );

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
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center justify-center rounded-full p-1 hover:bg-hover active:bg-pressed"
          data-testid="back-button"
          aria-label={t('back')}
        >
          <Icon
            name={IconName.ArrowLeft}
            size={IconSize.Md}
            color={IconColor.IconDefault}
          />
        </button>
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
          <FilterSelect value={selectedFilter} onChange={handleFilterChange} />
          <SortDropdown
            selectedOptionId={selectedSortId}
            onOptionChange={handleSortChange}
          />
          {selectedFilter === 'stocks' && (
            <StockSubFilterSelect
              value={stockSubFilter}
              onChange={setStockSubFilter}
            />
          )}
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
