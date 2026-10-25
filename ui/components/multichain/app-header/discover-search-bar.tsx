import React, { useCallback } from 'react';
import { TextFieldSearch } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

type DiscoverSearchBarProps = {
  onOpen: () => void;
};

/**
 * An always-open search field for the fullscreen design header. It is only an
 * entry point: clicking it opens the discover search page, where the user types.
 *
 * @param props - The component props.
 * @param props.onOpen - Called when the search bar is clicked or activated.
 */
export const DiscoverSearchBar = ({ onOpen }: DiscoverSearchBarProps) => {
  const t = useI18nContext();

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        onOpen();
      }
    },
    [onOpen],
  );

  return (
    <TextFieldSearch
      className="w-full max-w-[400px] min-w-0 cursor-pointer"
      placeholder={t('searchTokens')}
      value=""
      isReadOnly
      onClick={onOpen}
      clearButtonOnClick={() => undefined}
      inputProps={
        {
          'data-testid': 'discover-search-button',
          className: 'cursor-pointer',
          onKeyDown: handleKeyDown,
        } as React.ComponentPropsWithoutRef<'input'>
      }
    />
  );
};
