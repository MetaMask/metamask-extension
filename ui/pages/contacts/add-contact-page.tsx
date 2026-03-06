import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { useI18nContext } from '../../hooks/useI18nContext';
import { CONTACTS_ROUTE, DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { AddContactForm } from './components/add-contact-form';

export function AddContactPage() {
  const t = useI18nContext();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(CONTACTS_ROUTE);
  };

  const handleClose = () => {
    navigate(DEFAULT_ROUTE);
  };

  return (
    <Page data-testid="add-contact-page">
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onClick={handleBack}
            data-testid="add-contact-back-button"
          />
        }
        endAccessory={
          <ButtonIcon
            ariaLabel={t('close')}
            iconName={IconName.Close}
            size={ButtonIconSize.Md}
            onClick={handleClose}
            data-testid="add-contact-close-button"
          />
        }
        marginBottom={0}
      >
        {t('addContact')}
      </Header>
      <Content padding={0}>
        <Box className="flex flex-1 min-h-0 w-full flex-col">
          <AddContactForm
            onCancel={handleBack}
            onSuccess={() => navigate(CONTACTS_ROUTE)}
          />
        </Box>
      </Content>
    </Page>
  );
}
