import React, { useState, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
  useDispatch,
  ///: END:ONLY_INCLUDE_IN
  useSelector,
} from 'react-redux';
///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
import { Carousel } from 'react-responsive-carousel';
import { setCompletedOnboarding } from '../../../store/actions';
import OnboardingPinBillboard from './pin-billboard';
///: END:ONLY_INCLUDE_IN
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import OnboardingPinMmiBillboard from '../../institutional/pin-mmi-billboard/pin-mmi-billboard';
///: END:ONLY_INCLUDE_IN
import { useI18nContext } from '../../../hooks/useI18nContext';
import Button from '../../../components/ui/button';
import {
  TextVariant,
  FontWeight,
  TextAlign,
} from '../../../helpers/constants/design-system';
import Box from '../../../components/ui/box';
import { MMI_ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { FIRST_TIME_FLOW_TYPES } from '../../../helpers/constants/onboarding';
import { getFirstTimeFlowType } from '../../../selectors';
import { Text } from '../../../components/component-library';

export default function OnboardingPinExtension() {
  const t = useI18nContext();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const history = useHistory();
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
  const dispatch = useDispatch();
  ///: END:ONLY_INCLUDE_IN
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  useEffect(() => setSelectedIndex(1), []);
  ///: END:ONLY_INCLUDE_IN

  const handleClick = async () => {
    if (selectedIndex === 0) {
      setSelectedIndex(1);
    } else {
      ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
      await dispatch(setCompletedOnboarding());
      ///: END:ONLY_INCLUDE_IN
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

      history.push(MMI_ONBOARDING_COMPLETION_ROUTE);
    }
  };

  return (
    <div
      className="onboarding-pin-extension"
      data-testid="onboarding-pin-extension"
    >
      {
        ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
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
        </>
        ///: END:ONLY_INCLUDE_IN
      }

      {
        ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
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
        ///: END:ONLY_INCLUDE_IN
      }

      <div className="onboarding-pin-extension__buttons">
        <Button
          data-testid={
            selectedIndex === 0 ? 'pin-extension-next' : 'pin-extension-done'
          }
          type="primary"
          onClick={handleClick}
        >
          {
            ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
            selectedIndex === 0 ? t('next') : t('done')
            ///: END:ONLY_INCLUDE_IN
          }
          {
            ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
            t('continue')
            ///: END:ONLY_INCLUDE_IN
          }
        </Button>
      </div>
    </div>
  );
}
