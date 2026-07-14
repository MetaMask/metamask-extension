import React from 'react';
import { TextFieldSearch, TextFieldSize } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Box } from '../../../component-library';
import { APP_TEXT_FIELD_SEARCH_CLASSNAME } from '../../../ui/app-text-field-search-styles';

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
      <TextFieldSearch
        autoFocus
        className={APP_TEXT_FIELD_SEARCH_CLASSNAME}
        clearButtonOnClick={() => setSearchQuery('')}
        clearButtonProps={{ ariaLabel: t('clear') }}
        data-testid="search-list"
        inputProps={{
          'data-testid': 'network-redesign-modal-search-input',
          onBlur: () => setFocusSearch(false),
          onFocus: () => setFocusSearch(true),
        }}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder={t('search')}
        size={TextFieldSize.Lg}
        value={searchQuery}
      />
    </Box>
  );
};

export default NetworkListSearch;
