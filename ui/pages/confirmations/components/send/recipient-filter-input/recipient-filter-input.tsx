import React, { useId } from 'react';
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
  const id = useId();
  const t = useI18nContext();

  return (
    <search className="p-4">
      <TextFieldSearch
        id={id}
        className="w-full"
        clearButtonOnClick={() => onChange('')}
        inputProps={
          {
            'data-testid': 'recipient-filter-search-input',
          } as React.ComponentPropsWithoutRef<'input'>
        }
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('searchAnAcccountOrContact')}
        value={searchQuery}
      />
    </search>
  );
};
