import React, { useMemo } from 'react';
import { MARKET_CATEGORIES } from '@metamask/perps-controller';
import {
  WATCHLIST_MARKET_FILTER,
  type MarketFilter,
} from '../../../../../../shared/constants/perps';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Dropdown, type DropdownOption } from '../dropdown';

/**
 * i18n label key for every filter. Driven by the controller's `MARKET_CATEGORIES`
 * plus the UI-only `all` / `new` pseudo-filters — adding a core category only
 * requires a new label key here, not a new option entry.
 */
const FILTER_LABEL_KEYS: Record<MarketFilter, string> = {
  all: 'perpsFilterAll',
  // Reuses the Perps tab section heading rather than adding a duplicate string.
  watchlist: 'perpsWatchlist',
  crypto: 'perpsFilterCrypto',
  stock: 'perpsFilterStocks',
  'pre-ipo': 'perpsFilterPreIpo',
  index: 'perpsFilterIndex',
  etf: 'perpsFilterEtf',
  commodity: 'perpsFilterCommodities',
  forex: 'perpsFilterForex',
  new: 'perpsFilterNew',
};

export type FilterSelectProps = {
  /** Currently selected filter */
  value: MarketFilter;
  /** Callback when filter changes */
  onChange: (filter: MarketFilter) => void;
  /** Whether to show the "New" filter option (only shown if there are uncategorized assets) */
  showNewFilter?: boolean;
  /** Whether to show the "Watchlist" option (only shown if the watchlist has markets) */
  showWatchlistFilter?: boolean;
};

/**
 * FilterSelect component displays a dropdown for filtering markets by type
 *
 * @param props - Component props
 * @param props.value - Currently selected filter
 * @param props.onChange - Callback when filter changes
 * @param props.showNewFilter - Whether to show the "New" filter option
 * @param props.showWatchlistFilter - Whether to show the "Watchlist" option
 */
export const FilterSelect = ({
  value,
  onChange,
  showNewFilter = false,
  showWatchlistFilter = false,
}: FilterSelectProps) => {
  const t = useI18nContext();

  const options: DropdownOption<MarketFilter>[] = useMemo(() => {
    const categoryIds = showWatchlistFilter
      ? (['all', WATCHLIST_MARKET_FILTER, ...MARKET_CATEGORIES] as const)
      : (['all', ...MARKET_CATEGORIES] as const);

    const baseOptions: DropdownOption<MarketFilter>[] = categoryIds.map(
      (id) => ({ id, label: t(FILTER_LABEL_KEYS[id]) }),
    );

    if (showNewFilter) {
      baseOptions.push({ id: 'new', label: t(FILTER_LABEL_KEYS.new) });
    }

    return baseOptions;
  }, [t, showNewFilter, showWatchlistFilter]);

  return (
    <Dropdown
      options={options}
      selectedId={value}
      onChange={onChange}
      testId="filter-select"
    />
  );
};

export default FilterSelect;
