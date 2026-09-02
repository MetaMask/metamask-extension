import React, { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextFieldSearch,
  TextVariant as DsrTextVariant,
} from '@metamask/design-system-react';
import { TextVariant } from '../../../helpers/constants/design-system';

import { transitionBack } from '../../../components/ui/transition';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAccountList } from '../../../components/multichain-accounts/multichain-account-list';
import { useAccountListSearch } from '../../../components/multichain-accounts/hooks/useAccountListSearch';
import {
  getAccountTree,
  getSelectedAccountGroup,
} from '../../../selectors/multichain-accounts/account-tree';
import {
  getAllPermittedAccountsForCurrentTab,
  getIsDefaultAddressEnabled,
  getShowDefaultAddressPreference,
} from '../../../selectors';
import {
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
  CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import { useAccountsOperationsLoadingStates } from '../../../hooks/accounts/useAccountsOperationsLoadingStates';
import {
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { useAssetsUpdateAllAccountBalances } from '../../../hooks/useAssetsUpdateAllAccountBalances';
import { useSyncSRPs } from '../../../hooks/social-sync/useSyncSRPs';
import { ScrollContainer } from '../../../contexts/scroll-container';

export const AccountList = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const accountTree = useSelector(getAccountTree);
  const { wallets } = accountTree;
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const permittedAccounts = useSelector(getAllPermittedAccountsForCurrentTab);
  const isDefaultAddressEnabled = useSelector(getIsDefaultAddressEnabled);
  const showDefaultAddress = useSelector(getShowDefaultAddressPreference);

  const {
    isAccountTreeSyncingInProgress,
    loadingMessage: accountOperationLoadingMessage,
  } = useAccountsOperationsLoadingStates();

  const addWalletButtonLabel = useMemo(() => {
    if (isAccountTreeSyncingInProgress) {
      return accountOperationLoadingMessage;
    }
    return t('addWallet');
  }, [isAccountTreeSyncingInProgress, accountOperationLoadingMessage, t]);
  // Update balances for all accounts when component mounts
  // This ensures all account balances are visible without requiring user interaction
  useAssetsUpdateAllAccountBalances();

  // Sync SRPs for social login flow
  // TODO: Move this logic on the background side, so we don't trigger this sync
  // every time the account list is being opened.
  // See: https://github.com/MetaMask/metamask-extension/issues/36639
  useSyncSRPs();

  const hasMultipleWallets = useMemo(
    () => Object.keys(wallets).length > 1,
    [wallets],
  );

  const {
    searchPattern,
    onSearchBarChange,
    clearSearch,
    filteredWallets,
    hasFilteredWallets,
    isInSearchMode,
  } = useAccountListSearch(wallets);

  const handleNavigateToChooseNewWalletType = useCallback(() => {
    navigate(CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE);
  }, [navigate]);

  // When opened in a fresh tab (e.g. redirected from side panel/popup for
  // hardware wallet onboarding), there is no browser history to go back to.
  // Detect this via location.key being 'default' (initial entry) or
  // fromFreshTab state propagated from downstream pages, then navigate
  // directly to home instead of using history-based back navigation.
  const isFreshTab =
    location.key === 'default' ||
    (location.state as { fromFreshTab?: boolean } | null)?.fromFreshTab ===
      true;

  const handleBack = useCallback(() => {
    if (isFreshTab) {
      navigate(DEFAULT_ROUTE, { replace: true });
    } else {
      transitionBack(() => navigate(PREVIOUS_ROUTE));
    }
  }, [isFreshTab, navigate]);

  const [isEditMode, setIsEditMode] = useState(false);

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode((current) => !current);
  }, []);

  return (
    <Page
      className="account-list-page"
      data-testid="parent-selector-account-list-page"
    >
      <Header
        textProps={{
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={handleBack}
            data-testid="account-list-page-back-button"
          />
        }
        endAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel={t('settings')}
            iconName={IconName.Setting}
            data-testid="account-list-page-settings-button"
            onClick={handleToggleEditMode}
          />
        }
      >
        {t('accounts')}
      </Header>
      <div className="account-list-page__content flex flex-col min-h-0 overflow-auto">
        <Box
          flexDirection={BoxFlexDirection.Column}
          paddingTop={1}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={2}
        >
          <TextFieldSearch
            className="w-full"
            clearButtonOnClick={clearSearch}
            data-testid="multichain-account-list-search"
            onChange={onSearchBarChange}
            placeholder={t('searchYourAccounts')}
            value={searchPattern}
          />
        </Box>
        <ScrollContainer className="multichain-account-menu-popover__list flex flex-col overflow-auto">
          {hasFilteredWallets ? (
            <MultichainAccountList
              wallets={filteredWallets}
              selectedAccountGroups={[selectedAccountGroup]}
              isInSearchMode={isInSearchMode}
              displayWalletHeader={hasMultipleWallets}
              showConnectionStatus={permittedAccounts.length > 0}
              showDefaultAddress={isDefaultAddressEnabled && showDefaultAddress}
              isEditMode={isEditMode}
            />
          ) : (
            <Box
              className="flex h-full w-full"
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Center}
              alignItems={BoxAlignItems.Center}
            >
              <Text
                color={TextColor.TextAlternative}
                variant={DsrTextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
              >
                {t('noAccountsFound')}
              </Text>
            </Box>
          )}
        </ScrollContainer>
      </div>
      <Footer className="shadow-sm">
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          onClick={handleNavigateToChooseNewWalletType}
          isDisabled={isAccountTreeSyncingInProgress}
          isFullWidth
          data-testid="account-list-add-wallet-button"
        >
          <Box
            gap={2}
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
          >
            {isAccountTreeSyncingInProgress && (
              <Icon
                className="add-multichain-account__icon-box__icon-loading"
                name={IconName.Loading}
                color={IconColor.IconMuted}
                size={IconSize.Lg}
              />
            )}
            <Text
              variant={DsrTextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
            >
              {addWalletButtonLabel}
            </Text>
          </Box>
        </Button>
      </Footer>
    </Page>
  );
};
