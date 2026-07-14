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
import { Header } from '../../../components/multichain/pages/page';
import { PillTextFieldSearch } from '../../../components/ui/pill-text-field-search';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

type SettingsHeaderProps = {
  title: string;
  isPopupOrSidepanel?: boolean;
  isOnSettingsRoot?: boolean;
  onClose?: () => void;
  isSearchOpen?: boolean;
  onOpenSearch?: () => void;
  onCloseSearch?: () => void;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (text: string) => void;
  onSearchClear?: () => void;
  showSearchBorder?: boolean;
};

export const SettingsHeader = ({
  title,
  isPopupOrSidepanel = false,
  isOnSettingsRoot = false,
  onClose,
  isSearchOpen = false,
  onOpenSearch,
  onCloseSearch,
  searchValue = '',
  searchPlaceholder,
  onSearchChange,
  onSearchClear,
  showSearchBorder = true,
}: SettingsHeaderProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const showSearchButton =
    Boolean(onOpenSearch) && (!isPopupOrSidepanel || isOnSettingsRoot);

  if (isSearchOpen) {
    return (
      <header
        className={`mm-header-search w-full ${showSearchBorder ? 'border-b border-border-muted' : ''}`}
      >
        <Box
          alignItems={BoxAlignItems.Center}
          className="w-full"
          flexDirection={BoxFlexDirection.Row}
          gap={2}
          padding={3}
          paddingHorizontal={4}
        >
          <Box className="flex min-w-0 flex-1 items-center">
            <PillTextFieldSearch
              autoFocus
              inputProps={{
                'data-testid': 'settings-header-search-input',
              }}
              onChange={(event) => onSearchChange?.(event.target.value)}
              onClear={() => onSearchClear?.()}
              placeholder={searchPlaceholder ?? t('search')}
              value={searchValue}
            />
          </Box>
          <ButtonIcon
            ariaLabel={t('close')}
            data-testid="settings-header-search-close-button"
            iconName={IconName.Close}
            onClick={() => {
              onCloseSearch?.();
              onSearchClear?.();
            }}
            size={ButtonIconSize.Md}
          />
        </Box>
      </header>
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
          onClick={onOpenSearch}
          data-testid="settings-header-search-button"
        />
      ) : (
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close')}
          size={ButtonIconSize.Md}
          onClick={() => navigate(DEFAULT_ROUTE)}
          data-testid="settings-header-close-button"
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
        data-testid="settings-header-back-button"
      />
    </Box>
  );
  return (
    <Header startAccessory={startAccessory} endAccessory={endAccessory}>
      {title}
    </Header>
  );
};
