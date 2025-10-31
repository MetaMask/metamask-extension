import React, { useContext, useEffect, useRef, useState } from 'react';
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
  getIsParticipateInMetaMetricsSet,
  getParticipateInMetaMetrics,
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

  const participateInMetaMetricsSet = useSelector(
    getIsParticipateInMetaMetricsSet,
  );
  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);
  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);

  const [
    isParticipateInMetaMetricsChecked,
    setIsParticipateInMetaMetricsChecked,
  ] = useState(true);
  const [
    isDataCollectionForMarketingChecked,
    setIsDataCollectionForMarketingChecked,
  ] = useState(false);

  const participateCheckboxRef = useRef(null);
  const marketingCheckboxRef = useRef(null);

  useEffect(() => {
    if (participateInMetaMetricsSet) {
      setIsParticipateInMetaMetricsChecked(participateInMetaMetrics);
    }
    if (dataCollectionForMarketing) {
      setIsDataCollectionForMarketingChecked(dataCollectionForMarketing);
    }
  }, [
    participateInMetaMetricsSet,
    participateInMetaMetrics,
    dataCollectionForMarketing,
  ]);

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

  const handleContinue = async (e) => {
    e.preventDefault();
    try {
      if (isParticipateInMetaMetricsChecked) {
        dispatch(
          setDataCollectionForMarketing(isDataCollectionForMarketingChecked),
        );
        dispatch(setParticipateInMetaMetrics(true));

        await trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.AppInstalled,
        });
        await trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.AnalyticsPreferenceSelected,
          properties: {
            is_metrics_opted_in: true,
            has_marketing_consent: Boolean(isDataCollectionForMarketingChecked),
            location: 'onboarding_metametrics',
          },
        });
      } else {
        dispatch(setParticipateInMetaMetrics(false));
        dispatch(setDataCollectionForMarketing(false));
      }
    } catch (error) {
      log.error('onConfirm::error', error);
    } finally {
      navigate(nextRouteByBrowser);
    }
  };

  const handleParticipateInMetaMetricsChange = () => {
    setIsParticipateInMetaMetricsChecked((prev) => !prev);
    isParticipateInMetaMetricsChecked &&
      setIsDataCollectionForMarketingChecked(false);
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
          height={175}
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
        className="onboarding-metametrics__checkbox"
        role="button"
        tabIndex={0}
        onClick={() => {
          participateCheckboxRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            participateCheckboxRef.current?.click();
          }
        }}
      >
        <Checkbox
          id="metametrics-opt-in"
          data-testid="metametrics-checkbox"
          isChecked={isParticipateInMetaMetricsChecked}
          onChange={handleParticipateInMetaMetricsChange}
          inputRef={participateCheckboxRef}
          onClick={(e) => e.stopPropagation()}
          inputProps={{
            onClick: (e) => e.stopPropagation(),
          }}
          label={
            <Text variant={TextVariant.bodyMdMedium}>
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
        className={`${isParticipateInMetaMetricsChecked ? 'onboarding-metametrics__checkbox' : 'onboarding-metametrics__checkbox-disabled'}`}
        disabled={!isParticipateInMetaMetricsChecked}
        role={isParticipateInMetaMetricsChecked ? 'button' : undefined}
        tabIndex={isParticipateInMetaMetricsChecked ? 0 : undefined}
        onClick={
          isParticipateInMetaMetricsChecked
            ? () => {
                marketingCheckboxRef.current?.click();
              }
            : undefined
        }
        onKeyDown={
          isParticipateInMetaMetricsChecked &&
          ((e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              marketingCheckboxRef.current?.click();
            }
          })
        }
      >
        <Checkbox
          id="metametrics-datacollection-opt-in"
          data-testid="metametrics-data-collection-checkbox"
          isChecked={
            isParticipateInMetaMetricsChecked &&
            isDataCollectionForMarketingChecked
          }
          isDisabled={!isParticipateInMetaMetricsChecked}
          onChange={() => {
            setIsDataCollectionForMarketingChecked((prev) => !prev);
          }}
          inputRef={marketingCheckboxRef}
          onClick={(e) => e.stopPropagation()}
          inputProps={{
            onClick: (e) => e.stopPropagation(),
          }}
          label={
            <Text variant={TextVariant.bodyMdMedium}>
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
