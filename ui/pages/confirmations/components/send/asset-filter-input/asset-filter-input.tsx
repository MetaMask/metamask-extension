import React from 'react';
import { TextFieldSearch, TextFieldSize } from '@metamask/design-system-react';
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
        className="app-text-field-search"
        clearButtonOnClick={() => onChange('')}
        clearButtonProps={{ ariaLabel: t('clear') }}
        inputProps={
          {
            'data-testid': 'asset-filter-search-input',
          } as React.ComponentPropsWithoutRef<'input'>
        }
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? t('searchForAnAssetToSend')}
        size={TextFieldSize.Lg}
        value={searchQuery}
      />
    </Box>
  );
};
