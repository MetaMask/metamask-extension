import React, { useState, useCallback } from 'react';

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
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { TextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MultichainAddressRowsList } from '../../../components/multichain-accounts/multichain-address-rows-list';
import { getMultichainAccountGroupById } from '../../../selectors/multichain-accounts/account-tree';
import { AddressQRCodeModal } from '../../../components/multichain-accounts/address-qr-code-modal/address-qr-code-modal';
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
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedQRData, setSelectedQRData] = useState<{
    address: string;
    networkName: string;
    networkImageSrc?: string;
  } | null>(null);

  // QR Modal handlers
  const handleShowQR = useCallback(
    (address: string, networkName: string, networkImageSrc?: string) => {
      setSelectedQRData({ address, networkName, networkImageSrc });
      setIsQRModalOpen(true);
    },
    [],
  );

  const handleCloseQR = useCallback(() => {
    setIsQRModalOpen(false);
    setSelectedQRData(null);
  }, []);

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
          {decodedAccountGroupId ? (
            <MultichainAddressRowsList
              groupId={decodedAccountGroupId}
              onQrClick={handleShowQR}
            />
          ) : null}
        </Box>
      </Content>

      {/* QR Code Modal */}
      {selectedQRData && (
        <AddressQRCodeModal
          isOpen={isQRModalOpen}
          onClose={handleCloseQR}
          address={selectedQRData.address}
          accountName={accountGroup?.metadata?.name || t('account')}
          networkName={selectedQRData.networkName}
          networkImageSrc={selectedQRData.networkImageSrc}
        />
      )}
    </Page>
  );
};
