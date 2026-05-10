import React, {
  useCallback,
  useContext,
  useEffect,
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
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getFirstTimeFlowType,
  getIsParticipateInMetaMetricsSet,
  getIsPasskeyRegistered,
  getIsSocialLoginFlow,
} from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getBrowserName } from '../../../../shared/lib/browser-runtime.utils';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { getPasskeyControllerErrorCode } from '../../../../shared/lib/passkey/passkey-error';
import {
  getPasskeyAuthMethodKey,
  startPasskeyRegistration,
  startPasskeyAuthentication,
  translatePasskeyError,
  isPasskeyCeremonySilentError,
} from '../../../../shared/lib/passkey';
import {
  protectVaultKeyWithPasskey,
  generatePasskeyRegistrationOptions,
  generatePasskeyPostRegistrationAuthenticationOptions,
  forceUpdateMetamaskState,
} from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  PasskeyEnrollmentSteps,
  type PasskeyEnrollmentStepStatus,
} from '../../../components/app/passkey-enrollment-steps';

/** Pause after enrollment succeeds so step completion is visible before navigation. */
const PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS = 1000;

/** Default row status before enrollment starts or after the user silently dismisses WebAuthn. */
const DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE: PasskeyEnrollmentStepStatus =
  'idle';

/**
 * High-level passkey enrollment phase for analytics.
 * Distinct from {@link PasskeyEnrollmentStepStatus} (per-row idle/loading/success UI).
 */
type PasskeyEnrollmentStep = 'register' | 'verify' | 'enroll' | 'complete';

/**
 * Passkey enrollment uses the vault encryption key from the background.
 * Runs WebAuthn `create()`, post-registration `get()`, then protects the vault key.
 * If a passkey is already enrolled (`passkeyRecord` present), redirect away — this route is
 * only for users who still need to enroll.
 */
export default function SetupPasskey() {
  const navigate = useNavigate();
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
  const isParticipateInMetaMetricsSet = useSelector(
    getIsParticipateInMetaMetricsSet,
  );
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const envType = getEnvironmentType();
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

  const getBaseEventProperties = useCallback(() => {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      account_type: isSocialLoginFlow ? 'social' : 'metamask',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      environment_type: envType,
    };
  }, [isSocialLoginFlow, envType]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isPasskeyRegistered) {
      return;
    }
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.PasskeyOnboardingSetupViewed,
      properties: getBaseEventProperties(),
    });
  }, [
    getBaseEventProperties,
    isPasskeyRegistered,
    trackEvent,
  ]);

  const goToNextStep = useCallback(() => {
    const isFirefox = getBrowserName() === PLATFORM_FIREFOX;

    let nextRoute: string;
    if (firstTimeFlowType === FirstTimeFlowType.create) {
      nextRoute = ONBOARDING_REVIEW_SRP_ROUTE;
    } else if (firstTimeFlowType === FirstTimeFlowType.import) {
      if (isFirefox) {
        nextRoute = ONBOARDING_COMPLETION_ROUTE;
      } else {
        nextRoute = isParticipateInMetaMetricsSet
          ? ONBOARDING_COMPLETION_ROUTE
          : ONBOARDING_METAMETRICS;
      }
    } else {
      nextRoute = ONBOARDING_COMPLETION_ROUTE;
    }

    navigate(nextRoute, { replace: true });
  }, [firstTimeFlowType, navigate, isParticipateInMetaMetricsSet]);

  useEffect(() => {
    if (!isPasskeyRegistered) {
      return;
    }
    // During an in-flight enrollment, completion navigates after PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS.
    if (isEnrollmentInProgress) {
      return;
    }
    goToNextStep();
  }, [goToNextStep, isEnrollmentInProgress, isPasskeyRegistered]);

  const handleMaybeLater = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.PasskeyOnboardingSetupSkipped,
      properties: getBaseEventProperties(),
    });
    goToNextStep();
  };

  const handleSetupPasskey = useCallback(async () => {
    const enrollmentStartedAt = Date.now();
    let currentStep: PasskeyEnrollmentStep = 'register';

    setEnrollmentError(null);
    setRegisterStepPhase('loading');
    setVerifyStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
    setIsEnrollmentInProgress(true);

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.PasskeySetupStarted,
      properties: getBaseEventProperties(),
    });

    try {
      // create passkey
      const registrationOptions = await generatePasskeyRegistrationOptions();
      const registrationResponse =
        await startPasskeyRegistration(registrationOptions);
      setRegisterStepPhase('success');
      setVerifyStepPhase('loading');

      // verify passkey
      currentStep = 'verify';
      const postRegAuthOptions =
        await generatePasskeyPostRegistrationAuthenticationOptions(
          registrationResponse,
        );
      const postRegAuthenticationResponse =
        await startPasskeyAuthentication(postRegAuthOptions);

      // enroll passkey
      currentStep = 'enroll';
      await protectVaultKeyWithPasskey(
        registrationResponse,
        postRegAuthenticationResponse,
      );
      await forceUpdateMetamaskState(dispatch);
      setVerifyStepPhase('success');

      currentStep = 'complete';
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.PasskeySetupCompleted,
        properties: {
          ...getBaseEventProperties(),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          duration_ms: Date.now() - enrollmentStartedAt,
        },
      });

      // wait for success display
      await new Promise((resolve) => {
        setTimeout(resolve, PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS);
      });
      if (isMountedRef.current) {
        goToNextStep();
      }
    } catch (error) {
      // handle error
      if (isPasskeyCeremonySilentError(error)) {
        log.debug(
          'Onboarding passkey enrollment ceremony cancelled or timed out',
          error,
        );
        trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.PasskeySetupCancelled,
          properties: {
            ...getBaseEventProperties(),
            // eslint-disable-next-line @typescript-eslint/naming-convention
            duration_ms: Date.now() - enrollmentStartedAt,
          },
        });
        if (isMountedRef.current) {
          setRegisterStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
          setVerifyStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
        }
        return;
      }

      log.error('Onboarding passkey registration failed', error);
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.PasskeySetupFailed,
        properties: {
          ...getBaseEventProperties(),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_step: currentStep,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          duration_ms: Date.now() - enrollmentStartedAt,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_code: getPasskeyControllerErrorCode(error) ?? "",
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
    dispatch,
    getBaseEventProperties,
    goToNextStep,
    t,
    passkeyMethodLabel,
    trackEvent,
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
