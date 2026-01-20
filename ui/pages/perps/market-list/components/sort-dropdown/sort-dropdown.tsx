import React, { useMemo, useCallback } from 'react';
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
  label: string;
  field: SortField;
  direction: SortDirection;
};

export const SORT_OPTIONS: SortOption[] = [
  { id: 'volume', label: 'Volume', field: 'volume', direction: 'desc' },
  {
    id: 'priceChangeHigh',
    label: 'Price change: high to low',
    field: 'priceChange',
    direction: 'desc',
  },
  {
    id: 'priceChangeLow',
    label: 'Price change: low to high',
    field: 'priceChange',
    direction: 'asc',
  },
  {
    id: 'openInterest',
    label: 'Open interest',
    field: 'openInterest',
    direction: 'desc',
  },
  {
    id: 'fundingRate',
    label: 'Funding rate',
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
  const options: DropdownOption<SortOptionId>[] = useMemo(
    () => SORT_OPTIONS.map((opt) => ({ id: opt.id, label: opt.label })),
    [],
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
