import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { Header } from '../../multichain/pages/page';
import { HeaderSearch, HeaderSearchVariant } from '../../component-library';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

type PageHeaderWithSearchProps = {
  title: string;
  /**
   * Which button to render on the right side of the header when search is
   * closed: the search toggle (`'search'`) or a close button that navigates
   * back to the wallet home (`'close'`). Defaults to `'search'`.
   */
  endAction?: 'search' | 'close';
  onBack?: () => void;
  isSearchOpen?: boolean;
  onOpenSearch?: () => void;
  onCloseSearch?: () => void;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (text: string) => void;
  onSearchClear?: () => void;
  showSearchBorder?: boolean;
};

export const PageHeaderWithSearch = ({
  title,
  endAction = 'search',
  onBack,
  isSearchOpen = false,
  onOpenSearch,
  onCloseSearch,
  searchValue = '',
  searchPlaceholder,
  onSearchChange,
  onSearchClear,
  showSearchBorder = true,
}: PageHeaderWithSearchProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();

  if (isSearchOpen) {
    return (
      <HeaderSearch
        variant={HeaderSearchVariant.Inline}
        className="app-text-field-search"
        padding={3}
        paddingHorizontal={4}
        onClickCancelButton={() => {
          onCloseSearch?.();
          onSearchClear?.();
        }}
        textFieldSearchProps={{
          value: searchValue,
          placeholder: searchPlaceholder ?? t('search'),
          onChangeText: onSearchChange,
          onClickClearButton: onSearchClear,
          autoFocus: true,
          inputProps: {
            'data-testid': 'page-header-search-input',
          } as React.ComponentPropsWithoutRef<'input'>,
        }}
      />
    );
  }

  const endAccessory = (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={1}
    >
      {endAction === 'search' ? (
        <ButtonIcon
          iconName={IconName.Search}
          ariaLabel={t('search')}
          size={ButtonIconSize.Md}
          onClick={onOpenSearch}
          data-testid="page-header-search-button"
        />
      ) : (
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close')}
          size={ButtonIconSize.Md}
          onClick={() => navigate(DEFAULT_ROUTE)}
          data-testid="page-header-close-button"
        />
      )}
    </Box>
  );
  const startAccessory = (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={1}
    >
      <ButtonIcon
        iconName={IconName.ArrowLeft}
        ariaLabel={t('back')}
        size={ButtonIconSize.Md}
        onClick={onBack}
        data-testid="page-header-back-button"
      />
    </Box>
  );
  return (
    <Header startAccessory={startAccessory} endAccessory={endAccessory}>
      {title}
    </Header>
  );
};
