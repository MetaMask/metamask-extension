import React, { useCallback, useEffect, useRef, useState } from 'react';
import log from 'loglevel';
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

/** Pause after enrollment succeeds so step completion is visible before navigation. */
const PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS = 1000;

type PasskeyEnrollmentStepStatus = 'pending' | 'inProgress' | 'complete';

/** Default row status before enrollment starts or after the user silently dismisses WebAuthn. */
const DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE: PasskeyEnrollmentStepStatus =
  'pending';

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

function renderPasskeyStepIndicator(phase: PasskeyEnrollmentStepStatus) {
  if (phase === 'complete') {
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
  if (phase === 'inProgress') {
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
    useState<PasskeyEnrollmentStepStatus>(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
  const [verifyStepPhase, setVerifyStepPhase] =
    useState<PasskeyEnrollmentStepStatus>(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
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
      nextRoute = ONBOARDING_METAMETRICS;
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
    setRegisterStepPhase('inProgress');
    setVerifyStepPhase(DEFAULT_PASSKEY_ENROLLMENT_STEP_PHASE);
    setIsEnrollmentInProgress(true);

    try {
      // create passkey
      const registrationOptions = await generatePasskeyRegistrationOptions();
      const registrationResponse = await startPasskeyRegistration(registrationOptions);
      setRegisterStepPhase('complete');
      setVerifyStepPhase('inProgress');

      // verify passkey
      const postRegAuthOptions = await generatePasskeyPostRegistrationAuthenticationOptions(
        registrationResponse,
      );
      const postRegAuthenticationResponse = await startPasskeyAuthentication(postRegAuthOptions);

      // enroll passkey
      await protectVaultKeyWithPasskey(
        registrationResponse,
        postRegAuthenticationResponse,
      );
      await forceUpdateMetamaskState(dispatch);
      setVerifyStepPhase('complete');

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
        prev === 'inProgress' ? 'pending' : prev,
      );
      setVerifyStepPhase((prev) =>
        prev === 'inProgress' ? 'pending' : prev,
      );
    }
  }, [dispatch, t, goToNextStep]);

  const registerStepTextColor =
    registerStepPhase === 'pending'
      ? TextColor.TextAlternative
      : TextColor.TextDefault;

  const verifyStepTextColor =
    verifyStepPhase === 'pending'
      ? TextColor.TextAlternative
      : TextColor.TextDefault;

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
            {...getPasskeyStepRowProps(registerStepPhase === 'inProgress')}
          >
            {renderPasskeyStepIndicator(registerStepPhase)}
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
            {...getPasskeyStepRowProps(verifyStepPhase !== 'pending')}
          >
            {renderPasskeyStepIndicator(verifyStepPhase)}
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
          <Button
            variant={ButtonVariant.Tertiary}
            size={ButtonSize.Md}
            className="w-full"
            data-testid="passkey-maybe-later-button"
            onClick={handleMaybeLater}
          >
            {t('maybeLater')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
