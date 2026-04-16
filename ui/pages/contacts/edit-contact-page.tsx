import React from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import type { Hex } from '@metamask/utils';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  CONTACTS_ROUTE,
  CONTACTS_VIEW_ROUTE,
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
} from '../../helpers/constants/routes';
import { getInternalAccountByAddress } from '../../selectors';
import { getAddressBookEntryByNetwork } from '../../selectors/snaps/address-book';
import { EditContactForm } from './components/edit-contact-form';

export function EditContactPage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { chainId, address } = useParams<{
    chainId: string;
    address: string;
  }>();
  const contact = useSelector((state) =>
    address && chainId
      ? getAddressBookEntryByNetwork(state, address, chainId as `0x${string}`)
      : null,
  );
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
  const contactChainId = contact?.chainId ?? (chainId as Hex);

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
          onCancel={() =>
            navigate(`${CONTACTS_VIEW_ROUTE}/${chainId}/${address}`)
          }
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
