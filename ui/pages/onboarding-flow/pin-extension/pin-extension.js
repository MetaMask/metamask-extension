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
import {
  setCompletedOnboarding,
  toggleExternalServices,
} from '../../../store/actions';
///: END:ONLY_INCLUDE_IF
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  TextVariant,
  FontWeight,
  Display,
  JustifyContent,
  BlockSize,
  FlexDirection,
  BorderRadius,
  IconColor,
} from '../../../helpers/constants/design-system';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  DEFAULT_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../../helpers/constants/routes';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
} from '../../../components/component-library';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
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
///: END:ONLY_INCLUDE_IF

export default function OnboardingPinExtension() {
  const t = useI18nContext();
  const history = useHistory();
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const externalServicesOnboardingToggleState = useSelector(
    getExternalServicesOnboardingToggleState,
  );

  const handleClick = async () => {
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
          <div className="onboarding-pin-extension__content">
            <Carousel
              selectedItem={selectedIndex}
              showThumbs={false}
              showStatus={false}
              dynamicHeight
              renderArrowPrev={(onClickHandler, hasPrev, label) => (
                <ButtonIcon
                  iconName={IconName.Arrow2Left}
                  size={ButtonIconSize.Lg}
                  iconProps={{
                    color: hasPrev
                      ? IconColor.iconDefault
                      : IconColor.iconMuted,
                  }}
                  borderRadius={BorderRadius.full}
                  className="onboarding-pin-extension__arrow"
                  disabled={!hasPrev}
                  title={label}
                  onClick={onClickHandler}
                  ariaLabel="prev"
                />
              )}
              renderArrowNext={(onClickHandler, hasNext, label) => (
                <ButtonIcon
                  iconName={IconName.Arrow2Right}
                  size={ButtonIconSize.Lg}
                  iconProps={{
                    color: hasNext
                      ? IconColor.iconDefault
                      : IconColor.iconMuted,
                  }}
                  borderRadius={BorderRadius.full}
                  className="onboarding-pin-extension__arrow onboarding-pin-extension__arrow--next"
                  disabled={!hasNext}
                  title={label}
                  onClick={onClickHandler}
                  ariaLabel="next"
                />
              )}
              onChange={(index) => setSelectedIndex(index)}
            >
              <div className="onboarding-pin-extension__image-container">
                <img src="/images/onboarding-extension-pin.svg" alt="" />
              </div>
              <div className="onboarding-pin-extension__image-container">
                <img src="/images/onboarding-extension-launch.svg" alt="" />
              </div>
            </Carousel>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              justifyContent={JustifyContent.flexStart}
              width={BlockSize.Full}
              marginTop={4}
              gap={4}
            >
              <Text
                variant={TextVariant.headingLg}
                as="h2"
                fontWeight={FontWeight.Bold}
              >
                {t('onboardingPinExtensionTitle')}
              </Text>
              {selectedIndex === 0 ? (
                <Box>
                  <Text variant={TextVariant.bodyMd}>
                    {t('onboardingPinExtensionDescription')}
                  </Text>
                </Box>
              ) : (
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  gap={4}
                >
                  <Text variant={TextVariant.bodyMd}>
                    {t('onboardingPinExtensionDescription2')}
                  </Text>
                  <Text variant={TextVariant.bodyMd}>
                    {t('onboardingPinExtensionDescription3')}
                  </Text>
                </Box>
              )}
            </Box>
          </div>
          <div className="onboarding-pin-extension__buttons">
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              block
              data-testid="pin-extension-done"
              onClick={handleClick}
            >
              {t('done')}
            </Button>
          </div>
        </>
        ///: END:ONLY_INCLUDE_IF
      }
    </div>
  );
}
