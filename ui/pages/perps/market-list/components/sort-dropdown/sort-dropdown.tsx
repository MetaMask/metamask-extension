import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MARKET_SORTING_CONFIG,
  type SortOptionId,
} from '../../../../../components/app/perps/constants';
import type { SortField, SortDirection } from '../../../utils/sortMarkets';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type SortDropdownProps = {
  /** Currently selected sort option ID */
  selectedOptionId: SortOptionId;
  /** Callback when sort option changes */
  onOptionChange: (
    optionId: SortOptionId,
    field: SortField,
    direction: SortDirection,
  ) => void;
  /** Additional CSS class */
  className?: string;
};

/**
 * Fallback labels for sort options when i18n keys are not available
 */
const fallbackLabels: Record<SortOptionId, string> = {
  volume: 'Volume',
  'priceChange-desc': 'Gainers',
  'priceChange-asc': 'Losers',
  openInterest: 'Open Interest',
  fundingRate: 'Funding Rate',
};

/**
 * SortDropdown - Dropdown for selecting market sort order
 *
 * Displays the current sort selection with a dropdown menu for changing sort options.
 * Uses the MARKET_SORTING_CONFIG for available sort options.
 *
 * @param options0 - Component props
 * @param options0.selectedOptionId - Currently selected sort option ID
 * @param options0.onOptionChange - Callback when sort option changes
 * @param options0.className - Additional CSS class
 */
export const SortDropdown: React.FC<SortDropdownProps> = ({
  selectedOptionId,
  onOptionChange,
  className,
}) => {
  const t = useI18nContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the label for a sort option
  const getOptionLabel = useCallback(
    (optionId: SortOptionId, labelKey: string): string => {
      const translated = t(labelKey);
      return translated || fallbackLabels[optionId] || optionId;
    },
    [t],
  );

  // Find the current selected option
  const selectedOption = MARKET_SORTING_CONFIG.SORT_OPTIONS.find(
    (opt) => opt.id === selectedOptionId,
  );

  const selectedLabel = selectedOption
    ? getOptionLabel(selectedOption.id, selectedOption.labelKey)
    : 'Sort';

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

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleOptionSelect = (
    option: (typeof MARKET_SORTING_CONFIG.SORT_OPTIONS)[number],
  ) => {
    onOptionChange(
      option.id,
      option.field as SortField,
      option.direction as SortDirection,
    );
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className ?? ''}`} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          border border-border-muted
          text-sm font-medium text-text-default
          bg-background-default
          hover:bg-background-hover
          transition-colors duration-150
        `}
        data-testid="sort-dropdown-trigger"
      >
        <span>{selectedLabel}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`
            absolute z-50 mt-1 left-0
            min-w-[180px] py-1
            bg-background-default
            border border-border-muted rounded-lg
            shadow-lg
          `}
          data-testid="sort-dropdown-menu"
        >
          {MARKET_SORTING_CONFIG.SORT_OPTIONS.map((option) => {
            const isSelected = option.id === selectedOptionId;
            const label = getOptionLabel(option.id, option.labelKey);

            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleOptionSelect(option)}
                className={`
                  w-full px-4 py-2 text-left text-sm
                  flex items-center justify-between
                  transition-colors duration-150
                  ${
                    isSelected
                      ? 'bg-primary-muted text-primary-default font-medium'
                      : 'text-text-default hover:bg-background-hover'
                  }
                `}
                data-testid={`sort-option-${option.id}`}
              >
                <span>{label}</span>
                {isSelected && (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SortDropdown;
