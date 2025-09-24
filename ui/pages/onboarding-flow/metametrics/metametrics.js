import React, { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import log from 'loglevel';

import {
  Display,
  FlexDirection,
  TextVariant,
  FontWeight,
  TextAlign,
  TextColor,
  BlockSize,
  AlignItems,
  JustifyContent,
  BorderRadius,
  BackgroundColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setParticipateInMetaMetrics,
  setDataCollectionForMarketing,
} from '../../../store/actions';
import {
  getCurrentKeyring,
  getDataCollectionForMarketing,
  getFirstTimeFlowType,
  getFirstTimeFlowTypeRouteAfterMetaMetricsOptIn,
} from '../../../selectors';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';

import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  Box,
  Checkbox,
  Text,
  Button,
  ButtonSize,
} from '../../../components/component-library';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';

const isFirefox = getBrowserName() === PLATFORM_FIREFOX;

export default function OnboardingMetametrics() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);

  const currentKeyring = useSelector(getCurrentKeyring);

  const trackEvent = useContext(MetaMetricsContext);

  let nextRouteByBrowser = useSelector(
    getFirstTimeFlowTypeRouteAfterMetaMetricsOptIn,
  );
  if (isFirefox && firstTimeFlowType !== FirstTimeFlowType.restore) {
    if (
      currentKeyring &&
      firstTimeFlowType === FirstTimeFlowType.socialCreate
    ) {
      nextRouteByBrowser = ONBOARDING_COMPLETION_ROUTE;
    } else {
      nextRouteByBrowser = ONBOARDING_WELCOME_ROUTE;
    }
  }

  const [
    isParticipateInMetaMetricsChecked,
    setIsParticipateInMetaMetricsChecked,
  ] = useState(true);

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!isParticipateInMetaMetricsChecked) {
      await dispatch(setParticipateInMetaMetrics(false));
      await dispatch(setDataCollectionForMarketing(false));
      navigate(nextRouteByBrowser);
      return;
    }

    await dispatch(
      setDataCollectionForMarketing(Boolean(dataCollectionForMarketing)),
    );
    await dispatch(setParticipateInMetaMetrics(true));

    try {
      await trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.AppInstalled,
      });

      await trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.AnalyticsPreferenceSelected,
        properties: {
          is_metrics_opted_in: true,
          has_marketing_consent: Boolean(dataCollectionForMarketing),
          location: 'onboarding_metametrics',
        },
      });
    } catch (error) {
      log.error('onConfirm::error', error);
    } finally {
      navigate(nextRouteByBrowser);
    }
  };

  return (
    <Box
      className="onboarding-metametrics"
      data-testid="onboarding-metametrics"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={4}
    >
      <Text
        variant={TextVariant.headingLg}
        textAlign={TextAlign.Left}
        fontWeight={FontWeight.Bold}
        marginBottom={4}
      >
        {t('onboardingMetametricsTitle')}
      </Text>

      <Box
        width={BlockSize.Full}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        className="onboarding-metametrics__user-control"
      >
        <img
          src="images/user-control.png"
          alt="User control"
          height={200}
          width={200}
        />
      </Box>

      <Text
        variant={TextVariant.bodySmMedium}
        color={TextColor.textAlternative}
        textAlign={TextAlign.Left}
      >
        {t('onboardingMetametricsDescription')}
      </Text>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        padding={3}
        borderRadius={BorderRadius.LG}
        backgroundColor={BackgroundColor.backgroundMuted}
        onClick={() => setIsParticipateInMetaMetricsChecked((prev) => !prev)}
        className="onboarding-metametrics__checkbox"
      >
        <Checkbox
          id="metametrics-opt-in"
          data-testid="metametrics-checkbox"
          isChecked={isParticipateInMetaMetricsChecked}
          onChange={(e) =>
            setIsParticipateInMetaMetricsChecked(e.target.checked)
          }
          label={
            <Text
              fontWeight={FontWeight.Medium}
              onClick={() =>
                setIsParticipateInMetaMetricsChecked((prev) => !prev)
              }
            >
              {t('onboardingMetametricCheckboxTitleOne')}
            </Text>
          }
          alignItems={AlignItems.center}
        />
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          textAlign={TextAlign.Left}
        >
          {t('onboardingMetametricCheckboxDescriptionOne')}
        </Text>
      </Box>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        padding={3}
        borderRadius={BorderRadius.LG}
        backgroundColor={BackgroundColor.backgroundMuted}
        onClick={() =>
          dispatch(setDataCollectionForMarketing(!dataCollectionForMarketing))
        }
        className="onboarding-metametrics__checkbox"
      >
        <Checkbox
          id="metametrics-datacollection-opt-in"
          data-testid="metametrics-data-collection-checkbox"
          isChecked={dataCollectionForMarketing}
          onClick={() =>
            dispatch(setDataCollectionForMarketing(!dataCollectionForMarketing))
          }
          label={
            <Text
              fontWeight={FontWeight.Medium}
              onClick={() =>
                dispatch(
                  setDataCollectionForMarketing(!dataCollectionForMarketing),
                )
              }
            >
              {t('onboardingMetametricCheckboxTitleTwo')}
            </Text>
          }
          alignItems={AlignItems.center}
        />
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          textAlign={TextAlign.Left}
        >
          {t('onboardingMetametricCheckboxDescriptionTwo')}
        </Text>
      </Box>

      <Box width={BlockSize.Full}>
        <Button
          data-testid="metametrics-i-agree"
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={handleContinue}
        >
          {t('onboardingMetametricsContinue')}
        </Button>
      </Box>
    </Box>
  );
}
