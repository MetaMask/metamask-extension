import React, {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  useState,
  useContext,
  ///: END:ONLY_INCLUDE_IF
} from 'react';
import { useHistory } from 'react-router-dom';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { useDispatch, useSelector } from 'react-redux';
import { Carousel } from 'react-responsive-carousel';
import { setCompletedOnboarding } from '../../../store/actions';
///: END:ONLY_INCLUDE_IF
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import {
  TextVariant,
  FontWeight,
  TextAlign,
} from '../../../helpers/constants/design-system';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  DEFAULT_ROUTE,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  MMI_ONBOARDING_COMPLETION_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/routes';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import Box from '../../../components/ui/box';
import OnboardingPinMmiBillboard from '../../institutional/pin-mmi-billboard/pin-mmi-billboard';
///: END:ONLY_INCLUDE_IF
import { Text } from '../../../components/component-library';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getFirstTimeFlowType } from '../../../selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import OnboardingPinBillboard from './pin-billboard';
///: END:ONLY_INCLUDE_IF

export default function OnboardingPinExtension() {
  const t = useI18nContext();
  const history = useHistory();
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  ///: END:ONLY_INCLUDE_IF

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
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
            firstTimeFlowType === FirstTimeFlowType.import ? 'import' : 'new',
          new_wallet: firstTimeFlowType === FirstTimeFlowType.create,
        },
      });
      history.push(DEFAULT_ROUTE);
    }
  };
  ///: END:ONLY_INCLUDE_IF

  return (
    <div
      className="onboarding-pin-extension"
      data-testid="onboarding-pin-extension"
    >
      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
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
                selectedIndex === 0
                  ? 'pin-extension-next'
                  : 'pin-extension-done'
              }
              type="primary"
              onClick={handleClick}
            >
              {selectedIndex === 0 ? t('next') : t('done')}
            </Button>
          </div>
        </>
        ///: END:ONLY_INCLUDE_IF
      }

      {
        ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
        <>
          <div>
            <Box textAlign={TextAlign.Center}>
              <Text
                variant={TextVariant.headingLg}
                align={TextAlign.Center}
                fontWeight={FontWeight.Bold}
              >
                {t('pinExtensionTitle')}
              </Text>
              <Text marginTop={3} marginBottom={3}>
                {t('pinExtensionDescription')}
              </Text>
              <OnboardingPinMmiBillboard />
            </Box>
          </div>
          <div className="onboarding-pin-extension__buttons">
            <Button
              type="primary"
              onClick={() => history.push(MMI_ONBOARDING_COMPLETION_ROUTE)}
            >
              {t('continue')}
            </Button>
          </div>
        </>
        ///: END:ONLY_INCLUDE_IF
      }
    </div>
  );
}
