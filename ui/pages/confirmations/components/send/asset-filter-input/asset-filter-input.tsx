import React, { useId } from 'react';
import { TextFieldSearch } from '@metamask/design-system-react';
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
  const id = useId();
  const t = useI18nContext();

  return (
    <search className="px-4 py-2">
      <TextFieldSearch
        id={id}
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
    </search>
  );
};
