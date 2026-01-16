import React from 'react';
import type { MarketTypeFilter } from '../../../../../components/app/perps/types';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type FilterChipsProps = {
  /** Currently selected filter */
  value: MarketTypeFilter;
  /** Callback when filter changes */
  onChange: (filter: MarketTypeFilter) => void;
  /** Additional CSS class */
  className?: string;
};

type FilterOption = {
  id: MarketTypeFilter;
  labelKey: string;
  fallbackLabel: string;
};

const filterOptions: FilterOption[] = [
  { id: 'all', labelKey: 'perpsFilterAll', fallbackLabel: 'All' },
  { id: 'crypto', labelKey: 'perpsFilterCrypto', fallbackLabel: 'Crypto' },
  {
    id: 'stocks_and_commodities',
    labelKey: 'perpsFilterStocksAndCommodities',
    fallbackLabel: 'Stocks & Commodities',
  },
];

/**
 * FilterChips - Tab pills for filtering markets by type
 *
 * Provides filter options:
 * - All: Shows crypto + stocks + commodities
 * - Crypto: Shows only crypto markets
 * - Stocks & Commodities: Shows equity, commodity, and forex markets
 *
 * @param options0 - Component props
 * @param options0.value - Currently selected filter
 * @param options0.onChange - Callback when filter changes
 * @param options0.className - Additional CSS class
 */
export const FilterChips: React.FC<FilterChipsProps> = ({
  value,
  onChange,
  className,
}) => {
  const t = useI18nContext();

  return (
    <div
      className={`flex gap-2 overflow-x-auto ${className ?? ''}`}
      role="tablist"
      aria-label="Market type filter"
    >
      {filterOptions.map((option) => {
        const isActive = value === option.id;
        const label = t(option.labelKey) || option.fallbackLabel;

        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
              transition-colors duration-150
              ${
                isActive
                  ? 'bg-primary-default text-primary-inverse'
                  : 'border border-border-muted text-text-default hover:bg-background-hover'
              }
            `}
            data-testid={`filter-chip-${option.id}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default FilterChips;
