import React, { useState } from 'react';
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
import { Header } from '../../../components/multichain/pages/page';
import {
  HeaderSearch,
  HeaderSearchVariant,
} from '../../../components/component-library';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

type SettingsV2HeaderProps = {
  title: string;
  isPopup?: boolean;
  isOnSettingsRoot?: boolean;
  onClose?: () => void;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (text: string) => void;
  onSearchClear?: () => void;
};

export const SettingsV2Header = ({
  title,
  isPopup = false,
  isOnSettingsRoot = false,
  onClose,
  searchValue = '',
  searchPlaceholder,
  onSearchChange,
  onSearchClear,
}: SettingsV2HeaderProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const showSearchButton = !isPopup || isOnSettingsRoot;

  if (isSearchOpen) {
    return (
      <HeaderSearch
        variant={HeaderSearchVariant.Inline}
        padding={3}
        paddingHorizontal={4}
        onClickCancelButton={() => {
          setIsSearchOpen(false);
          onSearchClear?.();
        }}
        textFieldSearchProps={{
          value: searchValue,
          placeholder: searchPlaceholder ?? t('search'),
          onChangeText: onSearchChange,
          onClickClearButton: onSearchClear,
          inputProps: {
            'data-testid': 'settings-v2-header-search-input',
          },
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
      {showSearchButton ? (
        <ButtonIcon
          iconName={IconName.Search}
          ariaLabel={t('search')}
          size={ButtonIconSize.Md}
          onClick={() => setIsSearchOpen(true)}
          data-testid="settings-v2-header-search-button"
        />
      ) : (
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close')}
          size={ButtonIconSize.Md}
          onClick={() => navigate(DEFAULT_ROUTE)}
          data-testid="settings-v2-header-close-button"
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
        onClick={onClose}
        data-testid="settings-v2-header-back-button"
      />
    </Box>
  );
  return (
    <Header startAccessory={startAccessory} endAccessory={endAccessory}>
      {title}
    </Header>
  );
};
