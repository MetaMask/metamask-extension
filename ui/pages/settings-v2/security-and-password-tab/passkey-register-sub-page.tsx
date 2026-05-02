import React, {
  useCallback,
  useContext,
  useEffect,
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
import { getIsPasskeyRegistered } from '../../../selectors';

const PASSKEY_SETTINGS_TOAST_DURATION_MS = 5 * SECOND;

/** Brief pause after verify succeeds so the completion icon is visible before navigation. */
const PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS = 500;

type PasskeyEnrollmentStepStatus = 'pending' | 'inProgress' | 'complete';

/** Default row status before enrollment starts or after the user silently dismisses WebAuthn. */
const DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS: PasskeyEnrollmentStepStatus =
  'pending';

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

function renderPasskeyStepIndicator(status: PasskeyEnrollmentStepStatus) {
  if (status === 'complete') {
    return (
      <Box
        className="flex size-11 shrink-0 items-center justify-center"
        data-testid="passkey-step-indicator-complete"
      >
        <Icon
          name={IconName.Check}
          color={IconColor.SuccessDefault}
          size={IconSize.Lg}
        />
      </Box>
    );
  }
  if (status === 'inProgress') {
    return (
      <Box
        className="flex size-11 shrink-0 items-center justify-center"
        data-testid="passkey-step-indicator-in-progress"
      >
        <Icon
          name={IconName.Loading}
          color={IconColor.IconDefault}
          size={IconSize.Lg}
          className="animate-spin"
        />
      </Box>
    );
  }
  return (
    <Box
      className="flex size-11 shrink-0 items-center justify-center"
      data-testid="passkey-step-indicator-pending"
    >
      <Icon
        name={IconName.FullCircle}
        color={IconColor.IconMuted}
        size={IconSize.Lg}
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

  const fromSidepanel =
    new URLSearchParams(location.search).get('from') === 'sidepanel';

  const [step, setStep] = useState<
    (typeof PasskeyRegisterSteps)[keyof typeof PasskeyRegisterSteps]
  >(() =>
    fromSidepanel ? PasskeyRegisterSteps.Intro : PasskeyRegisterSteps.VerifyPassword,
  );
  const [walletPassword, setWalletPassword] = useState('');
  const [isIncorrectPasswordError, setIsIncorrectPasswordError] =
    useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isEnrollmentInProgress, setIsEnrollmentInProgress] = useState(false);
  const [registerStepStatus, setRegisterStepStatus] =
    useState<PasskeyEnrollmentStepStatus>(DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS);
  const [verifyStepStatus, setVerifyStepStatus] =
    useState<PasskeyEnrollmentStepStatus>(DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS);
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
    setRegisterStepStatus('inProgress');
    setVerifyStepStatus(DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS);
    setIsEnrollmentInProgress(true);

    if (isPasskeyRegistered) {
      goToSettings();
      return;
    }

    let registrationSucceeded = false;

    try {
      const registrationOptions = await generatePasskeyRegistrationOptions();
      const registrationResponse =
        await startPasskeyRegistration(registrationOptions);
      setRegisterStepStatus('complete');
      setVerifyStepStatus('inProgress');
      registrationSucceeded = true;

      const postRegAuthOptions =
        await generatePasskeyPostRegistrationAuthenticationOptions(
          registrationResponse,
        );
      const postRegAuthenticationResponse =
        await startPasskeyAuthentication(postRegAuthOptions);

      await protectVaultKeyWithPasskey(
        registrationResponse,
        postRegAuthenticationResponse,
        walletPassword,
      );
      await forceUpdateMetamaskState(dispatch);
      setVerifyStepStatus('complete');
      setWalletPassword('');

      await new Promise((resolve) => {
        setTimeout(resolve, PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS);
      });
      toast.success(<ToastContent title={t('passkeyTurnedOn')} />, {
        duration: PASSKEY_SETTINGS_TOAST_DURATION_MS,
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
          'Settings passkey enrollment ceremony cancelled or timed out',
          error,
        );
        setRegisterStepStatus(DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS);
        setVerifyStepStatus(DEFAULT_PASSKEY_ENROLLMENT_STEP_STATUS);
        return;
      }

      log.error('Settings passkey enrollment failed', error);
      setEnrollmentError(
        translatePasskeyError(error, t) ??
          (registrationSucceeded
            ? t('passkeyErrorAuthenticationVerificationFailed')
            : t('passkeyErrorRegistrationFailed')),
      );
    } finally {
      setIsEnrollmentInProgress(false);
      setRegisterStepStatus((prev) =>
        prev === 'inProgress' ? 'pending' : prev,
      );
      setVerifyStepStatus((prev) =>
        prev === 'inProgress' ? 'pending' : prev,
      );
    }
  }, [
    dispatch,
    goToSettings,
    isPasskeyRegistered,
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

  const registerStepTextColor =
    registerStepStatus === 'pending'
      ? TextColor.TextAlternative
      : TextColor.TextDefault;

  const verifyStepTextColor =
    verifyStepStatus === 'pending'
      ? TextColor.TextAlternative
      : TextColor.TextDefault;

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
            {t('passkeyDescription')}
          </Text>

          {isEnrollmentInProgress ? (
            <Box
              flexDirection={BoxFlexDirection.Column}
              gap={2}
              className="w-full"
              data-testid="passkey-setup-steps"
              aria-busy={true}
            >
              <Box
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                gap={3}
                padding={3}
                {...getPasskeyStepRowProps(registerStepStatus === 'inProgress')}
              >
                {renderPasskeyStepIndicator(registerStepStatus)}
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
                padding={3}
                {...getPasskeyStepRowProps(verifyStepStatus !== 'pending')}
              >
                {renderPasskeyStepIndicator(verifyStepStatus)}
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

          {enrollmentError ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.ErrorDefault}
              textAlign={TextAlign.Center}
              data-testid="passkey-enrollment-error"
            >
              {enrollmentError}
            </Text>
          ) : null}

          {isEnrollmentInProgress ? null : (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              className="w-full shrink-0"
              data-testid="register-passkey-set-up-button"
              aria-label={t('setUpPasskey')}
              onClick={beginPasskeyCeremonyFlow}
            >
              {t('setUpPasskey')}
            </Button>
          )}
        </>
      )}
    </Box>
  );
}
