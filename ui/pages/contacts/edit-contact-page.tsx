import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { Box, ButtonIcon, ButtonIconSize } from '../../components/component-library';
import { IconName } from '../../components/component-library';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../helpers/constants/design-system';
import {
  CONTACTS_ROUTE,
  CONTACTS_VIEW_ROUTE,
} from '../../helpers/constants/routes';
import { EditContactForm } from './components/edit-contact-form';
import {
  getAddressBookEntry,
  getInternalAccountByAddress,
} from '../../selectors';
import { getProviderConfig } from '../../../shared/modules/selectors/networks';

export function EditContactPage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { address } = useParams<{ address: string }>();
  const contact = useSelector((state) =>
    address ? getAddressBookEntry(state, address) : null,
  );
  const providerConfig = useSelector(getProviderConfig);
  const internalAccount = useSelector((state) =>
    address ? getInternalAccountByAddress(state, address) : null,
  );

  const handleBack = () => {
    navigate(CONTACTS_ROUTE);
  };

  if (!address) {
    return <Navigate to={CONTACTS_ROUTE} replace />;
  }

  const name =
    contact?.name ?? internalAccount?.metadata?.name ?? '';
  const memo = contact?.memo ?? '';
  const contactChainId = contact?.chainId ?? providerConfig.chainId;

  if (!contact) {
    return <Navigate to={CONTACTS_ROUTE} replace />;
  }

  return (
    <Page data-testid="edit-contact-page">
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onClick={handleBack}
            data-testid="edit-contact-back-button"
          />
        }
        marginBottom={0}
      >
        {t('editContact')}
      </Header>
      <Content padding={0}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          width={BlockSize.Full}
          style={{ flex: 1, minHeight: 0 }}
        >
          <EditContactForm
          address={address}
          initialName={name}
          initialMemo={memo}
          contactChainId={contactChainId}
          onCancel={() => navigate(`${CONTACTS_VIEW_ROUTE}/${address}`)}
          onSuccess={() => navigate(CONTACTS_ROUTE)}
          onDelete={() => navigate(CONTACTS_ROUTE)}
        />
        </Box>
      </Content>
    </Page>
  );
}
