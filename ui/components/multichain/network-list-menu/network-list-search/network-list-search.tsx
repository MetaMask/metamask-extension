import React from 'react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box } from '../../../component-library';
import { PillTextFieldSearch } from '../../../ui/pill-text-field-search';

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
    <Box paddingLeft={4} paddingRight={4} paddingBottom={2} paddingTop={0}>
      <PillTextFieldSearch
        autoFocus
        data-testid="search-list"
        inputProps={{
          'data-testid': 'network-redesign-modal-search-input',
          onBlur: () => setFocusSearch(false),
          onFocus: () => setFocusSearch(true),
        }}
        onChange={(event) => setSearchQuery(event.target.value)}
        onClear={() => setSearchQuery('')}
        placeholder={t('search')}
        value={searchQuery}
      />
    </Box>
  );
};

export default NetworkListSearch;
