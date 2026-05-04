import React, { useCallback, useEffect, useState } from 'react';
import log from 'loglevel';
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
  translatePasskeyError,
  isPasskeyCeremonySilentError,
} from '../../../../shared/lib/passkey';
import {
  protectVaultKeyWithPasskey,
  generatePasskeyRegistrationOptions,
  forceUpdateMetamaskState,
} from '../../../store/actions';

/**
 * Passkey enrollment uses the vault encryption key from the background
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
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );

  const goToNextStep = useCallback(() => {
    const isFirefox = getBrowserName() === PLATFORM_FIREFOX;

    // determine next route based on flow type
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
    goToNextStep();
  }, [isPasskeyRegistered, goToNextStep]);

  const handleMaybeLater = () => {
    goToNextStep();
  };

  const handleSetupPasskey = async () => {
    setRegistrationError(null);
    setIsRegisteringPasskey(true);
    try {
      // register passkey and protect vault key with passkey
      const options = await generatePasskeyRegistrationOptions();
      const registrationResponse = await startPasskeyRegistration(options);
      await protectVaultKeyWithPasskey(registrationResponse);

      // update metamask state to reflect passkey registration; useEffect navigates
      // when isPasskeyRegistered becomes true
      await forceUpdateMetamaskState(dispatch);
    } catch (error) {
      // silent error, do not show error to user
      if (isPasskeyCeremonySilentError(error)) {
        log.debug(
          'Onboarding passkey registration cancelled or timed out',
          error,
        );
        return;
      }

      // show error to user
      log.error('Onboarding passkey registration failed', error);
      setRegistrationError(
        translatePasskeyError(error, t) ?? t('passkeyErrorRegistrationFailed'),
      );
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  if (isPasskeyRegistered) {
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

      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        className="w-full mt-auto"
      >
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          data-testid="passkey-set-up-button"
          disabled={isRegisteringPasskey}
          isLoading={isRegisteringPasskey}
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
          disabled={isRegisteringPasskey}
          onClick={handleMaybeLater}
        >
          {t('maybeLater')}
        </Button>
      </Box>
    </Box>
  );
}
