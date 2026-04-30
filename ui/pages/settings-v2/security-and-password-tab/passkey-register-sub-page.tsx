import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import log from 'loglevel';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Text,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxBackgroundColor,
  BoxBorderColor,
  ButtonSize,
  ButtonVariant,
  Button,
  FontWeight,
  TextVariant,
  TextColor,
  TextAlign,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import {
  FormTextField,
  FormTextFieldSize,
  TextFieldType,
} from '../../../components/component-library';
import { StatusIcon } from '../../../components/ui/icon/status-icon';
import { SECURITY_AND_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  startPasskeyRegistration,
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  translatePasskeyError,
  isPasskeyCeremonySilentError,
} from '../../../../shared/lib/passkey';
import {
  protectVaultKeyWithPasskey,
  generatePasskeyRegistrationOptions,
  generatePasskeyAuthenticationOptions,
  verifyPasskeyEnrollment,
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
import { getIsPasskeyRegistered } from '../../../selectors';

const passkeySettingsToastDurationMs = 5 * SECOND;

/** Brief pause after verify succeeds so the completion icon is visible before navigation. */
const PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS = 1500;

type SetupPhase = 'idle' | 'inProgress';

type PasskeyStepIndicatorStatus = 'complete' | 'loading' | 'pending';

/** Matches StatusIcon `size-6`; avoids oversized row height from empty padding. */
const STEP_INDICATOR_WRAP = 'flex size-6 shrink-0 items-center justify-center';

const PasskeyRegisterSteps = {
  /** Shown when opening from side panel in a full tab so users see context before the password step. */
  Intro: 0,
  VerifyPassword: 1,
  RegisterPasskey: 2,
} as const;

/**
 * @param isActive - Whether this step is the active row (primary border).
 */
function getPasskeyStepRowProps(isActive: boolean) {
  if (isActive) {
    return {
      backgroundColor: BoxBackgroundColor.BackgroundMuted,
      borderColor: BoxBorderColor.PrimaryDefault,
      className: 'rounded-lg border-2 border-solid',
    };
  }
  return {
    backgroundColor: BoxBackgroundColor.BackgroundMuted,
    className: 'rounded-lg',
  };
}

function renderPasskeyStepIndicator(status: PasskeyStepIndicatorStatus) {
  if (status === 'complete') {
    return (
      <Box
        className={STEP_INDICATOR_WRAP}
        data-testid="register-passkey-step-indicator-complete"
      >
        <StatusIcon state="success" />
      </Box>
    );
  }
  if (status === 'loading') {
    return (
      <Box
        className={STEP_INDICATOR_WRAP}
        data-testid="register-passkey-step-indicator-loading"
      >
        <StatusIcon state="loading" />
      </Box>
    );
  }
  return (
    <Box
      className={STEP_INDICATOR_WRAP}
      data-testid="register-passkey-step-indicator-pending"
    >
      <Icon
        name={IconName.FullCircle}
        color={IconColor.IconMuted}
        size={IconSize.Md}
      />
    </Box>
  );
}

export default function PasskeyRegisterSubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useI18nContext() as (key: string) => string;
  const { trackEvent } = useContext(MetaMetricsContext);
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);
  const isMountedRef = useRef(true);

  const fromChangePassword =
    new URLSearchParams(location.search).get('from') === 'change-password';
  const fromSidepanel =
    new URLSearchParams(location.search).get('from') === 'sidepanel';

  const [step, setStep] = useState<
    (typeof PasskeyRegisterSteps)[keyof typeof PasskeyRegisterSteps]
  >(() =>
    !fromChangePassword && fromSidepanel
      ? PasskeyRegisterSteps.Intro
      : PasskeyRegisterSteps.VerifyPassword,
  );
  const [walletPassword, setWalletPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [phase, setPhase] = useState<SetupPhase>('idle');
  const [registrationStepComplete, setRegistrationStepComplete] =
    useState(false);
  const [verificationStepComplete, setVerificationStepComplete] =
    useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [isVerifyingPasskey, setIsVerifyingPasskey] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );
  const [verificationError, setVerificationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(
    () => () => {
      cancelPasskeyCeremony();
    },
    [],
  );

  useEffect(() => {
    // Only redirect when a passkey already exists before enrollment UI. After
    // registration, `passkeyRecord` is set before verify; do not redirect until verify completes.
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

  const handleStepRegisterPasskey = useCallback(async (): Promise<boolean> => {
    if (isPasskeyRegistered) {
      setRegistrationStepComplete(true);
      return true;
    }

    setRegistrationStepComplete(false);
    setIsRegisteringPasskey(true);
    try {
      const options = await generatePasskeyRegistrationOptions();
      const registrationResponse = await startPasskeyRegistration(options);
      await protectVaultKeyWithPasskey(registrationResponse, walletPassword);
      await forceUpdateMetamaskState(dispatch);
      setRegistrationStepComplete(true);
      return true;
    } catch (error) {
      if (isPasskeyCeremonySilentError(error)) {
        log.debug(
          'Settings passkey registration cancelled or timed out',
          error,
        );
        setPhase('idle');
        return false;
      }

      log.error('Settings passkey registration failed', error);
      setRegistrationError(
        translatePasskeyError(error, t) ?? t('passkeyErrorRegistrationFailed'),
      );
      setPhase('idle');
      return false;
    } finally {
      setIsRegisteringPasskey(false);
    }
  }, [isPasskeyRegistered, dispatch, t, walletPassword]);

  const handleStepVerifyPasskey = useCallback(async () => {
    setIsVerifyingPasskey(true);
    try {
      const authOptions = await generatePasskeyAuthenticationOptions();
      const authenticationResponse =
        await startPasskeyAuthentication(authOptions);
      await verifyPasskeyEnrollment(authenticationResponse);
      await forceUpdateMetamaskState(dispatch);
      setIsVerifyingPasskey(false);
      setVerificationStepComplete(true);
      setWalletPassword('');
      await new Promise((resolve) => {
        setTimeout(resolve, PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS);
      });
      if (!isMountedRef.current) {
        return;
      }
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
    } catch (error) {
      if (isPasskeyCeremonySilentError(error)) {
        log.debug(
          'Settings passkey verification cancelled or timed out',
          error,
        );
        setPhase('idle');
        return;
      }

      log.error('Settings passkey verification failed', error);
      setVerificationError(
        translatePasskeyError(error, t) ??
          t('passkeyErrorAuthenticationVerificationFailed'),
      );
      setPhase('idle');
    } finally {
      setIsVerifyingPasskey(false);
    }
  }, [dispatch, goToSettings, t, trackEvent]);

  const beginPasskeyCeremonyFlow = useCallback(async () => {
    setRegistrationError(null);
    setVerificationError(null);
    setVerificationStepComplete(false);
    setPhase('inProgress');

    const shouldContinue = await handleStepRegisterPasskey();
    if (!shouldContinue) {
      return;
    }

    await handleStepVerifyPasskey();
  }, [handleStepRegisterPasskey, handleStepVerifyPasskey]);

  const handleSubmitCurrentPassword = async () => {
    setIsVerifyingPassword(true);
    setIsIncorrectPasswordError(false);
    try {
      await verifyPassword(walletPassword);
      setStep(PasskeyRegisterSteps.RegisterPasskey);
      beginPasskeyCeremonyFlow().catch((error) => {
        log.error('Passkey ceremony flow failed unexpectedly', error);
      });
    } catch {
      setIsIncorrectPasswordError(true);
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  let registerIndicatorStatus: PasskeyStepIndicatorStatus = 'pending';
  if (registrationStepComplete) {
    registerIndicatorStatus = 'complete';
  } else if (isRegisteringPasskey) {
    registerIndicatorStatus = 'loading';
  }

  let verifyIndicatorStatus: PasskeyStepIndicatorStatus = 'pending';
  if (verificationStepComplete) {
    verifyIndicatorStatus = 'complete';
  } else if (isVerifyingPasskey) {
    verifyIndicatorStatus = 'loading';
  }

  const registerStepTextColor =
    registrationStepComplete || isRegisteringPasskey
      ? TextColor.TextDefault
      : TextColor.TextAlternative;

  const verifyStepTextColor =
    isVerifyingPasskey || verificationStepComplete
      ? TextColor.TextDefault
      : TextColor.TextAlternative;

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
              {t('passkeyDescription')}
            </Text>
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              className="w-full shrink-0"
              data-testid="register-passkey-intro-continue-button"
              aria-label={t('setUpPasskey')}
              onClick={() => {
                setStep(PasskeyRegisterSteps.VerifyPassword);
              }}
            >
              {t('setUpPasskey')}
            </Button>
          </Box>
        </Box>
      )}

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

      {step === PasskeyRegisterSteps.RegisterPasskey && (
        <>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid="register-passkey-description"
          >
            {t('passkeyDescription')}
          </Text>

          {phase === 'inProgress' ? (
            <Box
              flexDirection={BoxFlexDirection.Column}
              gap={2}
              className="w-full"
              data-testid="register-passkey-setup-steps"
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={3}
                padding={4}
                {...getPasskeyStepRowProps(isRegisteringPasskey)}
              >
                {renderPasskeyStepIndicator(registerIndicatorStatus)}
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Regular}
                  color={registerStepTextColor}
                >
                  {t('passkeySetupStepRegister')}
                </Text>
              </Box>
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={3}
                padding={4}
                {...getPasskeyStepRowProps(
                  isVerifyingPasskey || verificationStepComplete,
                )}
              >
                {renderPasskeyStepIndicator(verifyIndicatorStatus)}
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Regular}
                  color={verifyStepTextColor}
                >
                  {t('passkeySetupStepVerify')}
                </Text>
              </Box>
            </Box>
          ) : null}

          {registrationError ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.ErrorDefault}
              textAlign={TextAlign.Center}
              data-testid="register-passkey-registration-error"
            >
              {registrationError}
            </Text>
          ) : null}

          {verificationError ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.ErrorDefault}
              textAlign={TextAlign.Center}
              data-testid="register-passkey-verification-error"
            >
              {verificationError}
            </Text>
          ) : null}

          {phase === 'idle' ? (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              className="w-full shrink-0"
              data-testid="register-passkey-set-up-button"
              aria-label={t('setUpPasskey')}
              onClick={() => {
                beginPasskeyCeremonyFlow().catch((error) => {
                  log.error('Passkey ceremony flow failed unexpectedly', error);
                });
              }}
            >
              {t('setUpPasskey')}
            </Button>
          ) : null}
        </>
      )}
    </Box>
  );
}
