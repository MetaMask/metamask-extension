import React from 'react';
import { TextFieldSearch } from '@metamask/design-system-react';
import { Box } from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

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
      <TextFieldSearch
        autoFocus
        className="w-full"
        clearButtonOnClick={() => onChange('')}
        inputProps={
          {
            'data-testid': 'asset-filter-search-input',
          } as React.ComponentPropsWithoutRef<'input'>
        }
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? t('searchForAnAssetToSend')}
        value={searchQuery}
      />
    </Box>
  );
};
