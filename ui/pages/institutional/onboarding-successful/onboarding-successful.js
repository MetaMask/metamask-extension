import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Text,
  ButtonVariant,
  ButtonSize,
  ButtonSecondarySize,
} from '../../../components/component-library';
import {
  TextVariant,
  TextAlign,
  FontWeight,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setCompletedOnboarding } from '../../../store/actions';
import { getMMIConfiguration } from '../../../selectors/institutional/selectors';

export default function OnboardingSuccessful() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { portfolio } = useSelector(getMMIConfiguration);

  return (
    <div className="onboarding-successful" data-testid="onboarding-successful">
      <Box textAlign={TextAlign.Center}>
        <Text
          variant={TextVariant.headingLg}
          fontWeight={FontWeight.Bold}
          margin={6}
        >
          {t('extensionInsallCompleteTitle')}
        </Text>
        <Text marginTop={6} marginBottom={6}>
          {t('extensionInsallCompleteDescription')}
        </Text>
      </Box>

      <Box
        marginTop={6}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
      >
        <Button
          data-testid="onboarding-continue-button"
          size={ButtonSize.Lg}
          onClick={async () => {
            await dispatch(setCompletedOnboarding());
            window.open(portfolio.url);
          }}
        >
          {t('continueMmiOnboarding')}
        </Button>
        <Button
          marginTop={4}
          data-testid="onboarding-continue-to-wallet"
          variant={ButtonVariant.Link}
          size={ButtonSecondarySize.Lg}
          onClick={async () => {
            await dispatch(setCompletedOnboarding());
          }}
        >
          {t('continueToWallet')}
        </Button>
      </Box>
    </div>
  );
}
