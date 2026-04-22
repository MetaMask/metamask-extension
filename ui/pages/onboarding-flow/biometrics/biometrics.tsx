import React, { useCallback, useState } from 'react';
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
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getFirstTimeFlowType } from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { startPasskeyRegistration } from '../../../../shared/lib/passkey';
import {
  protectVaultKeyWithPasskey,
  generatePasskeyRegistrationOptions,
  forceUpdateMetamaskState,
} from '../../../store/actions';

/**
 * Passkey enrollment uses the vault encryption key from the background
 * (`exportEncryptionKey`) wrapped with a passkey-derived key — not the account password.
 */
export default function Biometrics() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);

  const goToNextStep = useCallback(() => {
    navigate(
      firstTimeFlowType === FirstTimeFlowType.create
        ? ONBOARDING_REVIEW_SRP_ROUTE
        : ONBOARDING_METAMETRICS,
      { replace: true },
    );
  }, [firstTimeFlowType, navigate]);

  const handleMaybeLater = () => {
    goToNextStep();
  };

  const handleSetUpBiometrics = async () => {
    setIsRegisteringPasskey(true);
    try {
      const options = await generatePasskeyRegistrationOptions();
      const registrationResponse = await startPasskeyRegistration(options);
      await protectVaultKeyWithPasskey(registrationResponse);
      await forceUpdateMetamaskState(dispatch);
      goToNextStep();
    } catch (error: unknown) {
      log.debug(
        'Onboarding passkey registration failed or was cancelled',
        error,
      );
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

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
        {t('unlockWithBiometrics')}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('biometricsDescription')}
      </Text>

      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        className="w-full mt-auto"
      >
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          data-testid="biometrics-set-up-button"
          disabled={isRegisteringPasskey}
          isLoading={isRegisteringPasskey}
          aria-label={t('setUpBiometrics')}
          onClick={handleSetUpBiometrics}
        >
          {t('setUpBiometrics')}
        </Button>
        <Button
          variant={ButtonVariant.Tertiary}
          size={ButtonSize.Md}
          className="w-full"
          data-testid="biometrics-maybe-later-button"
          disabled={isRegisteringPasskey}
          onClick={handleMaybeLater}
        >
          {t('maybeLater')}
        </Button>
      </Box>
    </Box>
  );
}
