import React, { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Text,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonSize,
  ButtonVariant,
  Button,
  FontWeight,
  TextVariant,
  TextColor,
  IconName,
  IconSize,
  Icon,
  IconColor,
} from '@metamask/design-system-react';
import {
  FormTextField,
  FormTextFieldSize,
  TextFieldType,
} from '../../../components/component-library';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  startPasskeyRegistration,
  cancelPasskeyCeremony,
} from '../../../../shared/lib/passkey';
import {
  protectVaultKeyWithPasskey,
  generatePasskeyRegistrationOptions,
  forceUpdateMetamaskState,
  verifyPassword,
} from '../../../store/actions';
import { toast, ToastContent } from '../../../components/ui/toast/toast';
import { SECOND } from '../../../../shared/constants/time';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

const passkeySettingsToastDurationMs = 5 * SECOND;

const PasskeyRegisterSteps = {
  VerifyPassword: 1,
  RegisterPasskey: 2,
} as const;

export default function PasskeyRegisterSubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const [step, setStep] = useState<
    (typeof PasskeyRegisterSteps)[keyof typeof PasskeyRegisterSteps]
  >(PasskeyRegisterSteps.VerifyPassword);
  const [walletPassword, setWalletPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);

  const fromChangePassword =
    new URLSearchParams(location.search).get('from') === 'change-password';

  useEffect(
    () => () => {
      cancelPasskeyCeremony();
    },
    [],
  );

  const goToSettings = () => {
    setWalletPassword('');
    navigate(SECURITY_AND_PASSWORD_ROUTE, { replace: true });
  };

  const handleSubmitCurrentPassword = async () => {
    setIsVerifyingPassword(true);
    setIsIncorrectPasswordError(false);
    try {
      await verifyPassword(walletPassword);
      setStep(PasskeyRegisterSteps.RegisterPasskey);
    } catch {
      setIsIncorrectPasswordError(true);
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setIsRegisteringPasskey(true);
    try {
      const options = await generatePasskeyRegistrationOptions();
      const registrationResponse = await startPasskeyRegistration(options);
      await protectVaultKeyWithPasskey(registrationResponse, walletPassword);
      setWalletPassword('');
      await forceUpdateMetamaskState(dispatch);
      toast.success(<ToastContent title={t('passkeyTurnedOn')} />, {
        duration: passkeySettingsToastDurationMs,
      });
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          passkey_registered: true,
        },
      });
      goToSettings();
    } catch {
      // User cancelled or authenticator unavailable — stay on this screen
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Start}
      alignItems={BoxAlignItems.Stretch}
      gap={6}
      padding={4}
      className="h-full min-h-0"
    >
      {fromChangePassword && (
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
          padding={3}
          className="shrink-0 rounded-lg"
          style={{ backgroundColor: 'var(--color-success-muted)' }}
          data-testid="register-passkey-password-changed-banner"
        >
          <Icon
            name={IconName.Confirmation}
            size={IconSize.Sm}
            color={IconColor.SuccessDefault}
          />
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
          >
            {t('passwordChangedRecently')}
          </Text>
        </Box>
      )}

      {/* Verify Password Step */}
      {step === PasskeyRegisterSteps.VerifyPassword && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={6}
          justifyContent={BoxJustifyContent.Between}
          asChild
          className="min-h-0 shrink-0"
        >
          <form
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              handleSubmitCurrentPassword();
            }}
          >
            <FormTextField
              id="register-passkey-current-password"
              label={t('enterPasswordCurrent')}
              textFieldProps={{ type: TextFieldType.Password }}
              size={FormTextFieldSize.Lg}
              labelProps={{
                marginBottom: 1,
              }}
              inputProps={{
                autoFocus: true,
                'data-testid': 'register-passkey-password-input',
              }}
              value={walletPassword}
              error={isIncorrectPasswordError}
              helpText={
                isIncorrectPasswordError
                  ? t('unlockPageIncorrectPassword')
                  : null
              }
              onChange={(e) => {
                setWalletPassword(e.target.value);
                setIsIncorrectPasswordError(false);
              }}
            />
            <Button
              type="submit"
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              className="w-full"
              data-testid="register-passkey-verify-continue-button"
              disabled={
                !walletPassword ||
                isVerifyingPassword ||
                isIncorrectPasswordError
              }
              isLoading={isVerifyingPassword}
            >
              {t('continue')}
            </Button>
          </form>
        </Box>
      )}

      {/* Register Passkey Step */}
      {step === PasskeyRegisterSteps.RegisterPasskey && (
        <>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid="register-passkey-description"
          >
            {t('passkeyDescription')}
          </Text>

          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full shrink-0"
            data-testid="register-passkey-set-up-button"
            disabled={isRegisteringPasskey}
            isLoading={isRegisteringPasskey}
            aria-label={t('setUpPasskey')}
            onClick={() => {
              handleRegisterPasskey();
            }}
          >
            {t('setUpPasskey')}
          </Button>
        </>
      )}
    </Box>
  );
}
