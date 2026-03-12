import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  TextVariant,
  BoxFlexDirection,
  BoxJustifyContent,
  TextColor,
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import { getCurrentKeyring } from '../../../selectors';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860

export default function OnboardingDownloadApp() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const currentKeyring = useSelector(getCurrentKeyring);

  const handleClick = async () => {
    navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
  };

  useEffect(() => {
    // if the user has not created a wallet, redirect to onboarding welcome route
    if (!currentKeyring) {
      navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
    }
  }, [currentKeyring, navigate]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      gap={6}
      className="onboarding-download-app h-full"
      data-testid="onboarding-download-app"
    >
      <Box>
        <Text variant={TextVariant.HeadingLg} className="mb-4">
          {t('downloadAppTitle')}
        </Text>
        <Box className="mb-4">
          <img
            src="/images/onboarding-download-app.png"
            alt="Download the app"
          />
        </Box>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('downloadAppDescription')}
        </Text>
      </Box>
      <Box>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          data-testid="download-app-continue"
          onClick={handleClick}
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
}
