import React, { useState, useCallback, useEffect } from 'react';

import {
  useNavigate,
  useLocation,
  useParams,
} from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import { CaipChainId } from '@metamask/utils';
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
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import {
  AddressListQueryParams,
  AddressListSource,
} from './multichain-account-address-list-page.types';

type MultichainAccountAddressListPageProps = {
  params?: { accountGroupId: string };
  location?: {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
    key: string;
  };
};

export const MultichainAccountAddressListPage = ({
  params: propsParams,
  location: propsLocation,
}: MultichainAccountAddressListPageProps = {}) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const hookLocation = useLocation();
  const hookParams = useParams<{ accountGroupId: string }>();

  const location = propsLocation || hookLocation;
  const { accountGroupId } = propsParams || hookParams;

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
    chainId: CaipChainId;
    networkImageSrc?: string;
  } | null>(null);

  // QR Modal handlers
  const handleShowQR = useCallback(
    (
      address: string,
      networkName: string,
      chainId: CaipChainId,
      networkImageSrc?: string,
    ) => {
      setSelectedQRData({ address, networkName, chainId, networkImageSrc });
      setIsQRModalOpen(true);
    },
    [],
  );

  const handleCloseQR = useCallback(() => {
    setIsQRModalOpen(false);
    setSelectedQRData(null);
  }, []);

  useEffect(() => {
    endTrace({ name: TraceName.ShowAccountAddressList });
  }, []);

  return (
    <Page>
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
            data-testid="multichain-account-address-list-page-back-button"
          />
        }
      >
        {pageTitle}
      </Header>
      <Content padding={0}>
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
          chainId={selectedQRData.chainId}
          networkImageSrc={selectedQRData.networkImageSrc}
        />
      )}
    </Page>
  );
};
