import React, { useCallback } from 'react';
import { TextFieldSearch, TextFieldSize } from '@metamask/design-system-react';
import { APP_TEXT_FIELD_SEARCH_CLASSNAME } from '../../../../../components/ui/app-text-field-search-styles';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type SearchInputProps = {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Callback when clear button is pressed */
  onClear: () => void;
  /** Called when the search input is clicked (not on programmatic focus from autoFocus) */
  onInputClick?: () => void;
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
 * @param options0.onInputClick - Called when the user clicks the search input
 * @param options0.autoFocus - Auto-focus the input when mounted
 */
export const SearchInput = ({
  value,
  onChange,
  onClear,
  onInputClick,
  autoFocus = false,
}: SearchInputProps) => {
  const t = useI18nContext();

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        onClear();
      }
    },
    [onClear],
  );

  return (
    <TextFieldSearch
      autoFocus={autoFocus}
      className={APP_TEXT_FIELD_SEARCH_CLASSNAME}
      clearButtonOnClick={onClear}
      clearButtonProps={{ ariaLabel: t('clear') }}
      data-testid="search-input-container"
      inputProps={{
        'data-testid': 'search-input',
        onClick: onInputClick,
        onKeyDown: handleKeyDown,
      }}
      onChange={(event) => onChange(event.target.value)}
      placeholder={t('perpsSearchMarkets')}
      size={TextFieldSize.Md}
      value={value}
    />
  );
};

export default SearchInput;
