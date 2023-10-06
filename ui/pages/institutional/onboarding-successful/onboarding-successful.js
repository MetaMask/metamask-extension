import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Text } from '../../../components/component-library';
import Button from '../../../components/ui/button';
import {
  TextVariant,
  TextAlign,
  FontWeight,
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

      <Box marginTop={6}>
        <Button
          data-testid="onboarding-continue-button"
          type="primary"
          large
          rounded
          onClick={async () => {
            await dispatch(setCompletedOnboarding());
            window.open(portfolio.url);
          }}
        >
          {t('continueMmiOnboarding')}
        </Button>
      </Box>
    </div>
  );
}
