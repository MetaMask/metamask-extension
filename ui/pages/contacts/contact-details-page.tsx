import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { ButtonIcon, ButtonIconSize } from '../../components/component-library';
import { IconName } from '../../components/component-library';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  CONTACTS_ROUTE,
  CONTACTS_EDIT_ROUTE,
} from '../../helpers/constants/routes';
import { ViewContactContent } from './components/view-contact-content';
import { getAddressBookEntry, getInternalAccountByAddress } from '../../selectors';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';

export function ContactDetailsPage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { address } = useParams<{ address: string }>();
  const contact = useSelector((state) =>
    address ? getAddressBookEntry(state, address) : null,
  );
  const internalAccount = useSelector((state) =>
    address ? getInternalAccountByAddress(state, address) : null,
  );

  const handleBack = () => {
    navigate(CONTACTS_ROUTE);
  };

  if (!address) {
    return <Navigate to={CONTACTS_ROUTE} replace />;
  }

  if (!contact) {
    return <Navigate to={CONTACTS_ROUTE} replace />;
  }

  const name =
    contact.name ?? internalAccount?.metadata?.name ?? '';
  const memo = contact.memo ?? '';
  const checkSummedAddress = toChecksumHexAddress(address);

  return (
    <Page data-testid="contact-details-page">
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onClick={handleBack}
            data-testid="contact-details-back-button"
          />
        }
        marginBottom={0}
      >
        {t('viewContact')}
      </Header>
      <Content padding={0}>
        <ViewContactContent
          name={name}
          address={address}
          checkSummedAddress={checkSummedAddress}
          memo={memo}
          onEdit={() => navigate(`${CONTACTS_EDIT_ROUTE}/${address}`)}
        />
      </Content>
    </Page>
  );
}
