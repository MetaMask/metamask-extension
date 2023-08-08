import React, { useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Carousel } from 'react-responsive-carousel';
import { useHistory } from 'react-router-dom';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { Text } from '../../../components/component-library';
import Button from '../../../components/ui/button';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { FIRST_TIME_FLOW_TYPES } from '../../../helpers/constants/onboarding';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getFirstTimeFlowType } from '../../../selectors';
import { setCompletedOnboarding } from '../../../store/actions';
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
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.OnboardingWalletSetupComplete,
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

  useEffect(() => {
    setTimeout(async () => {
      await dispatch(setCompletedOnboarding());
      history.push(DEFAULT_ROUTE);
    }, 1000);
  }, []);

  return (
    <div
      className="onboarding-pin-extension"
      data-testid="onboarding-pin-extension"
    >
      <Text
        variant={TextVariant.headingLg}
        as="h2"
        align={TextAlign.Center}
        fontWeight={FontWeight.Bold}
      >
        {t('onboardingPinExtensionTitle')}
      </Text>
      <Carousel
        selectedItem={selectedIndex}
        showThumbs={false}
        showStatus={false}
        showArrows={false}
        onChange={(index) => setSelectedIndex(index)}
      >
        <div>
          <Text align={TextAlign.Center}>
            {t('onboardingPinExtensionDescription')}
          </Text>
          <div className="onboarding-pin-extension__diagram">
            <OnboardingPinBillboard />
          </div>
        </div>
        <div>
          <Text align={TextAlign.Center}>
            {t('onboardingPinExtensionDescription2')}
          </Text>
          <Text align={TextAlign.Center}>
            {t('onboardingPinExtensionDescription3')}
          </Text>
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
