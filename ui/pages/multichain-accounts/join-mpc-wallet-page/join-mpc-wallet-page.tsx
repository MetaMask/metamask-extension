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
  BackgroundColor,
  BorderRadius,
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
import {
  setupMpcIdentity,
  joinMpcWallet,
} from '../../../store/controller-actions/mpc-controller';
import type { MetaMaskReduxDispatch } from '../../../store/store';

export const JoinMpcWalletPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  const [keyringId, setKeyringId] = useState<string | null>(null);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [peerCustodianId, setPeerCustodianId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateIdentity = useCallback(async () => {
    setIsSettingUp(true);
    setError(null);
    try {
      const result = await dispatch(setupMpcIdentity());
      setKeyringId(result.keyringId);
      setPartyId(result.partyId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create identity',
      );
    } finally {
      setIsSettingUp(false);
    }
  }, [dispatch]);

  const handleJoinWallet = useCallback(async () => {
    if (!keyringId || !peerCustodianId.trim()) {
      return;
    }
    setIsJoining(true);
    setError(null);
    try {
      await dispatch(
        joinMpcWallet(keyringId, 'verifier', peerCustodianId.trim()),
      );
      navigate(DEFAULT_ROUTE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to join MPC wallet',
      );
      setIsJoining(false);
    }
  }, [dispatch, keyringId, peerCustodianId, navigate]);

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
          {!partyId ? (
            <>
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textDefault}
              >
                {t('joinMpcWalletDescription')}
              </Text>
              {error && (
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.errorDefault}
                >
                  {error}
                </Text>
              )}
              <Button
                size={ButtonSize.Md}
                variant={ButtonVariant.Primary}
                onClick={handleCreateIdentity}
                disabled={isSettingUp}
                data-testid="create-identity-button"
                block
              >
                {isSettingUp
                  ? t('creatingIdentity')
                  : t('createDeviceIdentity')}
              </Button>
            </>
          ) : (
            <>
              <Text
                variant={TextVariant.bodyMdMedium}
                color={TextColor.textDefault}
              >
                {t('yourDeviceIdentity')}
              </Text>
              <Box
                backgroundColor={BackgroundColor.backgroundMuted}
                borderRadius={BorderRadius.LG}
                padding={4}
              >
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textDefault}
                  style={{ wordBreak: 'break-all' }}
                >
                  {partyId}
                </Text>
              </Box>
              <Text
                variant={TextVariant.bodySm}
                color={TextColor.textAlternative}
              >
                {t('shareIdentityWithInitiator')}
              </Text>

              {error && (
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.errorDefault}
                >
                  {error}
                </Text>
              )}

              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                gap={2}
                marginTop={2}
              >
                <Text
                  variant={TextVariant.bodyMdMedium}
                  color={TextColor.textDefault}
                >
                  {t('peerCustodian')}
                </Text>
                <TextField
                  type={TextFieldType.Text}
                  placeholder={t('enterPeerCustodianId')}
                  value={peerCustodianId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPeerCustodianId(e.target.value)
                  }
                  data-testid="peer-custodian-input"
                />
                <Button
                  size={ButtonSize.Md}
                  variant={ButtonVariant.Primary}
                  onClick={handleJoinWallet}
                  disabled={isJoining || !peerCustodianId.trim()}
                  data-testid="join-wallet-button"
                  block
                >
                  {isJoining ? t('joiningMpcWallet') : t('joinMpcWallet')}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Content>
    </Page>
  );
};
