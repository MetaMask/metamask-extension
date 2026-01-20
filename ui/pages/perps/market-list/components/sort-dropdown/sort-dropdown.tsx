import React, { useMemo, useCallback } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Dropdown, type DropdownOption } from '../dropdown';
import type { SortField } from '../market-row';

export type SortDirection = 'asc' | 'desc';

export type SortOptionId =
  | 'volume'
  | 'priceChangeHigh'
  | 'priceChangeLow'
  | 'openInterest'
  | 'fundingRate';

export type SortOption = {
  id: SortOptionId;
  labelKey: string;
  field: SortField;
  direction: SortDirection;
};

export const SORT_OPTIONS: SortOption[] = [
  { id: 'volume', labelKey: 'perpsSortVolume', field: 'volume', direction: 'desc' },
  {
    id: 'priceChangeHigh',
    labelKey: 'perpsSortPriceChangeHighToLow',
    field: 'priceChange',
    direction: 'desc',
  },
  {
    id: 'priceChangeLow',
    labelKey: 'perpsSortPriceChangeLowToHigh',
    field: 'priceChange',
    direction: 'asc',
  },
  {
    id: 'openInterest',
    labelKey: 'perpsSortOpenInterest',
    field: 'openInterest',
    direction: 'desc',
  },
  {
    id: 'fundingRate',
    labelKey: 'perpsSortFundingRate',
    field: 'fundingRate',
    direction: 'desc',
  },
];

export type SortDropdownProps = {
  /** Currently selected sort option ID */
  selectedOptionId: SortOptionId;
  /** Callback when sort option changes */
  onOptionChange: (
    optionId: SortOptionId,
    field: SortField,
    direction: SortDirection,
  ) => void;
};

/**
 * SortDropdown component displays a dropdown for selecting sort options
 *
 * @param props - Component props
 * @param props.selectedOptionId - Currently selected sort option ID
 * @param props.onOptionChange - Callback when sort option changes
 */
export const SortDropdown: React.FC<SortDropdownProps> = ({
  selectedOptionId,
  onOptionChange,
}) => {
  const t = useI18nContext();

  const options: DropdownOption<SortOptionId>[] = useMemo(
    () => SORT_OPTIONS.map((opt) => ({ id: opt.id, label: t(opt.labelKey) })),
    [t],
  );

  const handleChange = useCallback(
    (id: SortOptionId) => {
      const option = SORT_OPTIONS.find((opt) => opt.id === id);
      if (option) {
        onOptionChange(option.id, option.field, option.direction);
      }
    },
    [onOptionChange],
  );

  return (
    <Dropdown
      options={options}
      selectedId={selectedOptionId}
      onChange={handleChange}
      testId="sort-dropdown"
    />
  );
};

export default SortDropdown;
