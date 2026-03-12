import React from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  CONTACTS_ROUTE,
  CONTACTS_VIEW_ROUTE,
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
} from '../../helpers/constants/routes';
import {
  getAddressBookEntry,
  getInternalAccountByAddress,
} from '../../selectors';
import { getProviderConfig } from '../../../shared/lib/selectors/networks';
import { EditContactForm } from './components/edit-contact-form';

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
    navigate(PREVIOUS_ROUTE);
  };

  const handleClose = () => {
    navigate(DEFAULT_ROUTE);
  };

  if (!address) {
    return <Navigate to={CONTACTS_ROUTE} replace />;
  }

  const name = contact?.name ?? internalAccount?.metadata?.name ?? '';
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
        endAccessory={
          <ButtonIcon
            ariaLabel={t('close')}
            iconName={IconName.Close}
            size={ButtonIconSize.Md}
            onClick={handleClose}
            data-testid="edit-contact-close-button"
          />
        }
        marginBottom={0}
      >
        {t('editContact')}
      </Header>
      <Content padding={0}>
        <EditContactForm
          address={address}
          initialName={name}
          initialMemo={memo}
          contactChainId={contactChainId}
          onCancel={() => navigate(`${CONTACTS_VIEW_ROUTE}/${address}`)}
          onSuccess={() =>
            navigate(CONTACTS_ROUTE, {
              state: { showContactUpdatedToast: true },
            })
          }
        />
      </Content>
    </Page>
  );
}
