import React, { useMemo, useCallback } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Dropdown, type DropdownOption } from '../dropdown';
import type { SortField, SortDirection } from '../../../utils/sortMarkets';

export type SortOptionId =
  | 'volumeHigh'
  | 'volumeLow'
  | 'priceChangeHigh'
  | 'priceChangeLow'
  | 'openInterestHigh'
  | 'openInterestLow'
  | 'fundingRateHigh'
  | 'fundingRateLow';

export type SortOption = {
  id: SortOptionId;
  labelKey: string;
  field: SortField;
  direction: SortDirection;
};

export const SORT_OPTIONS: SortOption[] = [
  {
    id: 'volumeHigh',
    labelKey: 'perpsSortVolumeHighToLow',
    field: 'volume',
    direction: 'desc',
  },
  {
    id: 'volumeLow',
    labelKey: 'perpsSortVolumeLowToHigh',
    field: 'volume',
    direction: 'asc',
  },
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
    id: 'openInterestHigh',
    labelKey: 'perpsSortOpenInterestHighToLow',
    field: 'openInterest',
    direction: 'desc',
  },
  {
    id: 'openInterestLow',
    labelKey: 'perpsSortOpenInterestLowToHigh',
    field: 'openInterest',
    direction: 'asc',
  },
  {
    id: 'fundingRateHigh',
    labelKey: 'perpsSortFundingRateHighToLow',
    field: 'fundingRate',
    direction: 'desc',
  },
  {
    id: 'fundingRateLow',
    labelKey: 'perpsSortFundingRateLowToHigh',
    field: 'fundingRate',
    direction: 'asc',
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
