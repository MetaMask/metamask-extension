import React from 'react';
import {
  Box,
  ButtonIconSize,
  TextFieldSearch,
  TextFieldSearchSize,
} from '../../../../../components/component-library';
import {
  BlockSize,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type RecipientFilterInputProps = {
  searchQuery: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export const RecipientFilterInput = ({
  searchQuery,
  onChange,
}: RecipientFilterInputProps) => {
  const t = useI18nContext();

  return (
    <Box paddingBottom={2}>
      <TextFieldSearch
        borderRadius={BorderRadius.LG}
        placeholder={t('searchAnAcccountOrContact')}
        value={searchQuery}
        onChange={(e) => onChange(e.target.value)}
        error={false}
        autoComplete={false}
        width={BlockSize.Full}
        clearButtonOnClick={() => onChange('')}
        clearButtonProps={{
          size: ButtonIconSize.Sm,
        }}
        style={{ paddingInline: 12 }}
        showClearButton
        inputProps={{
          'data-testid': 'recipient-filter-search-input',
        }}
        endAccessory={null}
        size={TextFieldSearchSize.Lg}
      />
    </Box>
  );
};
