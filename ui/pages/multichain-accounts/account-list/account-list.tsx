import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';

import {
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';

import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAccountList } from '../../../components/multichain-accounts/multichain-account-list';
import {
  getAccountTree,
  getNormalizedGroupsMetadata,
} from '../../../selectors/multichain-accounts/account-tree';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { AddWalletModal } from '../../../components/multichain-accounts/add-wallet-modal';
import { useAccountsOperationsLoadingStates } from '../../../hooks/accounts/useAccountsOperationsLoadingStates';
import {
  Box,
  Text,
  TextFieldSearch,
  TextFieldSearchSize,
} from '../../../components/component-library';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { useAssetsUpdateAllAccountBalances } from '../../../hooks/useAssetsUpdateAllAccountBalances';
import { useSyncSRPs } from '../../../hooks/social-sync/useSyncSRPs';
import { getAllPermittedAccountsForCurrentTab } from '../../../selectors';
import { filterWalletsByGroupNameOrAddress } from './utils';

export const AccountList = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const accountTree = useSelector(getAccountTree);
  const { wallets } = accountTree;
  const { selectedAccountGroup } = accountTree;
  const [searchPattern, setSearchPattern] = useState<string>('');
  const groupsMetadata = useSelector(getNormalizedGroupsMetadata);
  const permittedAccounts = useSelector(getAllPermittedAccountsForCurrentTab);

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
            onClick={() => navigate(PREVIOUS_ROUTE)}
          />
        }
      >
        {t('accounts')}
      </Header>
      <Content className="account-list-page__content" paddingInline={0}>
        <Box
          flexDirection={FlexDirection.Column}
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
        <Box
          display={Display.Flex}
          height={BlockSize.Full}
          flexDirection={FlexDirection.Column}
          className="multichain-account-menu-popover__list"
        >
          {hasFilteredWallets ? (
            <MultichainAccountList
              wallets={filteredWallets}
              selectedAccountGroups={[selectedAccountGroup]}
              isInSearchMode={Boolean(searchPattern)}
              displayWalletHeader={hasMultipleWallets}
              showConnectionStatus={permittedAccounts.length > 0}
            />
          ) : (
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
              width={BlockSize.Full}
              height={BlockSize.Full}
            >
              <Text
                color={TextColor.textAlternative}
                variant={TextVariant.bodyMdMedium}
              >
                {t('noAccountsFound')}
              </Text>
            </Box>
          )}
        </Box>
      </Content>
      <Footer className="shadow-sm">
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          onClick={handleOpenAddWalletModal}
          isDisabled={isAccountTreeSyncingInProgress}
          isFullWidth
          data-testid="account-list-add-wallet-button"
        >
          <Box gap={2} display={Display.Flex} alignItems={AlignItems.center}>
            {isAccountTreeSyncingInProgress && (
              <Icon
                className="add-multichain-account__icon-box__icon-loading"
                name={IconName.Loading}
                color={IconColor.IconMuted}
                size={IconSize.Lg}
              />
            )}
            <Text variant={TextVariant.bodyMdMedium}>
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
