import React, { useCallback, useEffect, useState } from 'react';
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
} from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { getBrowserName } from '../../../../shared/lib/browser-runtime.utils';
import {
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
 * Passkey enrollment uses the vault encryption key from the background.
 * Runs WebAuthn `create()`, post-registration `get()`, then protects the vault key.
 * If a passkey is already enrolled (`passkeyRecord` present), redirect away — this route is
 * only for users who still need to enroll.
 */
export default function SetupPasskey() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useI18nContext() as (key: string) => string;
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isParticipateInMetaMetricsSet = useSelector(
    getIsParticipateInMetaMetricsSet,
  );
  const isPasskeyRegistered = useSelector(getIsPasskeyRegistered);
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
  }, [isPasskeyRegistered, isEnrollmentInProgress, goToNextStep]);

  const handleMaybeLater = () => {
    goToNextStep();
  };

  const handleSetupPasskey = useCallback(async () => {
    setEnrollmentError(null);
    setRegisterStepPhase('loading');
    setVerifyStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
    setIsEnrollmentInProgress(true);

    try {
      // create passkey
      const registrationOptions = await generatePasskeyRegistrationOptions();
      const registrationResponse =
        await startPasskeyRegistration(registrationOptions);
      setRegisterStepPhase('success');
      setVerifyStepPhase('loading');

      // verify passkey
      const postRegAuthOptions =
        await generatePasskeyPostRegistrationAuthenticationOptions(
          registrationResponse,
        );
      const postRegAuthenticationResponse =
        await startPasskeyAuthentication(postRegAuthOptions);

      // enroll passkey
      await protectVaultKeyWithPasskey(
        registrationResponse,
        postRegAuthenticationResponse,
      );
      await forceUpdateMetamaskState(dispatch);
      setVerifyStepPhase('success');

      // wait for success display
      await new Promise((resolve) => {
        setTimeout(resolve, PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS);
      });
      goToNextStep();
    } catch (error) {
      // handle error
      if (isPasskeyCeremonySilentError(error)) {
        log.debug(
          'Onboarding passkey enrollment ceremony cancelled or timed out',
          error,
        );
        setRegisterStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
        setVerifyStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
        return;
      }

      log.error('Onboarding passkey registration failed', error);
      setEnrollmentError(
        translatePasskeyError(error, t) ?? t('passkeyErrorRegistrationFailed'),
      );
    } finally {
      setIsEnrollmentInProgress(false);
      setRegisterStepPhase((prev) =>
        prev === 'loading' ? 'idle' : prev,
      );
      setVerifyStepPhase((prev) => (prev === 'loading' ? 'idle' : prev));
    }
  }, [dispatch, t, goToNextStep]);

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
            {t('settingUpPasskey')}
          </Text>

          <PasskeyEnrollmentSteps
            registerStatus={registerStepPhase}
            verifyStatus={verifyStepPhase}
            registerLabel={t('passkeySetupStepRegister')}
            verifyLabel={t('passkeySetupStepVerify')}
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
          {t('unlockWithPasskey')}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('passkeyDescription')}
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
              aria-label={t('setUpPasskey')}
              onClick={handleSetupPasskey}
            >
              {t('setUpPasskey')}
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
