import React from 'react';
import { TextFieldSearch } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const NetworkListSearch = ({
  searchQuery,
  setSearchQuery,
  setFocusSearch,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setFocusSearch: (val: boolean) => void;
}) => {
  const t = useI18nContext();

  return (
    <search className="px-4 pb-2">
      <TextFieldSearch
        autoFocus
        className="w-full"
        clearButtonOnClick={() => setSearchQuery('')}
        data-testid="search-list"
        inputProps={
          {
            'aria-label': t('search'),
          } as React.ComponentPropsWithoutRef<'input'>
        }
        onBlur={() => setFocusSearch(false)}
        onFocus={() => setFocusSearch(true)}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder={t('search')}
        value={searchQuery}
      />
    </search>
  );
};

export default NetworkListSearch;
