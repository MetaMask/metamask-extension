import React from 'react';
import { Box } from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { PillTextFieldSearch } from '../../../../../components/ui/pill-text-field-search';

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
      <PillTextFieldSearch
        inputProps={{
          'data-testid': 'recipient-filter-search-input',
        }}
        onChange={(event) => onChange(event.target.value)}
        onClear={() => onChange('')}
        placeholder={t('searchAnAcccountOrContact')}
        value={searchQuery}
      />
    </Box>
  );
};
