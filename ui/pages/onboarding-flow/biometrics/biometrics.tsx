import React, { useCallback, useState } from 'react';
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
import { useSelector } from 'react-redux';
import {
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getFirstTimeFlowType } from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { PasskeyCeremonyExtensionAdapter } from '../../../../shared/lib/passkey/PasskeyCeremonyExtensionAdapter';
import {
  completePasskeyRegistration,
  generatePasskeyRegistrationOptions,
} from '../../../store/actions';

export type BiometricsProps = {
  getVaultPassword: () => string | null;
  clearVaultPassword: () => void;
};

export default function Biometrics({
  getVaultPassword,
  clearVaultPassword,
}: BiometricsProps) {
  const navigate = useNavigate();
  const t = useI18nContext();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const goToNextStep = useCallback(() => {
    clearVaultPassword();
    navigate(
      firstTimeFlowType === FirstTimeFlowType.create
        ? ONBOARDING_REVIEW_SRP_ROUTE
        : ONBOARDING_METAMETRICS,
      { replace: true },
    );
  }, [clearVaultPassword, firstTimeFlowType, navigate]);

  const handleMaybeLater = () => {
    goToNextStep();
  };

  const handleSetUpBiometrics = async () => {
    const password = getVaultPassword();
    if (!password) {
      goToNextStep();
      return;
    }
    setIsEnrolling(true);
    try {
      const options = await generatePasskeyRegistrationOptions();
      const passkeyAdapter = new PasskeyCeremonyExtensionAdapter();
      const registrationResponse =
        await passkeyAdapter.startRegistration(options);
      await completePasskeyRegistration(registrationResponse);
    } catch {
      // User cancelled or authenticator unavailable — continue onboarding
    } finally {
      setIsEnrolling(false);
      goToNextStep();
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
          disabled={isEnrolling}
          onClick={handleSetUpBiometrics}
        >
          {isEnrolling ? t('unlocking') : t('setUpBiometrics')}
        </Button>
        <Button
          variant={ButtonVariant.Tertiary}
          size={ButtonSize.Md}
          className="w-full"
          data-testid="biometrics-maybe-later-button"
          disabled={isEnrolling}
          onClick={handleMaybeLater}
        >
          {t('maybeLater')}
        </Button>
      </Box>
    </Box>
  );
}
