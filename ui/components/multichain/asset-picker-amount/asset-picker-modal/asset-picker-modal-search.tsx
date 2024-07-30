import React from 'react';
import {
  Box,
  ButtonIconSize,
  TextFieldSearch,
  TextFieldSearchSize,
} from '../../../component-library';
import {
  BlockSize,
  BorderRadius,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const Search = ({
  searchQuery,
  onChange,
  isNFTSearch = false,
  props,
}: {
  searchQuery: string;
  onChange: (value: string) => void;
  isNFTSearch?: boolean;
  props?: React.ComponentProps<typeof Box>;
}) => {
  const t = useI18nContext();

  return (
    <Box padding={4} {...props}>
      <TextFieldSearch
        borderRadius={BorderRadius.LG}
        placeholder={t(isNFTSearch ? 'searchNfts' : 'searchTokens')}
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
        showClearButton
        className="asset-picker-modal__search-list"
        inputProps={{
          'data-testid': 'asset-picker-modal-search-input',
        }}
        endAccessory={null}
        size={TextFieldSearchSize.Lg}
      />
    </Box>
  );
};
