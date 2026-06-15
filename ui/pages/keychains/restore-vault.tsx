import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  IconColor,
  Button,
  TextVariant,
  TextColor,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxBorderColor,
  BoxBackgroundColor,
  TextButton,
  BoxAlignItems,
  ButtonSize,
} from '@metamask/design-system-react';
import {
  createNewVaultAndRestore,
  resetOAuthLoginState,
  resetWallet,
  setFirstTimeFlowType,
  unMarkPasswordForgotten,
} from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  getIsPasskeyFeatureAvailable,
  getIsSocialLoginFlow,
} from '../../selectors';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import SetupPasskeyContent from '../../components/app/setup-passkey-content';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import SrpInputForm from '../srp-input-form';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { CreatePasswordForm } from '../create-password-form';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';

function RestoreVaultPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { trackEvent } = React.useContext(MetaMetricsContext);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const isPasskeyFeatureAvailable = useSelector(getIsPasskeyFeatureAvailable);

  const [srpError, setSrpError] = useState('');
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const [toggleSrpDetailsModal, setToggleSrpDetailsModal] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [restorePassword, setRestorePassword] = useState<string | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(false);

  const handleImport = useCallback(
    async (password: string, termsChecked: boolean) => {
      if (!isSocialLoginFlow && !termsChecked) {
        return;
      }

      setLoading(true);

      try {
        if (isSocialLoginFlow) {
          await dispatch(resetOAuthLoginState());
        }

        await dispatch(resetWallet(true));

        await dispatch(setFirstTimeFlowType(FirstTimeFlowType.restore));

        await dispatch(
          createNewVaultAndRestore(password, secretRecoveryPhrase),
        );

        trackEvent({
          category: MetaMetricsEventCategory.Retention,
          event: MetaMetricsEventName.WalletRestored,
        });

        setRestorePassword(password);
        // clear SRP from state after restoring vault is successful
        setSecretRecoveryPhrase('');

        if (isPasskeyFeatureAvailable) {
          setLoading(false);
          setShowPasswordInput(false);
          setShowPasskeySetup(true);
          return;
        }

        navigate(DEFAULT_ROUTE, { replace: true });
      } catch (error) {
        setLoading(false);
        setShowPasswordInput(false);
        console.error('[RestoreVault] Error during import:', error);
      }
    },
    [
      isSocialLoginFlow,
      isPasskeyFeatureAvailable,
      secretRecoveryPhrase,
      dispatch,
      trackEvent,
      navigate,
    ],
  );

  const handleContinue = useCallback(() => {
    setShowPasswordInput(true);
  }, []);

  const handleBack = useCallback(() => {
    if (loading) {
      return;
    }
    setShowPasswordInput(false);
  }, [loading]);

  const handleBackButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dispatch(unMarkPasswordForgotten());
      navigate(DEFAULT_ROUTE, { replace: true });
    },
    [dispatch, navigate],
  );

  const shouldShowPasswordForm = showPasswordInput || loading;

  const handlePasskeySetupComplete = useCallback(() => {
    navigate(DEFAULT_ROUTE, { replace: true });
  }, [navigate]);

  let content;
  if (showPasskeySetup) {
    content = (
      <SetupPasskeyContent
        onNext={handlePasskeySetupComplete}
        password={restorePassword}
      />
    );
  } else if (shouldShowPasswordForm) {
    content = (
      <CreatePasswordForm
        isSocialLoginFlow={false}
        onSubmit={handleImport}
        onBack={handleBack}
        loading={loading}
      />
    );
  } else {
    content = (
      <>
        <Box>
          <Box marginBottom={4}>
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              color={IconColor.IconDefault}
              size={ButtonIconSize.Md}
              data-testid="import-srp-back-button"
              onClick={handleBackButtonClick}
              ariaLabel={t('back')}
            />
          </Box>
          <Box className="text-left" marginBottom={2}>
            <Text variant={TextVariant.HeadingLg}>{t('importAWallet')}</Text>
          </Box>
          <Box marginBottom={4}>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('restoreWalletDescription', [
                <TextButton
                  key="secret-recovery-phrase"
                  onClick={() => setToggleSrpDetailsModal(true)}
                >
                  {t('secretRecoveryPhrase')}
                </TextButton>,
              ])}
            </Text>
          </Box>
          <SrpInputForm
            error={srpError}
            setSecretRecoveryPhrase={setSecretRecoveryPhrase}
            onClearCallback={() => setSrpError('')}
            showDescription={false}
            toggleSrpDetailsModal={toggleSrpDetailsModal}
            onSrpDetailsModalClose={() => setToggleSrpDetailsModal(false)}
          />
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          className="w-full text-left"
        >
          <Button
            size={ButtonSize.Lg}
            data-testid="import-srp-confirm"
            onClick={handleContinue}
            disabled={!secretRecoveryPhrase.trim() || Boolean(srpError)}
            className="import-srp__continue-button w-full"
          >
            {t('continue')}
          </Button>
        </Box>
      </>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      gap={4}
      className="import-srp-restore-vault h-full rounded-lg border border-solid"
      data-testid="import-srp-restore-vault"
      borderColor={BoxBorderColor.BorderMuted}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
    >
      {content}
    </Box>
  );
}

export default RestoreVaultPage;
