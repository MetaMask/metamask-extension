import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextVariant as DsrTextVariant,
} from '@metamask/design-system-react';

import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { transitionBack } from '../../../components/ui/transition';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAccountList } from '../../../components/multichain-accounts/multichain-account-list';
import {
  getAccountTree,
  getSelectedAccountGroup,
  getNormalizedGroupsMetadata,
} from '../../../selectors/multichain-accounts/account-tree';
import {
  getAllPermittedAccountsForCurrentTab,
  getIsDefaultAddressEnabled,
  getShowDefaultAddressPreference,
} from '../../../selectors';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { AddWalletModal } from '../../../components/multichain-accounts/add-wallet-modal';
import { useAccountsOperationsLoadingStates } from '../../../hooks/accounts/useAccountsOperationsLoadingStates';
import {
  TextFieldSearch,
  TextFieldSearchSize,
} from '../../../components/component-library';
import {
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { useAssetsUpdateAllAccountBalances } from '../../../hooks/useAssetsUpdateAllAccountBalances';
import { useSyncSRPs } from '../../../hooks/social-sync/useSyncSRPs';
import { ScrollContainer } from '../../../contexts/scroll-container';
import { filterWalletsByGroupNameOrAddress } from './utils';

export const AccountList = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const accountTree = useSelector(getAccountTree);
  const { wallets } = accountTree;
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const [searchPattern, setSearchPattern] = useState<string>('');
  const groupsMetadata = useSelector(getNormalizedGroupsMetadata);
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

  const onSearchBarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setSearchPattern(e.target.value),
    [],
  );

  const filteredWallets = useMemo(() => {
    return filterWalletsByGroupNameOrAddress(
      wallets,
      searchPattern,
      groupsMetadata,
    );
  }, [wallets, searchPattern, groupsMetadata]);

  const hasFilteredWallets = useMemo(
    () => Object.keys(filteredWallets).length > 0,
    [filteredWallets],
  );

  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);

  const handleOpenAddWalletModal = useCallback(() => {
    setIsAddWalletModalOpen(true);
  }, [setIsAddWalletModalOpen]);

  const handleCloseAddWalletModal = useCallback(() => {
    setIsAddWalletModalOpen(false);
  }, [setIsAddWalletModalOpen]);

  const handleBack = useCallback(() => {
    transitionBack(() => navigate(PREVIOUS_ROUTE));
  }, [navigate]);

  return (
    <Page className="account-list-page">
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
            size={TextFieldSearchSize.Lg}
            placeholder={t('searchYourAccounts')}
            value={searchPattern}
            onChange={onSearchBarChange}
            clearButtonOnClick={() => setSearchPattern('')}
            width={BlockSize.Full}
            borderWidth={0}
            backgroundColor={BackgroundColor.backgroundMuted}
            borderRadius={BorderRadius.LG}
            data-testid="multichain-account-list-search"
          />
        </Box>
        <ScrollContainer className="multichain-account-menu-popover__list flex flex-col overflow-auto">
          {hasFilteredWallets ? (
            <MultichainAccountList
              wallets={filteredWallets}
              selectedAccountGroups={[selectedAccountGroup]}
              isInSearchMode={Boolean(searchPattern)}
              displayWalletHeader={hasMultipleWallets}
              showConnectionStatus={permittedAccounts.length > 0}
              showDefaultAddress={isDefaultAddressEnabled && showDefaultAddress}
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
          onClick={handleOpenAddWalletModal}
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
      <AddWalletModal
        isOpen={isAddWalletModalOpen}
        onClose={handleCloseAddWalletModal}
      />
    </Page>
  );
};
