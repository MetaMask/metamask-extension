import React, { useRef, useEffect } from 'react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type SearchInputProps = {
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Whether the search input is expanded */
  isExpanded: boolean;
  /** Toggle expanded state */
  onToggle: () => void;
  /** Clear the search value */
  onClear: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS class */
  className?: string;
};

/**
 * SearchInput - Expandable search input for filtering markets
 *
 * Displays as an icon button when collapsed, expands to full input with clear button.
 *
 * @param options0 - Component props
 * @param options0.value - Current search value
 * @param options0.onChange - Callback when value changes
 * @param options0.isExpanded - Whether the search input is expanded
 * @param options0.onToggle - Toggle expanded state
 * @param options0.onClear - Clear the search value
 * @param options0.placeholder - Placeholder text
 * @param options0.className - Additional CSS class
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  isExpanded,
  onToggle,
  onClear,
  placeholder,
  className,
}) => {
  const t = useI18nContext();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (value) {
        onClear();
      } else {
        onToggle();
      }
    }
  };

  const placeholderText =
    placeholder || t('searchMarkets') || 'Search markets...';

  // Search icon SVG
  const SearchIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );

  // Close icon SVG
  const CloseIcon = () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );

  // Collapsed state - just search icon button
  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`
          p-2 rounded-full
          text-text-alternative
          hover:bg-background-hover hover:text-text-default
          transition-colors duration-150
          ${className ?? ''}
        `}
        aria-label={t('searchMarkets') || 'Search markets'}
        data-testid="search-toggle-button"
      >
        <SearchIcon />
      </button>
    );
  }

  // Expanded state - full input
  return (
    <div
      className={`
        flex items-center gap-2
        bg-background-default
        border border-border-muted rounded-lg
        px-3 py-2
        transition-all duration-150
        focus-within:border-primary-default
        ${className ?? ''}
      `}
      data-testid="search-input-container"
    >
      <span className="text-text-alternative flex-shrink-0">
        <SearchIcon />
      </span>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholderText}
        className={`
          flex-1 min-w-0
          bg-transparent
          text-sm text-text-default
          placeholder:text-text-alternative
          outline-none
        `}
        aria-label={placeholderText}
        data-testid="search-input"
      />

      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className={`
            p-1 rounded-full flex-shrink-0
            text-text-alternative
            hover:bg-background-hover hover:text-text-default
            transition-colors duration-150
          `}
          aria-label={t('clear') || 'Clear'}
          data-testid="search-clear-button"
        >
          <CloseIcon />
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className={`
            p-1 rounded-full flex-shrink-0
            text-text-alternative
            hover:bg-background-hover hover:text-text-default
            transition-colors duration-150
          `}
          aria-label={t('close') || 'Close'}
          data-testid="search-close-button"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
