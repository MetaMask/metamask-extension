import React, { useState } from 'react';

import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Box,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '@metamask/design-system-react';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAccountList } from '../../../components/multichain-accounts/multichain-account-list';
import { getAccountTree } from '../../../selectors/multichain-accounts/account-tree';
import { AddWalletModal } from '../../../components/multichain-accounts/add-wallet-modal';

export const AccountList = () => {
  const t = useI18nContext();
  const history = useHistory();
  const accountTree = useSelector(getAccountTree);
  const { wallets } = accountTree;
  const { selectedAccountGroup } = accountTree;

  const [isAddWalletModalOpen, setIsAddWalletModalOpen] = useState(false);

  const handleOpenAddWalletModal = () => {
    setIsAddWalletModalOpen(true);
  };

  const handleCloseAddWalletModal = () => {
    setIsAddWalletModalOpen(false);
  };

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
        <Box flexDirection={BoxFlexDirection.Column}>
          <MultichainAccountList
            wallets={wallets}
            selectedAccountGroups={[selectedAccountGroup]}
          />
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
