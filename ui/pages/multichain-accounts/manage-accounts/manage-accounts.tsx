import React, { useCallback, useMemo, useState } from 'react';
import { createSearchParams, useLocation, useNavigate } from 'react-router-dom';
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
import { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { TextVariant } from '../../../helpers/constants/design-system';

import { transitionBack } from '../../../components/ui/transition';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
  CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE,
  MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
} from '../../../helpers/constants/routes';
import {
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { ScrollContainer } from '../../../contexts/scroll-container';
import { useAssetsUpdateAllAccountBalances } from '../../../hooks/useAssetsUpdateAllAccountBalances';
import { useSyncSRPs } from '../../../hooks/social-sync/useSyncSRPs';
import { useAccountsOperationsLoadingStates } from '../../../hooks/accounts/useAccountsOperationsLoadingStates';
import { useAccountListSearch } from '../../../components/multichain-accounts/hooks/useAccountListSearch';
import {
  getAccountTree,
  getIconSeedAddressByAccountGroupId,
} from '../../../selectors/multichain-accounts/account-tree';
import { getMetaMaskHdKeyrings } from '../../../selectors';
import {
  AccountManagementList,
  AccountManagementRowItem,
  AccountManagementSection,
} from '../../../components/multichain-accounts/account-management-list';
import { AccountRemoveModal } from '../../../components/multichain-accounts/account-remove-modal';
import { WalletRemoveModal } from '../../../components/multichain-accounts/wallet-remove-modal';
import { useDispatch } from '../../../store/hooks';
import {
  removeAccount,
  removeMultichainAccountWallet,
  setAccountGroupName,
} from '../../../store/actions';

type LocationStateWithFreshTab = {
  fromFreshTab?: boolean;
};

function hasFromFreshTabState(
  state: unknown,
): state is LocationStateWithFreshTab {
  return (
    typeof state === 'object' && state !== null && 'fromFreshTab' in state
  );
}

export const ManageAccounts = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const accountTree = useSelector(getAccountTree);
  const { wallets } = accountTree;
  const hdKeyrings = useSelector(getMetaMaskHdKeyrings);
  const primaryEntropySourceId = hdKeyrings?.[0]?.metadata?.id;

  // Update balances for all accounts when component mounts
  useAssetsUpdateAllAccountBalances();

  // Sync SRPs for social login flow
  useSyncSRPs();

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

  const {
    searchPattern,
    onSearchBarChange,
    clearSearch,
    filteredWallets,
    hasFilteredWallets,
    isInSearchMode,
  } = useAccountListSearch(wallets);

  const [walletToRemove, setWalletToRemove] =
    useState<AccountManagementSection | null>(null);

  const [accountToRemove, setAccountToRemove] = useState<{
    item: AccountManagementRowItem;
    address: string;
  } | null>(null);

  const handleNavigateToChooseNewWalletType = useCallback(() => {
    navigate(CHOOSE_NEW_WALLET_TYPE_PAGE_ROUTE);
  }, [navigate]);

  const handleAccountClick = useCallback(
    (accountGroupId: AccountGroupId) => {
      navigate({
        pathname: MULTICHAIN_ACCOUNT_DETAILS_PAGE_ROUTE,
        search: createSearchParams({
          accountGroupId,
        }).toString(),
      });
    },
    [navigate],
  );

  const handleOpenRemoveWallet = useCallback(
    (section: AccountManagementSection) => {
      setWalletToRemove(section);
    },
    [],
  );

  const handleCloseRemoveWallet = useCallback(() => {
    setWalletToRemove(null);
  }, []);

  const handleConfirmRemoveWallet = useCallback(async () => {
    const walletId = walletToRemove?.walletId;
    if (!walletId) {
      return;
    }
    try {
      await dispatch(removeMultichainAccountWallet(walletId));
      setWalletToRemove(null);
    } catch (error) {
      // error is logged by action
    }
  }, [dispatch, walletToRemove]);

  const handleOpenRemoveAccount = useCallback(
    (item: AccountManagementRowItem) => {
      // Find address for this account group
      const address = item.groupData.accounts?.[0] || '';
      setAccountToRemove({ item, address });
    },
    [],
  );

  const handleCloseRemoveAccount = useCallback(() => {
    setAccountToRemove(null);
  }, []);

  const handleConfirmRemoveAccount = useCallback(async () => {
    if (!accountToRemove?.address) {
      return;
    }
    try {
      await dispatch(removeAccount(accountToRemove.address));
      setAccountToRemove(null);
    } catch (error) {
      // error is logged by action
    }
  }, [dispatch, accountToRemove]);

  const handleRenameAccount = useCallback(
    async (groupId: AccountGroupId, newName: string) => {
      try {
        await dispatch(setAccountGroupName(groupId, newName));
      } catch (error) {
        // error is logged by action
      }
    },
    [dispatch],
  );

  // When opened in a fresh tab (e.g. redirected from side panel/popup), there
  // is no browser history to go back to. Detect this via location.key being
  // 'default' (initial entry) or fromFreshTab state propagated from downstream
  // pages, then navigate directly to home instead of using history-based back
  // navigation.
  const isFreshTab =
    location.key === 'default' ||
    (hasFromFreshTabState(location.state) &&
      location.state.fromFreshTab === true);

  const handleBack = useCallback(() => {
    if (isFreshTab) {
      navigate(DEFAULT_ROUTE, { replace: true });
    } else {
      transitionBack(() => navigate(PREVIOUS_ROUTE));
    }
  }, [isFreshTab, navigate]);

  return (
    <Page className="manage-accounts-page" data-testid="manage-accounts-page">
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
            data-testid="manage-accounts-page-back-button"
          />
        }
      >
        {t('manageAccounts')}
      </Header>

      <div className="manage-accounts-page__content flex flex-col min-h-0 overflow-auto flex-1">
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
            data-testid="manage-accounts-search"
            onChange={onSearchBarChange}
            placeholder={t('searchYourAccounts')}
            value={searchPattern}
          />
        </Box>

        <ScrollContainer className="manage-accounts-page__list flex flex-col overflow-auto">
          {hasFilteredWallets ? (
            <AccountManagementList
              wallets={filteredWallets}
              isInSearchMode={isInSearchMode}
              onAccountClick={handleAccountClick}
              onRemoveWallet={handleOpenRemoveWallet}
              onRemoveAccount={handleOpenRemoveAccount}
              onRenameAccount={handleRenameAccount}
              primaryEntropySourceId={primaryEntropySourceId}
            />
          ) : (
            <Box
              className="flex h-full w-full py-8"
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Center}
              alignItems={BoxAlignItems.Center}
              data-testid="manage-accounts-no-results"
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
          data-testid="manage-accounts-add-wallet-button"
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

      {walletToRemove && (
        <WalletRemoveModal
          isOpen={Boolean(walletToRemove)}
          onClose={handleCloseRemoveWallet}
          onSubmit={handleConfirmRemoveWallet}
          walletName={walletToRemove.title}
        />
      )}

      {accountToRemove && (
        <AccountRemoveModal
          isOpen={Boolean(accountToRemove)}
          onClose={handleCloseRemoveAccount}
          onSubmit={handleConfirmRemoveAccount}
          accountName={accountToRemove.item.groupData.metadata?.name || ''}
          accountAddress={accountToRemove.address}
        />
      )}
    </Page>
  );
};
