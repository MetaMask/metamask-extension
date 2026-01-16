import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerpsMarketListView } from '../../../hooks/perps/usePerpsMarketListView';
import type { PerpsMarketData } from '../../../components/app/perps/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MarketRow } from './components/market-row';
import { MarketRowSkeleton } from './components/market-row-skeleton';
import { FilterChips } from './components/filter-chips';
import { SortDropdown } from './components/sort-dropdown';
import { SearchInput } from './components/search-input';

/**
 * MarketListView - Main page for displaying and filtering perps markets
 *
 * Features:
 * - Search markets by symbol/name
 * - Filter by market type (All, Crypto, Stocks & Commodities)
 * - Sort by volume, price change, open interest, or funding rate
 * - Click row to navigate to market details
 */
export const MarketListView: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const {
    markets,
    searchState,
    sortState,
    marketTypeFilterState,
    isLoading,
    error,
  } = usePerpsMarketListView({
    enablePolling: false,
    showZeroVolume: false,
  });

  // Navigate to market details on row click
  const handleMarketSelect = useCallback(
    (market: PerpsMarketData) => {
      // TODO: Implement navigation to market details page
      // For now, log the selection
      // eslint-disable-next-line no-console
      console.log('Selected market:', market.symbol);
      // navigate(`/perps/trade/${encodeURIComponent(market.symbol)}`);
    },
    [navigate],
  );

  // Determine if we should show badges (when viewing 'all' markets)
  const showBadge = marketTypeFilterState.marketTypeFilter === 'all';

  // Get the display metric based on current sort
  const displayMetric = sortState.sortBy;

  return (
    <div className="flex flex-col h-full bg-background-default">
      {/* Header with title and search toggle */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border-muted">
        <h1 className="text-lg font-semibold text-text-default">
          {t('markets') || 'Markets'}
        </h1>

        <SearchInput
          value={searchState.searchQuery}
          onChange={searchState.setSearchQuery}
          isExpanded={searchState.isSearchVisible}
          onToggle={searchState.toggleSearchVisibility}
          onClear={searchState.clearSearch}
          className={searchState.isSearchVisible ? 'flex-1 ml-4' : ''}
        />
      </header>

      {/* Filter chips */}
      <div className="px-4 py-3 border-b border-border-muted">
        <FilterChips
          value={marketTypeFilterState.marketTypeFilter}
          onChange={marketTypeFilterState.setMarketTypeFilter}
        />
      </div>

      {/* Sort dropdown */}
      <div className="px-4 py-2 border-b border-border-muted">
        <SortDropdown
          selectedOptionId={sortState.selectedOptionId}
          onOptionChange={sortState.handleOptionChange}
        />
      </div>

      {/* Market list */}
      <div className="flex-1 overflow-y-auto">
        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-sm text-error-default text-center">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !error && (
          <>
            {Array.from({ length: 8 }).map((_, index) => (
              <MarketRowSkeleton key={`skeleton-${index}`} />
            ))}
          </>
        )}

        {/* Empty state */}
        {!isLoading && !error && markets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <p className="text-sm text-text-alternative text-center mb-2">
              {searchState.searchQuery
                ? t('noMarketsFound') || 'No markets found'
                : t('noMarketsAvailable') || 'No markets available'}
            </p>
            {searchState.searchQuery && (
              <button
                type="button"
                onClick={searchState.clearSearch}
                className="text-sm text-primary-default hover:underline"
              >
                {t('clearSearch') || 'Clear search'}
              </button>
            )}
          </div>
        )}

        {/* Market rows */}
        {!isLoading && !error && markets.length > 0 && (
          <>
            {markets.map((market) => (
              <MarketRow
                key={market.symbol}
                market={market}
                onPress={handleMarketSelect}
                displayMetric={displayMetric}
                showBadge={showBadge}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default MarketListView;
