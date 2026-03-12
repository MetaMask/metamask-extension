import React, { useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import log from 'loglevel';
import {
  Box,
  Checkbox,
  Text,
  Button,
  ButtonSize,
  TextVariant,
  FontWeight,
  TextColor,
  BoxFlexDirection,
  BoxBackgroundColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setParticipateInMetaMetrics,
  setDataCollectionForMarketing,
  setPna25Acknowledged,
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
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';

const isFirefox = getBrowserName() === PLATFORM_FIREFOX;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
  // Check if the PNA25 feature is enabled
  const isPna25Enabled = process.env.EXTENSION_UX_PNA25;
  const [
    isParticipateInMetaMetricsChecked,
    setIsParticipateInMetaMetricsChecked,
  ] = useState(true);
  const [
    isDataCollectionForMarketingChecked,
    setIsDataCollectionForMarketingChecked,
  ] = useState(false);

  const participateCheckboxRef = useRef<{ toggle: () => void } | null>(null);
  const marketingCheckboxRef = useRef<{ toggle: () => void } | null>(null);

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

  const { trackEvent } = useContext(MetaMetricsContext);

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

  const handleContinue = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      // Set pna25Acknowledged to true for all new users who complete onboarding
      // This indicates they saw the updated policy during onboarding
      // Only set if feature flag is enabled, as the banner only shows when flag is enabled
      if (isPna25Enabled) {
        try {
          await dispatch(setPna25Acknowledged(true, true));
        } catch (error) {
          // Log error but don't block onboarding if state update fails
          log.error('Error setting pna25Acknowledged:', error);
        }
      }

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
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_metrics_opted_in: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
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
      navigate(nextRouteByBrowser, { replace: true });
    }
  };

  const handleParticipateInMetaMetricsChange = () => {
    setIsParticipateInMetaMetricsChecked((prev) => {
      const next = !prev;
      if (!next) {
        setIsDataCollectionForMarketingChecked(false);
      }
      return next;
    });
  };

  return (
    <Box
      className="onboarding-metametrics"
      data-testid="onboarding-metametrics"
      flexDirection={BoxFlexDirection.Column}
      gap={4}
    >
      <Text
        variant={TextVariant.HeadingLg}
        className="text-left"
        fontWeight={FontWeight.Bold}
      >
        {t('onboardingMetametricsTitle')}
      </Text>

      <Box className="onboarding-metametrics__user-control w-full">
        <img
          src="images/user-control.png"
          alt="User control"
          height={175}
          width={200}
          className="mx-auto"
        />
      </Box>

      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        fontWeight={FontWeight.Medium}
        className="text-left"
      >
        {t('onboardingMetametricsDescription')}
      </Text>

      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={2}
        padding={3}
        backgroundColor={BoxBackgroundColor.BackgroundMuted}
        className="onboarding-metametrics__checkbox rounded-lg"
        role="button"
        tabIndex={0}
        onClick={() => {
          participateCheckboxRef.current?.toggle();
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            participateCheckboxRef.current?.toggle();
          }
        }}
      >
        <Checkbox
          id="metametrics-opt-in"
          data-testid={`metametrics-checkbox-${isParticipateInMetaMetricsChecked ? 'checked' : 'unchecked'}`}
          isSelected={isParticipateInMetaMetricsChecked}
          onChange={handleParticipateInMetaMetricsChange}
          ref={participateCheckboxRef}
          onClick={(e: React.MouseEvent<HTMLLabelElement>) => {
            e.stopPropagation();
          }}
          inputProps={{
            onClick: (e: React.MouseEvent<HTMLInputElement>) => {
              e.stopPropagation();
            },
          }}
          label={
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {t('onboardingMetametricCheckboxTitleOne')}
            </Text>
          }
        />
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="text-left"
        >
          {isPna25Enabled
            ? t('onboardingMetametricCheckboxDescriptionOneUpdated')
            : t('onboardingMetametricCheckboxDescriptionOne')}
        </Text>
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={2}
        padding={3}
        backgroundColor={BoxBackgroundColor.BackgroundMuted}
        className={`${isParticipateInMetaMetricsChecked ? 'onboarding-metametrics__checkbox' : 'onboarding-metametrics__checkbox-disabled'} rounded-lg`}
        role={isParticipateInMetaMetricsChecked ? 'button' : undefined}
        tabIndex={isParticipateInMetaMetricsChecked ? 0 : undefined}
        onClick={
          isParticipateInMetaMetricsChecked
            ? () => {
                marketingCheckboxRef.current?.toggle();
              }
            : undefined
        }
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (
            (e.key === ' ' || e.key === 'Enter') &&
            isParticipateInMetaMetricsChecked
          ) {
            e.preventDefault();
            marketingCheckboxRef.current?.toggle();
          }
        }}
      >
        <Checkbox
          id="metametrics-datacollection-opt-in"
          data-testid={`metametrics-data-collection-checkbox-${isParticipateInMetaMetricsChecked && isDataCollectionForMarketingChecked ? 'checked' : 'unchecked'}`}
          isSelected={
            isParticipateInMetaMetricsChecked &&
            isDataCollectionForMarketingChecked
          }
          isDisabled={!isParticipateInMetaMetricsChecked}
          onChange={() => {
            setIsDataCollectionForMarketingChecked((prev) => !prev);
          }}
          ref={marketingCheckboxRef}
          onClick={(e: React.MouseEvent<HTMLLabelElement>) => {
            e.stopPropagation();
          }}
          inputProps={{
            onClick: (e: React.MouseEvent<HTMLInputElement>) => {
              e.stopPropagation();
            },
          }}
          label={
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {t('onboardingMetametricCheckboxTitleTwo')}
            </Text>
          }
        />
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="text-left"
        >
          {t('onboardingMetametricCheckboxDescriptionTwo')}
        </Text>
      </Box>

      <Box className="w-full">
        <Button
          data-testid="metametrics-i-agree"
          size={ButtonSize.Lg}
          className="w-full"
          onClick={handleContinue}
        >
          {t('onboardingMetametricsContinue')}
        </Button>
      </Box>
    </Box>
  );
}
