import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { Carousel } from 'react-responsive-carousel';
import Typography from '../../../components/ui/typography/typography';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import OnboardingPinBillboard from './pin-billboard';

export default function OnboardingPinExtension() {
  const t = useI18nContext();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const history = useHistory();

  return (
    <div className="onboarding-pin-extension">
      <Typography
        variant={TYPOGRAPHY.H2}
        align={TEXT_ALIGN.CENTER}
        fontWeight={FONT_WEIGHT.BOLD}
      >
        {t('onboardingPinExtensionTitle')}
      </Typography>
      <Carousel
        selectedItem={selectedIndex}
        showThumbs={false}
        showStatus={false}
        showArrows={false}
      >
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
          <img
            src="/images/onboarding-pin-browser.svg"
            width="799"
            height="320"
            alt=""
          />
        </div>
      </Carousel>
      <div className="onboarding-pin-extension__buttons">
        <Button
          data-testid={
            selectedIndex === 0 ? 'pin-extension-next' : 'pin-extension-done'
          }
          type="primary"
          onClick={() => {
            if (selectedIndex === 0) {
              setSelectedIndex(1);
            } else {
              history.push(DEFAULT_ROUTE);
            }
          }}
        >
          {selectedIndex === 0 ? t('next') : t('done')}
        </Button>
      </div>
    </div>
  );
}
