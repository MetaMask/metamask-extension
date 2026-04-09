import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  AvatarAccount,
  AvatarAccountVariant,
  AvatarBaseShape,
  BadgeStatus,
  BadgeStatusStatus,
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
import { transitionBack } from '../../../components/ui/transition';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAccountList } from '../../../components/multichain-accounts/multichain-account-list';
import {
  getAccountTree,
  getNormalizedGroupsMetadata,
} from '../../../selectors/multichain-accounts/account-tree';
import {
  getAllPermittedAccountsForCurrentTab,
  getShowDefaultAddress,
} from '../../../selectors';
import { DEFAULT_ROUTE, LINK_2FA_ROUTE, MANAGE_2FA_ROUTE, PREVIOUS_ROUTE, RECOVER_2FA_ROUTE, SEND_2FA_ROUTE, SETUP_2FA_ROUTE } from '../../../helpers/constants/routes';
import { AddWalletModal } from '../../../components/multichain-accounts/add-wallet-modal';
import { useAccountsOperationsLoadingStates } from '../../../hooks/accounts/useAccountsOperationsLoadingStates';
import {
  Box,
  Text,
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
  const { selectedAccountGroup } = accountTree;
  const [searchPattern, setSearchPattern] = useState<string>('');
  const [twoFAMenuOpen, setTwoFAMenuOpen] = useState(false);
  const [twoFAOptionsOpen, setTwoFAOptionsOpen] = useState(false);
  const groupsMetadata = useSelector(getNormalizedGroupsMetadata);
  const permittedAccounts = useSelector(getAllPermittedAccountsForCurrentTab);
  const showDefaultAddress = useSelector(getShowDefaultAddress);

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
      <div className="account-list-page__content flex flex-col min-h-0 overflow-auto overflow-x-visible">
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
        <ScrollContainer className="multichain-account-menu-popover__list flex flex-col overflow-auto">
          {hasFilteredWallets ? (
            <MultichainAccountList
              wallets={filteredWallets}
              selectedAccountGroups={[selectedAccountGroup]}
              isInSearchMode={Boolean(searchPattern)}
              displayWalletHeader={hasMultipleWallets}
              showConnectionStatus={permittedAccounts.length > 0}
              showDefaultAddress={showDefaultAddress}
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
        </ScrollContainer>
        {/* Mock 2FA wallets section */}
        {typeof window !== 'undefined' && localStorage.getItem('mm-2fa-wallet-created') === 'true' && (
          <Box
            flexDirection={FlexDirection.Column}
            paddingLeft={4}
            paddingRight={4}
            paddingTop={2}
            paddingBottom={2}
          >
            <Text
              color={TextColor.textAlternative}
              variant={TextVariant.bodySmMedium}
              paddingBottom={2}
            >
              {t('twoFAWallets')}
            </Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.spaceBetween}
              className="py-3 cursor-pointer hover:bg-background-default-hover rounded-lg px-2 -mx-2"
              onClick={() => { localStorage.setItem('mm-2fa-active', 'true'); navigate(DEFAULT_ROUTE); }}
            >
              <Box display={Display.Flex} alignItems={AlignItems.center} gap={3}>
                <AvatarAccount
                  shape={AvatarBaseShape.Square}
                  variant={AvatarAccountVariant.Maskicon}
                  address="0x2FA0000000000000000000000000000000000001"
                />
                <Text variant={TextVariant.bodyMdMedium}>2FA account 1</Text>
              </Box>
              <Box display={Display.Flex} alignItems={AlignItems.center} gap={2} className="relative">
                <Text variant={TextVariant.bodyMdMedium} color={TextColor.textAlternative}>$0.00</Text>
                <ButtonIcon
                  iconName={IconName.MoreVertical}
                  ariaLabel="More"
                  size={ButtonIconSize.Sm}
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); setTwoFAMenuOpen(!twoFAMenuOpen); }}
                />
                {twoFAMenuOpen && (
                  <Box
                    backgroundColor={BackgroundColor.backgroundDefault}
                    className="absolute right-0 bottom-8 z-50 rounded-lg py-1 min-w-[200px]"
                    style={{ border: '1px solid var(--color-border-muted)', boxShadow: '0 4px 16px var(--color-shadow-default)' }}
                  >
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Row}
                      alignItems={AlignItems.center}
                      gap={3}
                      className="px-4 py-3 cursor-pointer hover:bg-background-default-hover"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); setTwoFAMenuOpen(false); navigate(SEND_2FA_ROUTE); }}
                    >
                      <Icon name={IconName.Send} color={IconColor.IconDefault} size={IconSize.Sm} />
                      <Text variant={TextVariant.bodySmMedium}>{t('twoFASendAction')}</Text>
                    </Box>
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Row}
                      alignItems={AlignItems.center}
                      gap={3}
                      className="px-4 py-3 cursor-pointer hover:bg-background-default-hover"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); setTwoFAMenuOpen(false); navigate(MANAGE_2FA_ROUTE); }}
                    >
                      <Icon name={IconName.Setting} color={IconColor.IconDefault} size={IconSize.Sm} />
                      <Text variant={TextVariant.bodySmMedium}>{t('twoFAManageWallet')}</Text>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </div>
      <Footer className="shadow-sm">
        <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2} width={BlockSize.Full}>
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
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={() => setTwoFAOptionsOpen(true)}
            data-testid="account-list-add-2fa-wallet-button"
          >
            <Box gap={2} display={Display.Flex} alignItems={AlignItems.center} justifyContent={JustifyContent.center} width={BlockSize.Full}>
              <Text variant={TextVariant.bodyMdMedium}>{t('add2FAWallet')}</Text>
              <Box className="rounded px-1.5 py-0.5 bg-primary-default">
                <Text variant={TextVariant.bodyXs} fontWeight={FontWeight.Bold} color={TextColor.primaryInverse} className="text-[10px]">
                  New
                </Text>
              </Box>
            </Box>
          </Button>
        </Box>
      </Footer>
      <AddWalletModal
        isOpen={isAddWalletModalOpen}
        onClose={handleCloseAddWalletModal}
      />
      {twoFAOptionsOpen && (
        <Box
          display={Display.Flex}
          className="fixed inset-0 z-[100] flex-col justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setTwoFAOptionsOpen(false)}
        >
          <Box
            backgroundColor={BackgroundColor.backgroundDefault}
            className="rounded-t-2xl"
            padding={4}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Box display={Display.Flex} justifyContent={JustifyContent.center} className="mb-3">
              <Box className="w-9 h-1 rounded-full" style={{ backgroundColor: 'var(--color-border-default)' }} />
            </Box>
            <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Bold} className="mb-4">
              {t('add2FAWallet')}
            </Text>
            <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
              {[
                { icon: IconName.Add, titleKey: 'twoFAOptionsCreate', descKey: 'twoFAOptionsCreateDesc', route: SETUP_2FA_ROUTE },
                { icon: IconName.QrCode, titleKey: 'twoFAOptionsLink', descKey: 'twoFAOptionsLinkDesc', route: LINK_2FA_ROUTE },
                { icon: IconName.Refresh, titleKey: 'twoFAOptionsRecover', descKey: 'twoFAOptionsRecoverDesc', route: RECOVER_2FA_ROUTE },
              ].map((option) => (
                <Box
                  key={option.titleKey}
                  display={Display.Flex}
                  flexDirection={FlexDirection.Row}
                  alignItems={AlignItems.center}
                  gap={3}
                  padding={3}
                  className="rounded-xl cursor-pointer hover:bg-background-default-hover"
                  onClick={() => { setTwoFAOptionsOpen(false); navigate(option.route); }}
                >
                  <Box
                    className="rounded-full p-2 shrink-0"
                    style={{ backgroundColor: 'var(--color-background-muted)' }}
                  >
                    <Icon name={option.icon} color={IconColor.IconDefault} size={IconSize.Sm} />
                  </Box>
                  <Box display={Display.Flex} flexDirection={FlexDirection.Column} className="flex-1 min-w-0">
                    <Text variant={TextVariant.bodyMdMedium}>{t(option.titleKey)}</Text>
                    <Text variant={TextVariant.bodyXs} color={TextColor.textAlternative}>{t(option.descKey)}</Text>
                  </Box>
                  <Icon name={IconName.ArrowRight} color={IconColor.IconMuted} size={IconSize.Sm} />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Page>
  );
};
