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
  generatePasskeyAuthenticationOptions,
  verifyPasskeyEnrollment,
  forceUpdateMetamaskState,
} from '../../../store/actions';
import { StatusIcon } from '../../../components/ui/icon/status-icon';

/** Brief pause after verify succeeds so the completion icon is visible before navigation. */
const PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS = 1500;

type SetupPhase = 'idle' | 'inProgress';

type PasskeyStepIndicatorStatus = 'complete' | 'loading' | 'pending';

const STEP_INDICATOR_WRAP = 'flex size-11 shrink-0 items-center justify-center';

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
        data-testid="passkey-step-indicator-complete"
      >
        <StatusIcon state="success" />
      </Box>
    );
  }
  if (status === 'loading') {
    return (
      <Box
        className={STEP_INDICATOR_WRAP}
        data-testid="passkey-step-indicator-loading"
      >
        <StatusIcon state="loading" />
      </Box>
    );
  }
  return (
    <Box
      className={STEP_INDICATOR_WRAP}
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
 * Onboarding runs registration then an authentication ceremony so the assertion is verified
 * (registration may omit attestation).
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
  const isMountedRef = useRef(true);
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

  const handleMaybeLater = () => {
    goToNextStep();
  };

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
      await protectVaultKeyWithPasskey(registrationResponse);
      await forceUpdateMetamaskState(dispatch);
      setRegistrationStepComplete(true);
      return true;
    } catch (error) {
      if (isPasskeyCeremonySilentError(error)) {
        log.debug(
          'Onboarding passkey registration cancelled or timed out',
          error,
        );
        setPhase('idle');
        return false;
      }

      log.error('Onboarding passkey registration failed', error);
      setRegistrationError(
        translatePasskeyError(error, t) ?? t('passkeyErrorRegistrationFailed'),
      );
      setPhase('idle');
      return false;
    } finally {
      setIsRegisteringPasskey(false);
    }
  }, [isPasskeyRegistered, dispatch, t]);

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
      await new Promise((resolve) => {
        setTimeout(resolve, PASSKEY_ENROLLMENT_SUCCESS_DISPLAY_MS);
      });
      if (isMountedRef.current) {
        goToNextStep();
      }
    } catch (error) {
      if (isPasskeyCeremonySilentError(error)) {
        log.debug(
          'Onboarding passkey verification cancelled or timed out',
          error,
        );
        setPhase('idle');
        return;
      }

      log.error('Onboarding passkey verification failed', error);
      setVerificationError(
        translatePasskeyError(error, t) ??
          t('passkeyErrorAuthenticationVerificationFailed'),
      );
      setPhase('idle');
    } finally {
      setIsVerifyingPasskey(false);
    }
  }, [dispatch, t, goToNextStep]);

  const handleSetupPasskey = useCallback(async () => {
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

  const primaryLabel = isPasskeyRegistered
    ? t('passkeySetupStepVerify')
    : t('setUpPasskey');

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

      {phase === 'inProgress' ? (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          className="w-full"
          data-testid="passkey-setup-steps"
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={3}
            padding={3}
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
            padding={3}
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
          data-testid="passkey-registration-error"
        >
          {registrationError}
        </Text>
      ) : null}

      {verificationError ? (
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.ErrorDefault}
          textAlign={TextAlign.Center}
          data-testid="passkey-verification-error"
        >
          {verificationError}
        </Text>
      ) : null}

      {phase === 'idle' ? (
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
            aria-label={primaryLabel}
            onClick={handleSetupPasskey}
          >
            {primaryLabel}
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
      ) : null}
    </Box>
  );
}
