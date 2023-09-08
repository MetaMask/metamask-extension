import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import Button from '../../../components/ui/button';
import {
  FONT_WEIGHT,
  TEXT_ALIGN,
  TypographyVariant,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_PIN_EXTENSION_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
} from '../../../helpers/constants/routes';
import { isBeta } from '../../../helpers/utils/build-types';
import { getFirstTimeFlowType } from '../../../selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { setCompletedOnboarding } from '../../../store/actions';

export default function OnboardingSuccessful() {
  const history = useHistory();
  const t = useI18nContext();
  const dispatch = useDispatch();

  return (
    <div className="creation-successful" data-testid="creation-successful">
      <Box textAlign={TEXT_ALIGN.CENTER}>
        <Typography
          variant={TypographyVariant.H2}
          fontWeight={FONT_WEIGHT.BOLD}
          margin={6}
        >
          {t('extensionInsallCompleteTitle')}
        </Typography>
        <Typography variant={TypographyVariant.H4}>
          {t('extensionInsallCompleteDescription')}
        </Typography>
      </Box>

      <Box marginTop={6}>
        <Button
          data-testid="onboarding-complete-done"
          type="primary"
          large
          rounded
          onClick={async () => {
            await dispatch(setCompletedOnboarding());
            window.open('https://metamask-institutional.io/onboarding')
          }}
        >
          {t('continueMmiOnboarding')}
        </Button>
      </Box>
    </div>
  );
}
