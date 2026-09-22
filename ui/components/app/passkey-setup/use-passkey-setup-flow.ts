import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import log from 'loglevel';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getFirstTimeFlowType,
  getIsPasskeyRegistered,
  getIsSocialLoginFlow,
  getPasskeyAuthenticatorId,
  getPasskeyDerivationMethod,
  getSocialLoginType,
} from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { createSentryError } from '../../../../shared/lib/error';
import { getPasskeyErrorCode } from '../../../../shared/lib/passkey/passkey-error';
import {
  getPasskeyAuthMethodKey,
  translatePasskeyError,
  isPasskeyCeremonySilentError,
} from '../../../../shared/lib/passkey';
import { PasskeyPRFRequiredError } from '../../../../shared/lib/passkey/passkey-capabilities';
import { captureException } from '../../../../shared/lib/sentry';
import { forceUpdateMetamaskState } from '../../../store/actions';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useDispatch } from '../../../store/hooks';
import { usePasskeyPRFSupport } from '../../../hooks/usePasskeyPRFSupport';
import type { PasskeyEnrollmentStepStatus } from '../passkey-enrollment-steps';
import type {
  PasskeySetupOperation,
  SetupPasskeyContentProps,
} from './passkey-setup.types';

/** Pause after enrollment succeeds so step completion is visible before navigation. */
const PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS = 1000;

/** Default row status before enrollment starts or after the user silently dismisses WebAuthn. */
const DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE: PasskeyEnrollmentStepStatus =
  'idle';

type UsePasskeySetupFlowParams = SetupPasskeyContentProps & {
  setupPasskey: PasskeySetupOperation;
};

/**
 * Owns passkey setup progress, analytics, and ceremony error handling.
 *
 * @param params - Setup callbacks and the selected passkey operation.
 * @param params.onNext - Called after passkey setup completes.
 * @param params.onSkip - Called when the user skips passkey setup.
 * @param params.password - Wallet password when the vault is restored.
 * @param params.isPasskeyRegistered - Optional override for the registered
 * passkey state.
 * @param params.checkPasskeyPRFSupport - Whether to skip setup when PRF is
 * unsupported.
 * @param params.isPrfMigration - Whether this setup replaces an existing
 * passkey.
 * @param params.setupPasskey - Enrollment or replacement ceremony.
 */
export function usePasskeySetupFlow({
  onNext,
  onSkip,
  password,
  setupPasskey,
  isPasskeyRegistered: isPasskeyRegisteredOverride,
  checkPasskeyPRFSupport = true,
  isPrfMigration = false,
}: UsePasskeySetupFlowParams) {
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const t = useI18nContext() as (
    key: string,
    substitutions?: string[],
  ) => string;
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());
  const passkeyMethodSpecificLabel = t(
    getPasskeyAuthMethodKey({ specific: true }),
  );
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isPasskeyRegisteredFromState = useSelector(getIsPasskeyRegistered);
  const isPasskeyRegistered =
    isPasskeyRegisteredOverride ?? isPasskeyRegisteredFromState;
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
  const [isPrfMigrationError, setIsPrfMigrationError] = useState(false);
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

  usePasskeyPRFSupport({
    enabled: checkPasskeyPRFSupport && !isPasskeyRegistered,
    onUnsupported: goToNextStep,
  });

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
    trackEvent(
      createEventBuilder(MetaMetricsEventName.PasskeyOnboardingSetup)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          ...baseProperties,
          status: 'viewed',
        })
        .build(),
    );
  }, [baseProperties, isPasskeyRegistered, trackEvent, createEventBuilder]);

  useEffect(() => {
    if (!isPasskeyRegistered || isEnrollmentInProgress) {
      return;
    }

    goToNextStep();
  }, [goToNextStep, isEnrollmentInProgress, isPasskeyRegistered]);

  const handleMaybeLater = () => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.PasskeyOnboardingSetup)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          ...baseProperties,
          status: 'skipped',
        })
        .build(),
    );

    if (onSkip) {
      Promise.resolve(onSkip()).catch(() => undefined);
      return;
    }

    goToNextStep();
  };

  const handleSetupPasskey = useCallback(async () => {
    const enrollmentStartedAt = Date.now();
    let currentStep = 'register';

    setEnrollmentError(null);
    setIsPrfMigrationError(false);
    setRegisterStepPhase('loading');
    setVerifyStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
    setIsEnrollmentInProgress(true);

    trackEvent(
      createEventBuilder(MetaMetricsEventName.PasskeySetup)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          ...baseProperties,
          status: 'started',
        })
        .build(),
    );

    try {
      await setupPasskey({
        password,
        onStageChange: (stage) => {
          currentStep = stage;
          if (stage === 'verify') {
            setRegisterStepPhase('success');
            setVerifyStepPhase('loading');
          }
        },
      });

      const newMetamaskState = await forceUpdateMetamaskState(dispatch);
      setVerifyStepPhase('success');

      currentStep = 'complete';
      const derivationMethod = getPasskeyDerivationMethod({
        metamask: newMetamaskState,
      });
      const authenticatorId = getPasskeyAuthenticatorId({
        metamask: newMetamaskState,
      });

      trackEvent(
        createEventBuilder(MetaMetricsEventName.PasskeySetup)
          .addCategory(MetaMetricsEventCategory.Onboarding)
          .addProperties({
            ...baseProperties,
            status: 'completed',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            derivation_method: derivationMethod,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            authenticator_id: authenticatorId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            duration_ms: Date.now() - enrollmentStartedAt,
          })
          .build(),
      );

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
        trackEvent(
          createEventBuilder(MetaMetricsEventName.PasskeySetup)
            .addCategory(MetaMetricsEventCategory.Onboarding)
            .addProperties({
              ...baseProperties,
              status: 'cancelled',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              current_step: currentStep,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              duration_ms: durationMs,
            })
            .build(),
        );

        if (isMountedRef.current) {
          setRegisterStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
          setVerifyStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
        }

        return;
      }

      if (isPrfMigration && error instanceof PasskeyPRFRequiredError) {
        if (isMountedRef.current) {
          setIsPrfMigrationError(true);
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
      trackEvent(
        createEventBuilder(MetaMetricsEventName.PasskeySetup)
          .addCategory(MetaMetricsEventCategory.Onboarding)
          .addProperties({
            ...baseProperties,
            status: 'failed',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            error_step: currentStep,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            duration_ms: durationMs,
            reason: errorCode,
          })
          .build(),
      );

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
    setupPasskey,
    goToNextStep,
    t,
    passkeyMethodLabel,
    trackEvent,
    createEventBuilder,
    password,
    isPrfMigration,
  ]);

  return {
    enrollmentError,
    handleMaybeLater,
    handleSetupPasskey,
    isEnrollmentInProgress,
    isPasskeyRegistered,
    isPrfMigrationError,
    passkeyMethodLabel,
    passkeyMethodSpecificLabel,
    registerStepPhase,
    verifyStepPhase,
  };
}
