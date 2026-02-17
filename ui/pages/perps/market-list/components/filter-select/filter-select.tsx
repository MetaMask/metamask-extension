import React, { useMemo } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Dropdown, type DropdownOption } from '../dropdown';

export type MarketFilter =
  | 'all'
  | 'crypto'
  | 'stocks'
  | 'commodities'
  | 'forex'
  | 'new';

export type FilterSelectProps = {
  /** Currently selected filter */
  value: MarketFilter;
  /** Callback when filter changes */
  onChange: (filter: MarketFilter) => void;
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
export const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
  showNewFilter = false,
}) => {
  const t = useI18nContext();

  const options: DropdownOption<MarketFilter>[] = useMemo(() => {
    const baseOptions: DropdownOption<MarketFilter>[] = [
      { id: 'all', label: t('perpsFilterAll') },
      { id: 'crypto', label: t('perpsFilterCrypto') },
      { id: 'stocks', label: t('perpsFilterStocks') },
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
