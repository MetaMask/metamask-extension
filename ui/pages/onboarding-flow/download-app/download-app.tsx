import React from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useSelector, useDispatch } from 'react-redux';
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
  ONBOARDING_COMPLETION_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '../../../components/component-library';
import { getFirstTimeFlowType } from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { setCompletedOnboarding } from '../../../store/actions';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingDownloadApp() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const handleClick = async () => {
    if (firstTimeFlowType === FirstTimeFlowType.socialImport) {
      await dispatch(setCompletedOnboarding());
      navigate(DEFAULT_ROUTE, { replace: true });
    } else {
      navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
    }
  };

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
