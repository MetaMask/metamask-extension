import React, { useCallback, useContext, useEffect, useState } from 'react';
import log from 'loglevel';
import { useDispatch, useSelector } from 'react-redux';
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
  TextVariant,
  TextColor,
  TextAlign,
} from '@metamask/design-system-react';
import {
  FormTextField,
  FormTextFieldSize,
  TextFieldType,
} from '../../../components/component-library';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { createSentryError } from '../../../../shared/lib/error';
import {
  getPasskeyAuthMethodKey,
  startPasskeyRegistration,
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  translatePasskeyError,
  isPasskeyCeremonySilentError,
} from '../../../../shared/lib/passkey';
import { getPasskeyErrorCode } from '../../../../shared/lib/passkey/passkey-error';
import { captureException } from '../../../../shared/lib/sentry';
import {
  protectVaultKeyWithPasskey,
  generatePasskeyRegistrationOptions,
  generatePasskeyPostRegistrationAuthenticationOptions,
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
import {
  getIsPasskeyRegistered,
  getPasskeyDerivationMethod,
} from '../../../selectors';
import {
  PasskeyEnrollmentSteps,
  type PasskeyEnrollmentStepStatus,
} from '../../../components/app/passkey-enrollment-steps';

const PASSKEY_SETTINGS_TOAST_DURATION_MS = 5 * SECOND;

/** Brief pause after verify succeeds so the completion icon is visible before navigation. */
const PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS = 500;

/** Default row status before enrollment starts or after the user silently dismisses WebAuthn. */
const DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS: PasskeyEnrollmentStepStatus =
  'idle';

const PasskeyRegisterSteps = {
  /** Shown when opening from side panel in a full tab so users see context before the password step. */
  Intro: 0,
  VerifyPassword: 1,
  RegisterPasskey: 2,
} as const;

export default function PasskeyRegisterSubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useI18nContext() as (
    key: string,
    substitutions?: string[],
  ) => string;
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());
  const passkeyMethodSpecificLabel = t(
    getPasskeyAuthMethodKey({ specific: true }),
  );
  const { trackEvent } = useContext(MetaMetricsContext);
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);

  const fromSidepanel =
    new URLSearchParams(location.search).get('from') === 'sidepanel';

  const [step, setStep] = useState<
    (typeof PasskeyRegisterSteps)[keyof typeof PasskeyRegisterSteps]
  >(() =>
    fromSidepanel
      ? PasskeyRegisterSteps.Intro
      : PasskeyRegisterSteps.VerifyPassword,
  );
  const [walletPassword, setWalletPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isEnrollmentInProgress, setIsEnrollmentInProgress] = useState(false);
  const [registerStepStatus, setRegisterStepStatus] =
    useState<PasskeyEnrollmentStepStatus>(
      DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS,
    );
  const [verifyStepStatus, setVerifyStepStatus] =
    useState<PasskeyEnrollmentStepStatus>(
      DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS,
    );
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);

  useEffect(
    () => () => {
      cancelPasskeyCeremony();
    },
    [],
  );

  useEffect(() => {
    // Only redirect when a passkey already exists before enrollment UI. During
    // in-flight enrollment, `passkeyRecord` may be set mid-flow; do not redirect from RegisterPasskey.
    if (
      isPasskeyRegistered &&
      (step === PasskeyRegisterSteps.Intro ||
        step === PasskeyRegisterSteps.VerifyPassword)
    ) {
      navigate(SECURITY_AND_PASSWORD_ROUTE, { replace: true });
    }
  }, [isPasskeyRegistered, navigate, step]);

  const goToSettings = useCallback(() => {
    setWalletPassword('');
    navigate(SECURITY_AND_PASSWORD_ROUTE, { replace: true });
  }, [navigate]);

  const beginPasskeyCeremonyFlow = useCallback(async () => {
    setEnrollmentError(null);
    setRegisterStepStatus('loading');
    setVerifyStepStatus(DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS);
    setIsEnrollmentInProgress(true);

    if (isPasskeyRegistered) {
      goToSettings();
      return;
    }

    const enrollmentStartedAt = Date.now();
    let currentStep = 'register';
    trackEvent({
      category: MetaMetricsEventCategory.Settings,
      event: MetaMetricsEventName.PasskeySetup,
      properties: {
        status: 'started',
      },
    });

    let registrationSucceeded = false;

    try {
      const registrationOptions = await generatePasskeyRegistrationOptions();
      const registrationResponse =
        await startPasskeyRegistration(registrationOptions);
      setRegisterStepStatus('success');
      setVerifyStepStatus('loading');
      registrationSucceeded = true;

      currentStep = 'verify';
      const postRegAuthOptions =
        await generatePasskeyPostRegistrationAuthenticationOptions(
          registrationResponse,
        );
      const postRegAuthenticationResponse =
        await startPasskeyAuthentication(postRegAuthOptions);

      currentStep = 'enroll';
      await protectVaultKeyWithPasskey(
        registrationResponse,
        postRegAuthenticationResponse,
        walletPassword,
      );
      const newMetamaskState = await forceUpdateMetamaskState(dispatch);
      setVerifyStepStatus('success');
      setWalletPassword('');

      currentStep = 'complete';
      const derivationMethod = getPasskeyDerivationMethod({
        metamask: newMetamaskState,
      });
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasskeySetup,
        properties: {
          status: 'completed',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          derivation_method: derivationMethod,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          duration_ms: Date.now() - enrollmentStartedAt,
        },
      });

      await new Promise((resolve) => {
        setTimeout(resolve, PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS);
      });
      toast.success(
        <ToastContent title={t('passkeyTurnedOn', [passkeyMethodLabel])} />,
        {
          duration: PASSKEY_SETTINGS_TOAST_DURATION_MS,
        },
      );
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.SettingsUpdated,
        properties: {
          /* eslint-disable @typescript-eslint/naming-convention */
          settings_group: 'security_privacy',
          settings_type: 'passkey',
          old_value: false,
          new_value: true,
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      });
      goToSettings();
    } catch (error) {
      const durationMs = Date.now() - enrollmentStartedAt;
      if (isPasskeyCeremonySilentError(error)) {
        trackEvent({
          category: MetaMetricsEventCategory.Settings,
          event: MetaMetricsEventName.PasskeySetup,
          properties: {
            status: 'cancelled',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            current_step: currentStep,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            duration_ms: durationMs,
          },
        });
        log.debug(
          'Settings passkey enrollment ceremony cancelled or timed out',
          error,
        );
        setRegisterStepStatus(DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS);
        setVerifyStepStatus(DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS);
        return;
      }

      const errorCode = getPasskeyErrorCode(error);
      captureException(
        createSentryError('Passkey registration in settings failed', error),
        {
          extra: { currentStep, durationMs, errorCode },
        },
      );
      trackEvent({
        category: MetaMetricsEventCategory.Settings,
        event: MetaMetricsEventName.PasskeySetup,
        properties: {
          status: 'failed',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_step: currentStep,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          duration_ms: durationMs,
          reason: errorCode,
        },
      });
      setEnrollmentError(
        translatePasskeyError(error, t, passkeyMethodLabel) ??
          (registrationSucceeded
            ? t('passkeyErrorAuthenticationVerificationFailed', [
                passkeyMethodLabel,
              ])
            : t('passkeyErrorRegistrationFailed', [passkeyMethodLabel])),
      );
    } finally {
      setIsEnrollmentInProgress(false);
      setRegisterStepStatus((prev) => (prev === 'loading' ? 'idle' : prev));
      setVerifyStepStatus((prev) => (prev === 'loading' ? 'idle' : prev));
    }
  }, [
    dispatch,
    goToSettings,
    isPasskeyRegistered,
    passkeyMethodLabel,
    t,
    trackEvent,
    walletPassword,
  ]);

  const handleSubmitCurrentPassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsVerifyingPassword(true);
    setIsIncorrectPasswordError(false);
    try {
      await verifyPassword(walletPassword);
      setStep(PasskeyRegisterSteps.RegisterPasskey);
      await beginPasskeyCeremonyFlow();
    } catch {
      setIsIncorrectPasswordError(true);
    } finally {
      setIsVerifyingPassword(false);
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
      {step === PasskeyRegisterSteps.Intro && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={6}
          justifyContent={BoxJustifyContent.Start}
          asChild
          className="min-h-0 shrink-0"
        >
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              data-testid="register-passkey-intro-description"
            >
              {t('passkeyDescription', [passkeyMethodSpecificLabel])}
            </Text>
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              className="w-full shrink-0"
              data-testid="register-passkey-intro-continue-button"
              aria-label={t('setUpPasskey', [passkeyMethodLabel])}
              onClick={() => {
                setStep(PasskeyRegisterSteps.VerifyPassword);
              }}
            >
              {t('setUpPasskey', [passkeyMethodLabel])}
            </Button>
          </Box>
        </Box>
      )}

      {step === PasskeyRegisterSteps.VerifyPassword && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={6}
          justifyContent={BoxJustifyContent.Between}
          asChild
          className="min-h-0 shrink-0"
        >
          <form onSubmit={handleSubmitCurrentPassword}>
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

      {step === PasskeyRegisterSteps.RegisterPasskey && (
        <>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid="register-passkey-description"
          >
            {t('passkeyDescription', [passkeyMethodSpecificLabel])}
          </Text>

          {isEnrollmentInProgress ? (
            <PasskeyEnrollmentSteps
              registerStatus={registerStepStatus}
              verifyStatus={verifyStepStatus}
              registerLabel={t('passkeySetupStepRegister', [
                passkeyMethodSpecificLabel,
              ])}
              verifyLabel={t('passkeySetupStepVerify', [
                passkeyMethodSpecificLabel,
              ])}
              className="w-full"
            />
          ) : (
            <>
              {enrollmentError && (
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.ErrorDefault}
                  textAlign={TextAlign.Center}
                  data-testid="passkey-enrollment-error"
                >
                  {enrollmentError}
                </Text>
              )}

              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                className="w-full shrink-0"
                data-testid="register-passkey-set-up-button"
                aria-label={t('setUpPasskey', [passkeyMethodLabel])}
                onClick={beginPasskeyCeremonyFlow}
              >
                {t('setUpPasskey', [passkeyMethodLabel])}
              </Button>
            </>
          )}
        </>
      )}
    </Box>
  );
}
