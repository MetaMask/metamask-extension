import React from 'react';
import { TextFieldSearch } from '@metamask/design-system-react';
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
    <search className="p-4">
      <TextFieldSearch
        className="w-full"
        clearButtonOnClick={() => onChange('')}
        inputProps={
          {
            'data-testid': 'recipient-filter-search-input',
            'aria-label': t('searchAnAcccountOrContact'),
          } as React.ComponentPropsWithoutRef<'input'>
        }
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('searchAnAcccountOrContact')}
        value={searchQuery}
      />
    </search>
  );
};
