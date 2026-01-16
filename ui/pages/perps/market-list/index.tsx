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
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../helpers/constants/routes';
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

// Combine all markets
const allMarkets: PerpsMarketData[] = [
  ...mockCryptoMarkets,
  ...mockHip3Markets,
];

/**
 * Sort markets based on field and direction
 *
 * @param markets - Array of markets to sort
 * @param field - Field to sort by
 * @param direction - Sort direction (asc/desc)
 * @returns Sorted array of markets
 */
const sortMarkets = (
  markets: PerpsMarketData[],
  field: SortField,
  direction: SortDirection,
): PerpsMarketData[] => {
  return [...markets].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'volume': {
        // Parse volume like "$1.2B", "$850M"
        const parseVolume = (vol: string): number => {
          const num = parseFloat(vol.replace(/[$,]/gu, ''));
          if (vol.includes('B')) {
            return num * 1e9;
          }
          if (vol.includes('M')) {
            return num * 1e6;
          }
          if (vol.includes('K')) {
            return num * 1e3;
          }
          return num;
        };
        comparison = parseVolume(a.volume) - parseVolume(b.volume);
        break;
      }
      case 'priceChange': {
        // Parse change like "+2.84%", "-1.19%"
        const parseChange = (change: string): number => {
          return parseFloat(change.replace(/[%+]/gu, ''));
        };
        comparison =
          parseChange(a.change24hPercent) - parseChange(b.change24hPercent);
        break;
      }
      case 'openInterest': {
        // Parse OI like "$2.5B", "$450M"
        const parseOI = (oi: string | undefined): number => {
          if (!oi) {
            return 0;
          }
          const num = parseFloat(oi.replace(/[$,]/gu, ''));
          if (oi.includes('B')) {
            return num * 1e9;
          }
          if (oi.includes('M')) {
            return num * 1e6;
          }
          if (oi.includes('K')) {
            return num * 1e3;
          }
          return num;
        };
        comparison = parseOI(a.openInterest) - parseOI(b.openInterest);
        break;
      }
      case 'fundingRate': {
        const rateA = a.fundingRate ?? 0;
        const rateB = b.fundingRate ?? 0;
        comparison = rateA - rateB;
        break;
      }
      default:
        comparison = 0;
    }

    return direction === 'desc' ? -comparison : comparison;
  });
};

/**
 * Filter markets based on search query
 *
 * @param markets - Array of markets to filter
 * @param query - Search query string
 * @returns Filtered array of markets
 */
const filterMarkets = (
  markets: PerpsMarketData[],
  query: string,
): PerpsMarketData[] => {
  if (!query.trim()) {
    return markets;
  }
  const lowerQuery = query.toLowerCase();
  return markets.filter(
    (market) =>
      market.symbol.toLowerCase().includes(lowerQuery) ||
      market.name.toLowerCase().includes(lowerQuery),
  );
};

/**
 * Filter markets by market type
 *
 * @param markets - Array of markets to filter
 * @param filter - Market type filter
 * @returns Filtered array of markets
 */
const filterByType = (
  markets: PerpsMarketData[],
  filter: MarketFilter,
): PerpsMarketData[] => {
  if (filter === 'all') {
    return markets;
  }
  if (filter === 'crypto') {
    return markets.filter((m) => !m.marketType || m.marketType === 'crypto');
  }
  if (filter === 'stocks') {
    return markets.filter(
      (m) => m.marketType === 'equity' || m.marketType === 'commodity',
    );
  }
  return markets;
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
  const displayedMarkets = useMemo(() => {
    let markets = filterByType(allMarkets, selectedFilter);
    markets = filterMarkets(markets, searchQuery);
    if (currentSortOption) {
      markets = sortMarkets(
        markets,
        currentSortOption.field,
        currentSortOption.direction,
      );
    }
    return markets;
  }, [selectedFilter, searchQuery, currentSortOption]);

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

      {/* Filter and Sort Row */}
      <Box
        className="border-b border-border-muted px-4 py-3"
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={3}
      >
        <FilterSelect value={selectedFilter} onChange={handleFilterChange} />
        <SortDropdown
          selectedOptionId={selectedSortId}
          onOptionChange={handleSortChange}
        />
      </Box>

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
