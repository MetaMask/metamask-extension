import React from 'react';
import { TextFieldSearch, TextFieldSize } from '@metamask/design-system-react';
import { Box } from '../../../component-library';
import { APP_TEXT_FIELD_SEARCH_CLASSNAME } from '../../../ui/app-text-field-search-styles';
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
        autoFocus={autoFocus}
        className={`${APP_TEXT_FIELD_SEARCH_CLASSNAME} asset-picker-modal__search-list`}
        clearButtonOnClick={() => onChange('')}
        clearButtonProps={{ ariaLabel: t('clear') }}
        inputProps={{
          'data-testid': 'asset-picker-modal-search-input',
        }}
        onChange={(event) => onChange(event.target.value)}
        placeholder={
          placeholder ??
          t(isNFTSearch ? 'searchNfts' : 'searchTokensByNameOrAddress')
        }
        size={TextFieldSize.Lg}
        value={searchQuery}
      />
    </Box>
  );
};
