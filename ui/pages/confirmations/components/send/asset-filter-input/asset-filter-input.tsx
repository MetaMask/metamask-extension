import React from 'react';
import { Box } from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { PillTextFieldSearch } from '../../../../../components/ui/pill-text-field-search';

type AssetFilterInputProps = {
  searchQuery: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export const AssetFilterInput = ({
  searchQuery,
  onChange,
  placeholder,
}: AssetFilterInputProps) => {
  const t = useI18nContext();

  return (
    <Box paddingLeft={4} paddingRight={4} paddingBottom={2}>
      <PillTextFieldSearch
        autoFocus
        inputProps={{
          'data-testid': 'asset-filter-search-input',
        }}
        onChange={(event) => onChange(event.target.value)}
        onClear={() => onChange('')}
        placeholder={placeholder ?? t('searchForAnAssetToSend')}
        value={searchQuery}
      />
    </Box>
  );
};
