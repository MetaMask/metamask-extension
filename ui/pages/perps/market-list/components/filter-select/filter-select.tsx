import React, { useMemo } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Dropdown, type DropdownOption } from '../dropdown';

export type MarketFilter = 'all' | 'crypto' | 'stocks';

export type FilterSelectProps = {
  /** Currently selected filter */
  value: MarketFilter;
  /** Callback when filter changes */
  onChange: (filter: MarketFilter) => void;
};

/**
 * FilterSelect component displays a dropdown for filtering markets by type
 *
 * @param props - Component props
 * @param props.value - Currently selected filter
 * @param props.onChange - Callback when filter changes
 */
export const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
}) => {
  const t = useI18nContext();

  const options: DropdownOption<MarketFilter>[] = useMemo(
    () => [
      { id: 'all', label: t('perpsFilterAll') },
      { id: 'crypto', label: t('perpsFilterCrypto') },
      { id: 'stocks', label: t('perpsFilterStocks') },
    ],
    [t],
  );

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
