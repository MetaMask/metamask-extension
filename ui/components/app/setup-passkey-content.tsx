import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import log from 'loglevel';
import {
  Box,
  Text,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  ButtonSize,
  ButtonVariant,
  Button,
  TextButton,
  TextVariant,
  FontWeight,
  TextColor,
  TextAlign,
} from '@metamask/design-system-react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  getFirstTimeFlowType,
  getIsPasskeyRegistered,
  getIsSocialLoginFlow,
  getPasskeyDerivationMethod,
  getSocialLoginType,
} from '../../selectors';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { createSentryError } from '../../../shared/lib/error';
import { getPasskeyErrorCode } from '../../../shared/lib/passkey/passkey-error';
import {
  getPasskeyAuthMethodKey,
  startPasskeyRegistration,
  startPasskeyAuthentication,
  translatePasskeyError,
  isPasskeyCeremonySilentError,
} from '../../../shared/lib/passkey';
import { captureException } from '../../../shared/lib/sentry';
import {
  protectVaultKeyWithPasskey,
  generatePasskeyRegistrationOptions,
  generatePasskeyPostRegistrationAuthenticationOptions,
  forceUpdateMetamaskState,
} from '../../store/actions';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  PasskeyEnrollmentSteps,
  type PasskeyEnrollmentStepStatus,
} from './passkey-enrollment-steps';

/** Pause after enrollment succeeds so step completion is visible before navigation. */
const PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS = 1000;

/** Default row status before enrollment starts or after the user silently dismisses WebAuthn. */
const DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE: PasskeyEnrollmentStepStatus =
  'idle';

export type SetupPasskeyContentProps = {
  readonly onNext: () => void;
  readonly password?: string;
};

/**
 * Reusable passkey setup content used by onboarding and restore-vault flows.
 *
 * @param options0 - Component props.
 * @param options0.onNext - Called after the passkey step is skipped or completed.
 * @param options0.password - Wallet password when vault is restored.
 */
export default function SetupPasskeyContent({
  onNext,
  password,
}: SetupPasskeyContentProps) {
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);
  const t = useI18nContext() as (
    key: string,
    substitutions?: string[],
  ) => string;
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());
  const passkeyMethodSpecificLabel = t(
    getPasskeyAuthMethodKey({ specific: true }),
  );
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const socialLoginType = useSelector(getSocialLoginType);

  const accountTypeForMetrics = useMemo(() => {
    const baseType =
      firstTimeFlowType === FirstTimeFlowType.import ||
      firstTimeFlowType === FirstTimeFlowType.restore
        ? MetaMetricsEventAccountType.Imported
        : MetaMetricsEventAccountType.Default;

    if (isSocialLoginFlow && socialLoginType) {
      const socialProvider = String(socialLoginType).toLowerCase();
      return `${baseType}_${socialProvider}`;
    }

    return baseType;
  }, [firstTimeFlowType, isSocialLoginFlow, socialLoginType]);
  const [isEnrollmentInProgress, setIsEnrollmentInProgress] = useState(false);
  const [registerStepPhase, setRegisterStepPhase] =
    useState<PasskeyEnrollmentStepStatus>(
      DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE,
    );
  const [verifyStepPhase, setVerifyStepPhase] =
    useState<PasskeyEnrollmentStepStatus>(
      DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE,
    );
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const hasAdvancedRef = useRef(false);
  const hasTrackedView = useRef(false);

  const baseProperties = useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      account_type: accountTypeForMetrics,
    }),
    [accountTypeForMetrics],
  );

  const goToNextStep = useCallback(() => {
    if (hasAdvancedRef.current) {
      return;
    }

    hasAdvancedRef.current = true;
    onNext();
  }, [onNext]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isPasskeyRegistered || hasTrackedView.current) {
      return;
    }

    hasTrackedView.current = true;
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.PasskeyOnboardingSetup,
      properties: {
        ...baseProperties,
        status: 'viewed',
      },
    });
  }, [baseProperties, isPasskeyRegistered, trackEvent]);

  useEffect(() => {
    if (!isPasskeyRegistered || isEnrollmentInProgress) {
      return;
    }

    goToNextStep();
  }, [goToNextStep, isEnrollmentInProgress, isPasskeyRegistered]);

  const handleMaybeLater = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.PasskeyOnboardingSetup,
      properties: {
        ...baseProperties,
        status: 'skipped',
      },
    });

    goToNextStep();
  };

  const handleSetupPasskey = useCallback(async () => {
    const enrollmentStartedAt = Date.now();
    let currentStep = 'register';

    setEnrollmentError(null);
    setRegisterStepPhase('loading');
    setVerifyStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
    setIsEnrollmentInProgress(true);

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.PasskeySetup,
      properties: {
        ...baseProperties,
        status: 'started',
      },
    });

    try {
      const registrationOptions = await generatePasskeyRegistrationOptions();
      const registrationResponse =
        await startPasskeyRegistration(registrationOptions);

      setRegisterStepPhase('success');
      setVerifyStepPhase('loading');

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
        password,
      );

      const newMetamaskState = await forceUpdateMetamaskState(dispatch);
      setVerifyStepPhase('success');

      currentStep = 'complete';
      const derivationMethod = getPasskeyDerivationMethod({
        metamask: newMetamaskState,
      });

      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.PasskeySetup,
        properties: {
          ...baseProperties,
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

      if (isMountedRef.current) {
        goToNextStep();
      }
    } catch (error) {
      const durationMs = Date.now() - enrollmentStartedAt;
      if (isPasskeyCeremonySilentError(error)) {
        log.debug('Passkey enrollment ceremony cancelled or timed out', error);
        trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.PasskeySetup,
          properties: {
            ...baseProperties,
            status: 'cancelled',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            current_step: currentStep,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            duration_ms: durationMs,
          },
        });

        if (isMountedRef.current) {
          setRegisterStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
          setVerifyStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
        }

        return;
      }

      const errorCode = getPasskeyErrorCode(error);
      captureException(
        createSentryError(
          'Passkey registration during onboarding failed',
          error,
        ),
        {
          extra: { currentStep, durationMs, errorCode },
        },
      );
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.PasskeySetup,
        properties: {
          ...baseProperties,
          status: 'failed',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_step: currentStep,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          duration_ms: durationMs,
          reason: errorCode,
        },
      });

      if (isMountedRef.current) {
        setEnrollmentError(
          translatePasskeyError(error, t, passkeyMethodLabel) ??
            t('passkeyErrorRegistrationFailed', [passkeyMethodLabel]),
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsEnrollmentInProgress(false);
        setRegisterStepPhase((prev) => (prev === 'loading' ? 'idle' : prev));
        setVerifyStepPhase((prev) => (prev === 'loading' ? 'idle' : prev));
      }
    }
  }, [
    baseProperties,
    dispatch,
    goToNextStep,
    t,
    passkeyMethodLabel,
    trackEvent,
    password,
  ]);

  if (isPasskeyRegistered && !isEnrollmentInProgress) {
    return null;
  }

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={4} className="h-full">
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
        className="my-8"
      >
        <img
          src="images/biometric.png"
          alt="Biometrics"
          width={200}
          height={200}
        />
      </Box>

      {isEnrollmentInProgress ? (
        <>
          <Text
            variant={TextVariant.HeadingLg}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
          >
            {t('settingUpPasskey', [passkeyMethodLabel])}
          </Text>

          <PasskeyEnrollmentSteps
            registerStatus={registerStepPhase}
            verifyStatus={verifyStepPhase}
            registerLabel={t('passkeySetupStepRegister', [
              passkeyMethodSpecificLabel,
            ])}
            verifyLabel={t('passkeySetupStepVerify', [
              passkeyMethodSpecificLabel,
            ])}
            className="w-full"
          />
        </>
      ) : (
        <>
          <Text
            variant={TextVariant.HeadingLg}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
          >
            {t('unlockWithPasskey', [passkeyMethodLabel])}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('passkeyDescription', [passkeyMethodSpecificLabel])}
          </Text>

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

          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            className="mt-auto w-full"
          >
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              className="w-full"
              data-testid="passkey-set-up-button"
              aria-label={t('setUpPasskey', [passkeyMethodLabel])}
              onClick={handleSetupPasskey}
            >
              {t('setUpPasskey', [passkeyMethodLabel])}
            </Button>
            <TextButton
              type="button"
              className="w-full"
              color={TextColor.PrimaryDefault}
              data-testid="passkey-maybe-later-button"
              onClick={handleMaybeLater}
            >
              {t('maybeLater')}
            </TextButton>
          </Box>
        </>
      )}
    </Box>
  );
}
