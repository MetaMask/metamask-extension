import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  BoxFlexDirection,
  Text,
  TextVariant,
  TextColor,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
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
 * SortDropdown component displays a dropdown button with sort options
 * Allows users to select how markets should be sorted
 *
 * @param options0 - Component props
 * @param options0.selectedOptionId - Currently selected sort option ID
 * @param options0.onOptionChange - Callback when sort option changes
 */
export const SortDropdown: React.FC<SortDropdownProps> = ({
  selectedOptionId,
  onOptionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = SORT_OPTIONS.find(
    (option) => option.id === selectedOptionId,
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleOptionSelect = useCallback(
    (option: SortOption) => {
      onOptionChange(option.id, option.field, option.direction);
      setIsOpen(false);
    },
    [onOptionChange],
  );

  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1 rounded-lg border border-border-muted bg-background-default px-3 py-2 hover:bg-hover active:bg-pressed"
        data-testid="sort-dropdown-button"
      >
        <Text variant={TextVariant.BodySm}>{selectedOption?.label}</Text>
        <Icon
          name={isOpen ? IconName.ArrowUp : IconName.ArrowDown}
          size={IconSize.Xs}
          color={IconColor.IconAlternative}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <Box
          className="absolute left-0 top-full z-10 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-border-muted bg-background-default shadow-lg"
          flexDirection={BoxFlexDirection.Column}
          data-testid="sort-dropdown-menu"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionSelect(option)}
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-hover active:bg-pressed"
              data-testid={`sort-option-${option.id}`}
            >
              <Text
                variant={TextVariant.BodySm}
                color={
                  option.id === selectedOptionId
                    ? TextColor.TextDefault
                    : TextColor.TextAlternative
                }
              >
                {option.label}
              </Text>
              {option.id === selectedOptionId && (
                <Icon
                  name={IconName.Check}
                  size={IconSize.Sm}
                  color={IconColor.PrimaryDefault}
                />
              )}
            </button>
          ))}
        </Box>
      )}
    </div>
  );
};

export default SortDropdown;
