import React from 'react';
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

export default function Biometrics() {
  const navigate = useNavigate();
  const t = useI18nContext();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const handleMaybeLater = () => {
    navigate(
      firstTimeFlowType === FirstTimeFlowType.create
        ? ONBOARDING_REVIEW_SRP_ROUTE
        : ONBOARDING_METAMETRICS,
      { replace: true },
    );
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
        >
          {t('setUpBiometrics')}
        </Button>
        <Button
          variant={ButtonVariant.Tertiary}
          size={ButtonSize.Md}
          className="w-full"
          onClick={handleMaybeLater}
        >
          {t('maybeLater')}
        </Button>
      </Box>
    </Box>
  );
}
