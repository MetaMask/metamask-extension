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
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type MarketFilter = 'all' | 'crypto' | 'stocks';

export type FilterOption = {
  id: MarketFilter;
  labelKey: string;
};

export const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', labelKey: 'perpsFilterAll' },
  { id: 'crypto', labelKey: 'perpsFilterCrypto' },
  { id: 'stocks', labelKey: 'perpsFilterStocks' },
];

export type FilterSelectProps = {
  /** Currently selected filter */
  value: MarketFilter;
  /** Callback when filter changes */
  onChange: (filter: MarketFilter) => void;
};

/**
 * FilterSelect component displays a dropdown for filtering markets by type
 *
 * @param options0 - Component props
 * @param options0.value - Currently selected filter
 * @param options0.onChange - Callback when filter changes
 */
export const FilterSelect: React.FC<FilterSelectProps> = ({
  value,
  onChange,
}) => {
  const t = useI18nContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = FILTER_OPTIONS.find((option) => option.id === value);

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
    (option: FilterOption) => {
      onChange(option.id);
      setIsOpen(false);
    },
    [onChange],
  );

  return (
    <div ref={dropdownRef} className="relative">
      {/* Dropdown trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1 rounded-lg border border-border-muted bg-background-default px-3 py-2 hover:bg-hover active:bg-pressed"
        data-testid="filter-select-button"
      >
        <Text variant={TextVariant.BodySm}>
          {selectedOption ? t(selectedOption.labelKey) : ''}
        </Text>
        <Icon
          name={isOpen ? IconName.ArrowUp : IconName.ArrowDown}
          size={IconSize.Xs}
          color={IconColor.IconAlternative}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <Box
          className="absolute left-0 top-full z-10 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-border-muted bg-background-default shadow-lg"
          flexDirection={BoxFlexDirection.Column}
          data-testid="filter-select-menu"
        >
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleOptionSelect(option)}
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-hover active:bg-pressed"
              data-testid={`filter-option-${option.id}`}
            >
              <Text
                variant={TextVariant.BodySm}
                color={
                  option.id === value
                    ? TextColor.TextDefault
                    : TextColor.TextAlternative
                }
              >
                {t(option.labelKey)}
              </Text>
              {option.id === value && (
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

export default FilterSelect;
