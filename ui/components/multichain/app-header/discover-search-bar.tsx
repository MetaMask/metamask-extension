import React, { useCallback } from 'react';
import classnames from 'clsx';
import { TextFieldSearch } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

type DiscoverSearchBarProps = {
  onOpen: () => void;
  className?: string;
};

/**
 * An always-open search field for the fullscreen design header. It is only an
 * entry point: clicking it opens the discover search page, where the user types.
 *
 * @param props - The component props.
 * @param props.onOpen - Called when the search bar is clicked or activated.
 * @param props.className - Extra classes for positioning within the header.
 */
export const DiscoverSearchBar = ({
  onOpen,
  className,
}: DiscoverSearchBarProps) => {
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
      className={classnames('max-w-lg flex-1 cursor-pointer', className)}
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
