import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  createNewVaultAndRestore,
  resetOAuthLoginState,
  resetWallet,
  setFirstTimeFlowType,
  unMarkPasswordForgotten,
} from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
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
  ButtonVariant,
  BoxAlignItems,
  ButtonSize
} from '@metamask/design-system-react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { getIsSocialLoginFlow } from '../../selectors';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import SrpInputForm from '../srp-input-form';
import { CreatePasswordForm } from '../create-password-form';
import { useI18nContext } from '../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../contexts/metametrics';

function RestoreVaultPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const { trackEvent } = React.useContext(MetaMetricsContext);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);

  const [srpError, setSrpError] = useState('');
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const [toggleSrpDetailsModal, setToggleSrpDetailsModal] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
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

        navigate(DEFAULT_ROUTE, { replace: true });
      } catch (error) {
        setLoading(false);
        setShowPasswordInput(false);
        console.error('[RestoreVault] Error during import:', error);
      }
    },
    [
      isSocialLoginFlow,
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

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      // height={BlockSize.Full}
      gap={4}
      className="import-srp-restore-vault"
      data-testid="import-srp-restore-vault"
      // borderRadius={BorderRadius.LG}
      borderColor={BoxBorderColor.BorderMuted}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
    >
      {shouldShowPasswordForm ? (
        <CreatePasswordForm
          isSocialLoginFlow={false}
          onSubmit={handleImport}
          onBack={handleBack}
          loading={loading}
        />
      ) : (
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
            <Box
              // textAlign={TextAlign.Left}
              marginBottom={2}>
              <Text variant={TextVariant.HeadingLg}>
                {t('importAWallet')}
              </Text>
            </Box>
            <Box
              marginBottom={4}>
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('restoreWalletDescription', [
                  <Button
                    key="secret-recovery-phrase"
                    variant={ButtonVariant.Tertiary}
                    onClick={() => setToggleSrpDetailsModal(true)}
                  >
                    {t('secretRecoveryPhrase')}
                  </Button>,
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
          // width={BlockSize.Full}
          // textAlign={TextAlign.Left}
          >
            <Button
              // width={BlockSize.Full}
              size={ButtonSize.Lg}
              data-testid="import-srp-confirm"
              onClick={handleContinue}
              disabled={
                !secretRecoveryPhrase.trim() || Boolean(srpError)
              }
              className="import-srp__continue-button"
            >
              {t('continue')}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export default RestoreVaultPage;
