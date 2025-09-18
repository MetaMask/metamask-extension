import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  TextVariant,
  Display,
  JustifyContent,
  BlockSize,
  FlexDirection,
  AlignItems,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  ONBOARDING_WELCOME_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
} from '../../../helpers/constants/routes';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import { getCurrentKeyring, getFirstTimeFlowType } from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingDownloadApp() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const currentKeyring = useSelector(getCurrentKeyring);
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const handleClick = async () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.ExtensionPinned,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        wallet_setup_type:
          firstTimeFlowType === FirstTimeFlowType.import ? 'import' : 'new',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        new_wallet: firstTimeFlowType === FirstTimeFlowType.create,
      },
    });
    navigate(ONBOARDING_COMPLETION_ROUTE);
  };

  useEffect(() => {
    // if the user has not created a wallet, redirect to onboarding welcome route
    if (!currentKeyring) {
      navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
    }
  }, [currentKeyring, navigate]);

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
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {t('downloadAppDescription')}
        </Text>
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
