import React from 'react';
import { useDispatch } from 'react-redux';
import { Box, Text } from '../../../components/component-library';
import Button from '../../../components/ui/button';
import {
  TextVariant,
  TextAlign,
  FontWeight,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setCompletedOnboarding } from '../../../store/actions';

export default function OnboardingSuccessful() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  return (
    <div className="creation-successful" data-testid="creation-successful">
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
          data-testid="onboarding-complete-done"
          type="primary"
          large
          rounded
          onClick={async () => {
            await dispatch(setCompletedOnboarding());
            window.open('https://metamask-institutional.io/onboarding');
            // window.location.href = 'https://metamask-institutional.io/onboarding';
          }}
        >
          {t('continueMmiOnboarding')}
        </Button>
      </Box>
    </div>
  );
}
