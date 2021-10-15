import React, { useState } from 'react';

import Typography from '../../../components/ui/typography/typography';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import OnboardingPinBillboard from './pin-billboard';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import { Carousel } from 'react-responsive-carousel';

export default function OnboardingPinExtension() {
  const t = useI18nContext();
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="onboarding-pin-extension">
      <Typography
        variant={TYPOGRAPHY.H2}
        align={TEXT_ALIGN.CENTER}
        fontWeight={FONT_WEIGHT.BOLD}
      >
        {t('onboardingPinExtensionTitle')}
      </Typography>
      <Carousel selectedItem={selectedIndex} showThumbs={false} showStatus={false} showArrows>
        <div>
          <Typography align={TEXT_ALIGN.CENTER}>
            {t('onboardingPinExtensionDescription')}
          </Typography>
          <div className="onboarding-pin-extension__diagram">
            <OnboardingPinBillboard />
          </div>
        </div>
        <div>
          <Typography align={TEXT_ALIGN.CENTER}>
            {t('onboardingPinExtensionDescription2')}
          </Typography>
          <Typography align={TEXT_ALIGN.CENTER}>
            {t('onboardingPinExtensionDescription3')}
          </Typography>
          <img src="/images/onboarding-pin-browser.svg" width="799" height="320" alt="" />
        </div>
      </Carousel>
      <div className="onboarding-pin-extension__buttons">
        <Button type="primary" onClick={() => {
          if(selectedIndex === 0) {
            setSelectedIndex(1)
          }
          else {
            // ToDo: Close onboarding?
          }
        }}>
          {selectedIndex === 0 ? t('next') : t('done')}
        </Button>
      </div>
    </div>
  );
}
