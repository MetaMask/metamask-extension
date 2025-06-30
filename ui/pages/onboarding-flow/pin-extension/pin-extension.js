import React, { useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Carousel } from 'react-responsive-carousel';
import classnames from 'classnames';
import {
  setCompletedOnboarding,
  toggleExternalServices,
} from '../../../store/actions';
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
  AlignItems,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
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
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';

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
    await dispatch(
      toggleExternalServices(externalServicesOnboardingToggleState),
    );
    await dispatch(setCompletedOnboarding());

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletSetupCompleted,
      properties: {
        wallet_setup_type:
          firstTimeFlowType === FirstTimeFlowType.import ? 'import' : 'new',
        new_wallet: firstTimeFlowType === FirstTimeFlowType.create,
      },
    });
    history.push(DEFAULT_ROUTE);
  };

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      gap={6}
      className="onboarding-pin-extension"
      data-testid="onboarding-pin-extension"
    >
      <Box>
        <Carousel
          selectedItem={selectedIndex}
          showThumbs={false}
          showStatus={false}
          dynamicHeight
          renderArrowPrev={(onClickHandler, hasPrev, label) => (
            <ButtonIcon
              iconName={IconName.Arrow2Left}
              size={ButtonIconSize.Lg}
              borderRadius={BorderRadius.full}
              borderWidth={2}
              borderColor={IconColor.iconDefault}
              className={classnames('onboarding-pin-extension__arrow', {
                'onboarding-pin-extension__arrow--disabled': !hasPrev,
              })}
              disabled={!hasPrev}
              title={label}
              onClick={onClickHandler}
              ariaLabel={t('prev')}
            />
          )}
          renderArrowNext={(onClickHandler, hasNext, label) => (
            <ButtonIcon
              iconName={IconName.Arrow2Right}
              size={ButtonIconSize.Lg}
              borderRadius={BorderRadius.full}
              borderWidth={2}
              borderColor={IconColor.iconDefault}
              className={classnames(
                'onboarding-pin-extension__arrow',
                'onboarding-pin-extension__arrow--next',
                {
                  'onboarding-pin-extension__arrow--disabled': !hasNext,
                },
              )}
              disabled={!hasNext}
              title={label}
              onClick={onClickHandler}
              ariaLabel={t('next')}
              data-testid="pin-extension-next"
            />
          )}
          onChange={(index) => setSelectedIndex(index)}
        >
          <Box
            display={Display.Flex}
            alignItems={AlignItems.flexStart}
            justifyContent={JustifyContent.center}
            className="onboarding-pin-extension__image-container"
          >
            <img
              src="/images/onboarding-extension-pin.svg"
              className="onboarding-pin-extension__image-pin"
              alt={t('onboardingPinExtensionAltPin')}
            />
          </Box>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.flexStart}
            justifyContent={JustifyContent.center}
            className="onboarding-pin-extension__image-container"
          >
            <img
              src="/images/onboarding-extension-launch.svg"
              className="onboarding-pin-extension__image-launch"
              alt={t('onboardingPinExtensionAltLaunch')}
            />
          </Box>
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
            fontWeight={FontWeight.Medium}
            as="h2"
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
                {t('onboardingPinExtensionDescription3', [getBrowserName()])}
              </Text>
            </Box>
          )}
        </Box>
      </Box>
      <Box>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          block
          data-testid="pin-extension-done"
          onClick={handleClick}
        >
          {t('done')}
        </Button>
      </Box>
    </Box>
  );
}
