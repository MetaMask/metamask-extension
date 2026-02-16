import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
  TextField,
  TextFieldType,
} from '../../../components/component-library';
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../helpers/constants/routes';
import { joinMpcWallet } from '../../../store/controller-actions/mpc-controller';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import {
  createPasskey,
  signWithPasskey,
} from '../../../../shared/lib/passkeys';

export const JoinMpcWalletPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  const [joinData, setJoinData] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinWallet = useCallback(async () => {
    if (!joinData.trim()) {
      return;
    }
    setIsJoining(true);
    setError(null);
    try {
      // 1. Create a new passkey — the public key becomes the verifier ID
      const { credentialId, publicKey } = await createPasskey();

      // 2. Sign an assertion to use as the verifier token
      const assertion = await signWithPasskey(credentialId);
      const verifierToken = JSON.stringify(assertion);

      // Persist the credential ID for future assertion requests
      localStorage.setItem(`mpc-passkey:${publicKey}`, credentialId);

      // 3. Join with passkey-based verification
      await dispatch(joinMpcWallet(publicKey, joinData.trim(), verifierToken));
      navigate(DEFAULT_ROUTE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to join MPC wallet',
      );
      setIsJoining(false);
    }
  }, [dispatch, joinData, navigate]);

  return (
    <Page className="join-mpc-wallet-page">
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
            data-testid="back-button"
          />
        }
      >
        {t('joinMpcWallet')}
      </Header>
      <Content paddingTop={3}>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={3}
        >
          <Text variant={TextVariant.bodyMd} color={TextColor.textDefault}>
            {t('joinMpcWalletDescription')}
          </Text>

          {error && (
            <Text variant={TextVariant.bodySm} color={TextColor.errorDefault}>
              {error}
            </Text>
          )}

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
          >
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.textDefault}
            >
              {t('joinDataLabel')}
            </Text>
            <TextField
              type={TextFieldType.Text}
              placeholder={t('enterJoinData')}
              value={joinData}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setJoinData(e.target.value)
              }
              data-testid="join-data-input"
            />
            <Button
              size={ButtonSize.Md}
              variant={ButtonVariant.Primary}
              onClick={handleJoinWallet}
              disabled={isJoining || !joinData.trim()}
              data-testid="join-wallet-button"
              block
            >
              {isJoining ? t('joiningMpcWallet') : t('joinMpcWallet')}
            </Button>
          </Box>
        </Box>
      </Content>
    </Page>
  );
};
