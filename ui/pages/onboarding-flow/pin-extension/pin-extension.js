import React from 'react';

import Typography from '../../../components/ui/typography/typography';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';

export default function OnboardingPinExtension() {
  const t = useI18nContext();

  return (
    <div className="onboarding-pin-extension">
      <Typography
        variant={TYPOGRAPHY.H2}
        align={TEXT_ALIGN.CENTER}
        fontWeight={FONT_WEIGHT.BOLD}
      >
        {t('onboardingPinExtensionTitle')}
      </Typography>
      <Typography align={TEXT_ALIGN.CENTER}>
        {t('onboardingPinExtensionDescription')}
      </Typography>
      <div className="onboarding-pin-extension__diagram"></div>
      <div className="onboarding-pin-extension__buttons">
        <Button type="primary" onClick={() => {}}>
          {t('onboardingPinExtensionContinueText')}
        </Button>
      </div>
    </div>
  );
}
