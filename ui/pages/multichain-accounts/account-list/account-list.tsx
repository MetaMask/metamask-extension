import React, { useCallback, useMemo, useState } from 'react';

import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
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
import { getAccountTree } from '../../../selectors/multichain-accounts/account-tree';
import { useAllWalletAccountsBalances } from '../../../hooks/multichain-accounts/useAccountBalance';
import { AddWalletModal } from '../../../components/multichain-accounts/add-wallet-modal';
import {
  TextFieldSearch,
  TextFieldSearchSize,
  Text,
  Box,
} from '../../../components/component-library';
import { filterWalletsByGroupName } from './utils';

export const AccountList = () => {
  const t = useI18nContext();
  const history = useHistory();
  const accountTree = useSelector(getAccountTree);
  const { wallets } = accountTree;
  const { selectedAccountGroup } = accountTree;
  const formattedAccountGroupBalancesByWallet = useAllWalletAccountsBalances();
  const [searchPattern, setSearchPattern] = useState<string>('');

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
    return filterWalletsByGroupName(wallets, searchPattern);
  }, [wallets, searchPattern]);

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
            onClick={() => history.goBack()}
          />
        }
      >
        {t('accounts')}
      </Header>
      <Content className="account-list-page__content">
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
        >
          {hasFilteredWallets ? (
            <MultichainAccountList
              wallets={filteredWallets}
              selectedAccountGroups={[selectedAccountGroup]}
              isInSearchMode={Boolean(searchPattern)}
              displayWalletHeader={hasMultipleWallets}
              formattedAccountGroupBalancesByWallet={
                formattedAccountGroupBalancesByWallet
              }
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
          isFullWidth
        >
          {t('addWallet')}
        </Button>
      </Footer>
      <AddWalletModal
        isOpen={isAddWalletModalOpen}
        onClose={handleCloseAddWalletModal}
      />
    </Page>
  );
};
