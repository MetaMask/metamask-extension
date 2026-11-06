import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
  TextAlign,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setParticipateInMetaMetrics,
  setDataCollectionForMarketing,
  setPna25Acknowledged,
} from '../../../store/actions';
import {
  getDataCollectionForMarketing,
  getFirstTimeFlowType,
  getFirstTimeFlowTypeRouteAfterMetaMetricsOptIn,
  getConsentDecisionMade,
  getOptedIn,
} from '../../../selectors';
import { getCurrentKeyring } from '../../../../shared/lib/selectors/keyring';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../shared/constants/metametrics';
import {
  ONBOARDING_REFERRAL_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';

import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { useIsFirefox } from '../../../hooks/useIsFirefox';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useDispatch } from '../../../store/hooks';

type MetametricsCheckboxOptionProps = Readonly<{
  id: string;
  testId: string;
  isSelected: boolean;
  onChange: () => void;
  label: React.ReactNode;
  description: React.ReactNode;
}>;

const stopClickPropagation = (e: React.MouseEvent) => {
  e.stopPropagation();
};

// eslint-disable-next-line @typescript-eslint/naming-convention
function MetametricsCheckboxOption({
  id,
  testId,
  isSelected,
  onChange,
  label,
  description,
}: Readonly<MetametricsCheckboxOptionProps>) {
  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      padding={3}
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
      className="onboarding-metametrics__checkbox rounded-lg"
      data-testid={testId}
      data-checked={String(isSelected)}
      role="button"
      tabIndex={0}
      onClick={onChange}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange();
        }
      }}
    >
      <Checkbox
        id={id}
        isSelected={isSelected}
        onChange={onChange}
        onClick={stopClickPropagation}
        inputProps={{ onClick: stopClickPropagation }}
        label={label}
      />
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.TextAlternative}
        className="text-left"
      >
        {description}
      </Text>
    </Box>
  );
}

export default function OnboardingMetametrics() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isFirefox = useIsFirefox();

  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const consentDecisionMade = useSelector(getConsentDecisionMade);
  const isOptedIn = useSelector(getOptedIn);
  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);

  const [checkboxDraft, setCheckboxDraft] = useState({
    participateTouched: false,
    marketingTouched: false,
    participateLocal: true,
    marketingLocal: false,
  });
  const {
    participateTouched,
    marketingTouched,
    participateLocal,
    marketingLocal,
  } = checkboxDraft;

  let isParticipateInMetaMetricsChecked = true;
  if (participateTouched) {
    isParticipateInMetaMetricsChecked = participateLocal;
  } else if (consentDecisionMade) {
    isParticipateInMetaMetricsChecked = isOptedIn;
  }
  const isDataCollectionForMarketingChecked = marketingTouched
    ? marketingLocal
    : Boolean(dataCollectionForMarketing);

  const currentKeyring = useSelector(getCurrentKeyring);

  const { trackEvent, createEventBuilder } = useAnalytics();

  let nextRouteByBrowser = useSelector(
    getFirstTimeFlowTypeRouteAfterMetaMetricsOptIn,
  );
  if (isFirefox && firstTimeFlowType !== FirstTimeFlowType.restore) {
    if (
      currentKeyring &&
      firstTimeFlowType === FirstTimeFlowType.socialCreate
    ) {
      nextRouteByBrowser = ONBOARDING_REFERRAL_ROUTE;
    } else {
      nextRouteByBrowser = ONBOARDING_WELCOME_ROUTE;
    }
  }

  const handleContinue = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      // Set pna25Acknowledged to true for all new users who complete onboarding
      // This indicates they saw the updated policy during onboarding
      try {
        await dispatch(setPna25Acknowledged(true, true));
      } catch (error) {
        // Log error but don't block onboarding if state update fails
        log.error('Error setting pna25Acknowledged:', error);
      }

      if (isParticipateInMetaMetricsChecked) {
        trackEvent(
          createEventBuilder(MetaMetricsEventName.AppInstalled)
            .addCategory(MetaMetricsEventCategory.Onboarding)
            .build(),
        );

        trackEvent(
          createEventBuilder(MetaMetricsEventName.AnalyticsPreferenceSelected)
            .addCategory(MetaMetricsEventCategory.Onboarding)
            .addProperties({
              [MetaMetricsUserTrait.IsMetricsOptedIn]: true,
              [MetaMetricsUserTrait.HasMarketingConsent]:
                isDataCollectionForMarketingChecked,
              location: 'onboarding_metametrics',
            })
            .build(),
        );
      }

      dispatch(
        setDataCollectionForMarketing(isDataCollectionForMarketingChecked),
      );
      dispatch(setParticipateInMetaMetrics(isParticipateInMetaMetricsChecked));
    } catch (error) {
      log.error('onConfirm::error', error);
    } finally {
      navigate(nextRouteByBrowser, { replace: true });
    }
  };

  const handleParticipateInMetaMetricsChange = () => {
    setCheckboxDraft((prev) => ({
      ...prev,
      participateTouched: true,
      participateLocal: !isParticipateInMetaMetricsChecked,
    }));
  };

  const handleMarketingChange = () => {
    setCheckboxDraft((prev) => ({
      ...prev,
      marketingTouched: true,
      marketingLocal: !isDataCollectionForMarketingChecked,
    }));
  };

  return (
    <Box
      className="onboarding-metametrics"
      data-testid="parent-selector-onboarding-metrics"
      flexDirection={BoxFlexDirection.Column}
      gap={4}
    >
      <Text
        variant={TextVariant.HeadingLg}
        textAlign={TextAlign.Left}
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
        textAlign={TextAlign.Left}
      >
        {t('onboardingMetametricsDescription')}
      </Text>

      <MetametricsCheckboxOption
        id="metametrics-opt-in"
        testId="metametrics-checkbox"
        isSelected={isParticipateInMetaMetricsChecked}
        onChange={handleParticipateInMetaMetricsChange}
        label={
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('onboardingMetametricCheckboxTitleOne')}
          </Text>
        }
        description={t('onboardingMetametricCheckboxDescriptionOneUpdated')}
      />

      <MetametricsCheckboxOption
        id="metametrics-datacollection-opt-in"
        testId="metametrics-data-collection-checkbox"
        isSelected={isDataCollectionForMarketingChecked}
        onChange={handleMarketingChange}
        label={
          <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
            {t('onboardingMetametricCheckboxTitleTwo')}
          </Text>
        }
        description={t('onboardingMetametricCheckboxDescriptionTwo')}
      />

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
