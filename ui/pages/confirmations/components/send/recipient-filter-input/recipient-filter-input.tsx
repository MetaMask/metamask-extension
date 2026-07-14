import React from 'react';
import { TextFieldSearch, TextFieldSize } from '@metamask/design-system-react';
import { Box } from '../../../../../components/component-library';
import { APP_TEXT_FIELD_SEARCH_CLASSNAME } from '../../../../../components/ui/app-text-field-search-styles';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type RecipientFilterInputProps = {
  searchQuery: string;
  onChange: (value: string) => void;
};

export const RecipientFilterInput = ({
  searchQuery,
  onChange,
}: RecipientFilterInputProps) => {
  const t = useI18nContext();

  return (
    <Box paddingInline={4} paddingBottom={4}>
      <TextFieldSearch
        className={APP_TEXT_FIELD_SEARCH_CLASSNAME}
        clearButtonOnClick={() => onChange('')}
        clearButtonProps={{ ariaLabel: t('clear') }}
        inputProps={{
          'data-testid': 'recipient-filter-search-input',
        }}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('searchAnAcccountOrContact')}
        size={TextFieldSize.Lg}
        value={searchQuery}
      />
    </Box>
  );
};
