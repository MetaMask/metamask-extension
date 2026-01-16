import React, { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonVariant,
  Box,
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
import { createMpcWallet } from '../../../store/controller-actions/mpc-controller';
import { useDispatch } from 'react-redux';
import { MetaMaskReduxDispatch } from '../../../store/store';

export const AddMpcWalletPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  const handleContinue = useCallback(async () => {
    await dispatch(createMpcWallet());
  }, [navigate]);

  const handleClose = useCallback(async () => {
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
        <Box marginBottom={4}>
          <Text variant={TextVariant.BodyLg}>
            {t('mpcWalletDescription')}
          </Text>
        </Box>
        <Button
            variant={ButtonVariant.Primary}
            onClick={handleContinue}
            style={{ width: '100%' }}
        >
            {t('continue')}
        </Button>
      </Content>
    </Page>
  );
};
