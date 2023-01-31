import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
import { setCompletedOnboarding } from '../../../store/actions';
import { EVENT_NAMES, EVENT } from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { FIRST_TIME_FLOW_TYPES } from '../../../helpers/constants/onboarding';
import { getFirstTimeFlowType } from '../../../selectors';
import OnboardingPinBillboard from './pin-billboard';

export default function OnboardingPinExtension() {
  const t = useI18nContext();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const history = useHistory();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const handleClick = async () => {
    if (selectedIndex === 0) {
      setSelectedIndex(1);
    } else {
      await dispatch(setCompletedOnboarding());
      trackEvent({
        category: EVENT.CATEGORIES.ONBOARDING,
        event: EVENT_NAMES.ONBOARDING_WALLET_SETUP_COMPLETE,
        properties: {
          wallet_setup_type:
            firstTimeFlowType === FIRST_TIME_FLOW_TYPES.IMPORT
              ? 'import'
              : 'new',
          new_wallet: firstTimeFlowType === FIRST_TIME_FLOW_TYPES.CREATE,
        },
      });
      history.push(DEFAULT_ROUTE);
    }
  };

  return (
    <div
      className="onboarding-pin-extension"
      data-testid="onboarding-pin-extension"
    >
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
        onChange={(index) => setSelectedIndex(index)}
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
          onClick={handleClick}
        >
          {selectedIndex === 0 ? t('next') : t('done')}
        </Button>
      </div>
    </div>
  );
}
