import React, { useCallback, useRef, useEffect } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type SearchInputProps = {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Callback when clear button is pressed */
  onClear: () => void;
  /** Auto-focus the input when mounted */
  autoFocus?: boolean;
};

/**
 * SearchInput component provides a search input field for filtering markets
 * Includes a search icon and clear button
 *
 * @param options0 - Component props
 * @param options0.value - Current search value
 * @param options0.onChange - Callback when search value changes
 * @param options0.onClear - Callback when clear button is pressed
 * @param options0.autoFocus - Auto-focus the input when mounted
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  autoFocus = false,
}) => {
  const t = useI18nContext();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onClear();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onClear]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        onClear();
      }
    },
    [onClear],
  );

  return (
    <Box
      className="flex-1 rounded-full border border-border-muted bg-background-default"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
      paddingLeft={3}
      paddingRight={2}
      data-testid="search-input-container"
    >
      <Icon
        name={IconName.Search}
        size={IconSize.Sm}
        color={IconColor.IconAlternative}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={t('perpsSearchMarkets')}
        className="min-w-0 flex-1 border-none bg-transparent py-2 text-sm text-text-default outline-none placeholder:text-text-alternative"
        data-testid="search-input"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center justify-center rounded-full p-1 hover:bg-hover active:bg-pressed"
          data-testid="search-clear-button"
          aria-label={t('clear')}
        >
          <Icon
            name={IconName.Close}
            size={IconSize.Xs}
            color={IconColor.IconAlternative}
          />
        </button>
      )}
    </Box>
  );
};

export default SearchInput;
