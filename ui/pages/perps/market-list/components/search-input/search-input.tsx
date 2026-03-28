import React, { useCallback } from 'react';
import {
  TextFieldSearch,
  TextFieldSearchSize,
} from '../../../../../components/component-library';
import { BorderRadius } from '../../../../../helpers/constants/design-system';
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
      size={TextFieldSearchSize.Md}
      placeholder={t('perpsSearchMarkets')}
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      clearButtonOnClick={onClear}
      borderRadius={BorderRadius.MD}
      data-testid="search-input-container"
      inputProps={{
        'data-testid': 'search-input',
        onKeyDown: handleKeyDown,
      }}
    />
  );
};

export default SearchInput;
