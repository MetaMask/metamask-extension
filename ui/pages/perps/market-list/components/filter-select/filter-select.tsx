import React, { useMemo } from 'react';
import type { MarketTypeFilter } from '@metamask/perps-controller';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Dropdown, type DropdownOption } from '../dropdown';

export type FilterSelectProps = {
  /** Currently selected filter */
  value: MarketTypeFilter;
  /** Callback when filter changes */
  onChange: (filter: MarketTypeFilter) => void;
  /** Whether to show the "New" filter option (only shown if there are uncategorized assets) */
  showNewFilter?: boolean;
};

/**
 * FilterSelect component displays a dropdown for filtering markets by type
 *
 * @param props - Component props
 * @param props.value - Currently selected filter
 * @param props.onChange - Callback when filter changes
 * @param props.showNewFilter - Whether to show the "New" filter option
 */
export const FilterSelect = ({
  value,
  onChange,
  showNewFilter = false,
}: FilterSelectProps) => {
  const t = useI18nContext();

  const options: DropdownOption<MarketTypeFilter>[] = useMemo(() => {
    const baseOptions: DropdownOption<MarketTypeFilter>[] = [
      { id: 'all', label: t('perpsFilterAll') },
      { id: 'crypto', label: t('perpsFilterCrypto') },
      { id: 'stocks', label: t('perpsFilterStocks') },
      { id: 'pre-ipo', label: t('perpsFilterPreIpo') },
      { id: 'indices', label: t('perpsFilterIndices') },
      { id: 'etfs', label: t('perpsFilterEtfs') },
      { id: 'commodities', label: t('perpsFilterCommodities') },
      { id: 'forex', label: t('perpsFilterForex') },
    ];

    if (showNewFilter) {
      baseOptions.push({ id: 'new', label: t('perpsFilterNew') });
    }

    return baseOptions;
  }, [t, showNewFilter]);

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
