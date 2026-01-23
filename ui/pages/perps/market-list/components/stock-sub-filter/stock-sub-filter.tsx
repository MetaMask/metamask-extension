import React, { useMemo } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Dropdown, type DropdownOption } from '../dropdown';

export type StockSubFilter = 'all' | 'stocks' | 'commodities';

export type StockSubFilterProps = {
  /** Currently selected sub-filter */
  value: StockSubFilter;
  /** Callback when sub-filter changes */
  onChange: (filter: StockSubFilter) => void;
};

/**
 * StockSubFilterSelect component displays a dropdown for sub-filtering stocks
 *
 * @param props - Component props
 * @param props.value - Currently selected sub-filter
 * @param props.onChange - Callback when sub-filter changes
 */
export const StockSubFilterSelect: React.FC<StockSubFilterProps> = ({
  value,
  onChange,
}) => {
  const t = useI18nContext();

  const options: DropdownOption<StockSubFilter>[] = useMemo(
    () => [
      { id: 'all', label: t('perpsFilterAll') },
      { id: 'stocks', label: t('perpsFilterStocksOnly') },
      { id: 'commodities', label: t('perpsFilterCommodities') },
    ],
    [t],
  );

  return (
    <Dropdown
      options={options}
      selectedId={value}
      onChange={onChange}
      testId="stock-sub-filter"
    />
  );
};

export default StockSubFilterSelect;
