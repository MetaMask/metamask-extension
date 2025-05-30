import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Carousel } from 'react-responsive-carousel';
import {
  setCompletedOnboarding,
  toggleExternalServices,
} from '../../../store/actions';
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import {
  TextVariant,
  FontWeight,
  TextAlign,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { Text } from '../../../components/component-library';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  getFirstTimeFlowType,
  getExternalServicesOnboardingToggleState,
} from '../../../selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import OnboardingPinBillboard from './pin-billboard';

export default function OnboardingPinExtension() {
  const t = useI18nContext();
  const history = useHistory();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const externalServicesOnboardingToggleState = useSelector(
    getExternalServicesOnboardingToggleState,
  );

  const handleClick = async () => {
    if (selectedIndex === 0) {
      setSelectedIndex(1);
    } else {
      await dispatch(
        toggleExternalServices(externalServicesOnboardingToggleState),
      );
      await dispatch(setCompletedOnboarding());

      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.OnboardingWalletSetupComplete,
        properties: {
          wallet_setup_type:
            firstTimeFlowType === FirstTimeFlowType.import ? 'import' : 'new',
          new_wallet: firstTimeFlowType === FirstTimeFlowType.create,
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
      <>
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
      </>
    </div>
  );
}
