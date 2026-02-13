import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AccountWalletId } from '@metamask/account-api';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getWallet } from '../../../selectors/multichain-accounts/account-tree';
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';

export const MpcWalletManagementPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { id } = useParams();

  const walletId = decodeURIComponent(id ?? '') as AccountWalletId;
  const wallet = useSelector((state) => getWallet(state, walletId));

  useEffect(() => {
    if (!wallet) {
      navigate(ACCOUNT_LIST_PAGE_ROUTE);
    }
  }, [wallet, navigate]);

  return (
    <Page className="mpc-wallet-management-page">
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
            data-testid="back-button"
          />
        }
      >
        {wallet?.metadata.name ?? t('manageMpcWallet')}
      </Header>
      <Content paddingTop={3} gap={4}>
        {/* Placeholder — MPC wallet management content will go here */}
      </Content>
    </Page>
  );
};
