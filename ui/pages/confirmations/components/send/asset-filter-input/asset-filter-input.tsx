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
    <Box paddingTop={4} paddingLeft={4} paddingRight={4} paddingBottom={2}>
      <TextFieldSearch
        borderRadius={BorderRadius.LG}
        placeholder={placeholder ?? t('searchForAnAssetToSend')}
        value={searchQuery}
        onChange={(e) => onChange(e.target.value)}
        error={false}
        autoFocus
        autoComplete={false}
        width={BlockSize.Full}
        clearButtonOnClick={() => onChange('')}
        clearButtonProps={{
          size: ButtonIconSize.Sm,
        }}
        style={{ paddingInline: 12 }}
        showClearButton
        inputProps={{
          'data-testid': 'asset-filter-search-input',
        }}
        endAccessory={null}
        size={TextFieldSearchSize.Lg}
      />
    </Box>
  );
};
