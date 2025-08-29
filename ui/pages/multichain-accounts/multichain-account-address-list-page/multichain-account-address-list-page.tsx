import React, { useState } from 'react';

import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { AccountGroupId } from '@metamask/account-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { TextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAddressRowsList } from '../../../components/multichain-accounts/multichain-address-rows-list';
import { AddressQRCodeModal } from '../../../components/multichain-accounts/address-qr-code-modal';
import {
  getInternalAccountsFromGroupById,
  getMultichainAccountGroupById,
} from '../../../selectors/multichain-accounts/account-tree';
import {
  AddressListQueryParams,
  AddressListSource,
} from './multichain-account-address-list-page.types';

export const MultichainAccountAddressListPage = () => {
  const t = useI18nContext();
  const history = useHistory();
  const location = useLocation();
  const { accountGroupId } = useParams<{ accountGroupId: string }>();

  const decodedAccountGroupId = accountGroupId
    ? (decodeURIComponent(accountGroupId) as AccountGroupId)
    : null;

  const accounts = useSelector((state) =>
    decodedAccountGroupId
      ? getInternalAccountsFromGroupById(state, decodedAccountGroupId)
      : [],
  );

  const accountGroup = useSelector((state) =>
    decodedAccountGroupId
      ? getMultichainAccountGroupById(state, decodedAccountGroupId)
      : null,
  );

  const searchParams = new URLSearchParams(location.search);
  const isReceiveMode =
    searchParams.get(AddressListQueryParams.Source) ===
    AddressListSource.Receive;

  const pageTitle = isReceiveMode
    ? t('receivingAddress')
    : `${accountGroup?.metadata?.name || t('account')} / ${t('addresses')}`;

  // QR Modal state
  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    address?: string;
    chainId?: string;
    account?: InternalAccount;
    accountGroupName?: string;
  }>({ isOpen: false });

  const handleQrClick = (
    address: string,
    chainId: string,
    account: InternalAccount,
  ) => {
    setQrModal({
      isOpen: true,
      address,
      chainId,
      account,
      accountGroupName: accountGroup?.metadata?.name,
    });
  };

  const handleQrModalClose = () => {
    setQrModal({ isOpen: false });
  };

  // Account is now passed directly from the callback

  return (
    <Page className="max-w-[600px]">
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
            data-testid="multichain-account-address-list-page-back-button"
          />
        }
      >
        {pageTitle}
      </Header>
      <Content>
        <Box flexDirection={BoxFlexDirection.Column}>
          <MultichainAddressRowsList
            accounts={accounts}
            onQrClick={handleQrClick}
          />
        </Box>
        {qrModal.isOpen && qrModal.address && qrModal.chainId && (
          <AddressQRCodeModal
            isOpen={qrModal.isOpen}
            onClose={handleQrModalClose}
            address={qrModal.address}
            chainId={qrModal.chainId}
            account={qrModal.account}
            accountGroupName={qrModal.accountGroupName}
          />
        )}
      </Content>
    </Page>
  );
};
