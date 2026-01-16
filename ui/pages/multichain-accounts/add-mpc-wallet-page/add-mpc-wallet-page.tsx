import React, { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonVariant,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { TextVariant as LegacyTextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ACCOUNT_LIST_PAGE_ROUTE, DEFAULT_ROUTE } from '../../../helpers/constants/routes';

export const AddMpcWalletPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const handleBack = useCallback(() => {
     navigate(ACCOUNT_LIST_PAGE_ROUTE);
  }, [navigate]);

  return (
    <Page>
      <Header
        textProps={{
          variant: LegacyTextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={handleBack}
            data-testid="add-mpc-wallet-page-back-button"
          />
        }
        endAccessory={
            <ButtonIcon
              size={ButtonIconSize.Md}
              ariaLabel={t('close')}
              iconName={IconName.Close}
              onClick={handleClose}
              data-testid="add-mpc-wallet-page-close-button"
            />
          }
      >
        {t('addMpcWallet')}
      </Header>
      <Content>
        <Text variant={TextVariant.BodyLg} marginBottom={4}>
            {t('mpcWalletDescription')}
        </Text>
        <Button
            variant={ButtonVariant.Primary}
            onClick={handleClose}
            width="100%"
        >
            {t('close')}
        </Button>
      </Content>
    </Page>
  );
};
