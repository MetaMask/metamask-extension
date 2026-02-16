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
import { useDispatch } from 'react-redux';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import { TextVariant as LegacyTextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ACCOUNT_LIST_PAGE_ROUTE,
  DEFAULT_ROUTE,
  JOIN_MPC_WALLET_ROUTE,
} from '../../../helpers/constants/routes';
import { createMpcKeyring } from '../../../store/controller-actions/mpc-controller';
import { MetaMaskReduxDispatch } from '../../../store/store';
import {
  createPasskey,
  signWithPasskey,
} from '../../../../shared/lib/passkeys';

export const AddMpcWalletPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  const handleCreate = useCallback(async () => {
    // 1. Create a new passkey — the public key becomes the verifier ID
    const { credentialId, publicKey } = await createPasskey();

    // 2. Immediately sign an assertion to use as the initial verifier token
    const assertion = await signWithPasskey(credentialId);
    const verifierToken = JSON.stringify(assertion);

    // Persist the credential ID so future operations can create fresh assertions
    localStorage.setItem(`mpc-passkey:${publicKey}`, credentialId);

    // 3. Create the MPC keyring with passkey-based verification
    await dispatch(createMpcKeyring(publicKey, verifierToken));
    navigate(DEFAULT_ROUTE);
  }, [dispatch, navigate]);

  const handleJoin = useCallback(() => {
    navigate(JOIN_MPC_WALLET_ROUTE);
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
          <Text variant={TextVariant.BodyLg}>{t('mpcWalletDescription')}</Text>
        </Box>
        <Button
          variant={ButtonVariant.Primary}
          onClick={handleCreate}
          style={{ width: '100%' }}
        >
          {t('createMpcWallet')}
        </Button>
        <Box marginTop={3}>
          <Button
            variant={ButtonVariant.Secondary}
            onClick={handleJoin}
            style={{ width: '100%' }}
          >
            {t('joinMpcWallet')}
          </Button>
        </Box>
      </Content>
    </Page>
  );
};
