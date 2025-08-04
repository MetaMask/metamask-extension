import React, { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  TextVariant,
  Display,
  JustifyContent,
  BlockSize,
  FlexDirection,
  AlignItems,
} from '../../../helpers/constants/design-system';
import {
  ONBOARDING_PIN_EXTENSION_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import { getCurrentKeyring } from '../../../selectors';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingDownloadApp() {
  const t = useI18nContext();
  const history = useHistory();
  const currentKeyring = useSelector(getCurrentKeyring);

  const handleClick = async () => {
    history.push(ONBOARDING_PIN_EXTENSION_ROUTE);
  };

  useEffect(() => {
    // if the user has not created a wallet, redirect to onboarding welcome route
    if (!currentKeyring) {
      history.replace(ONBOARDING_WELCOME_ROUTE);
    }
  }, [currentKeyring, history]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      gap={6}
      className="onboarding-download-app"
      data-testid="onboarding-download-app"
    >
      <Box>
        <Text variant={TextVariant.headingLg} marginBottom={4}>
          {t('downloadAppTitle')}
        </Text>
        <Box
          display={Display.Flex}
          alignItems={AlignItems.flexStart}
          justifyContent={JustifyContent.center}
          marginBottom={4}
        >
          <img
            src="/images/onboarding-download-app.png"
            alt="Download the app"
          />
        </Box>
        <Text variant={TextVariant.bodyMd}>{t('downloadAppDescription')}</Text>
      </Box>
      <Box>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          block
          data-testid="download-app-continue"
          onClick={handleClick}
        >
          {t('continue')}
        </Button>
      </Box>
    </Box>
  );
}
