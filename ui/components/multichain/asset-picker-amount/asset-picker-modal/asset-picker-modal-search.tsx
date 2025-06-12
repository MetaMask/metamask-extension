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

/**
 * Renders a search component for the asset picker modal.
 *
 * @param props
 * @param props.searchQuery - The current search query.
 * @param props.onChange - The function to handle search query changes.
 * @param props.isNFTSearch - Indicates if the search is for NFTs.
 * @param props.props - Additional props for the containing Box component.
 * @param props.placeholder - A custom placeholder for the search input.
 * @param props.autoFocus - Whether to auto-focus the search input.
 * @returns The rendered search component.
 */
export const Search = ({
  searchQuery,
  onChange,
  isNFTSearch = false,
  props,
  placeholder,
  autoFocus = true,
}: {
  searchQuery: string;
  onChange: (value: string) => void;
  isNFTSearch?: boolean;
  props?: React.ComponentProps<typeof Box>;
  placeholder?: JSX.Element | string | null;
  autoFocus?: boolean;
}) => {
  const t = useI18nContext();

  return (
    <Box
      paddingTop={4}
      paddingLeft={4}
      paddingRight={4}
      paddingBottom={2}
      {...props}
    >
      <TextFieldSearch
        borderRadius={BorderRadius.LG}
        placeholder={
          placeholder ??
          t(isNFTSearch ? 'searchNfts' : 'searchTokensByNameOrAddress')
        }
        value={searchQuery}
        onChange={(e) => onChange(e.target.value)}
        error={false}
        autoFocus={autoFocus}
        autoComplete={false}
        width={BlockSize.Full}
        clearButtonOnClick={() => onChange('')}
        clearButtonProps={{
          size: ButtonIconSize.Sm,
        }}
        style={{ paddingInline: 12 }}
        showClearButton
        className="asset-picker-modal__search-list"
        inputProps={{
          'data-testid': 'asset-picker-modal-search-input',
          marginRight: 0,
        }}
        endAccessory={null}
        size={TextFieldSearchSize.Lg}
      />
    </Box>
  );
};
