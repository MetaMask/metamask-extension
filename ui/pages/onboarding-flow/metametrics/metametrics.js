import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import {
  Display,
  FlexDirection,
  TextVariant,
  FontWeight,
  TextAlign,
  TextColor,
  IconColor,
  BlockSize,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  setParticipateInMetaMetrics,
  setDataCollectionForMarketing,
} from '../../../store/actions';
import {
  getDataCollectionForMarketing,
  getFirstTimeFlowType,
  getFirstTimeFlowTypeRouteAfterMetaMetricsOptIn,
} from '../../../selectors';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { ONBOARDING_WELCOME_ROUTE } from '../../../helpers/constants/routes';

import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  Box,
  Checkbox,
  Icon,
  IconName,
  IconSize,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
} from '../../../components/component-library';
import { discardBufferedTraces } from '../../../../shared/lib/trace';
import { submitRequestToBackground } from '../../../store/background-connection';

import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';

const isFirefox = getBrowserName() === PLATFORM_FIREFOX;

export default function OnboardingMetametrics() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const dataCollectionForMarketing = useSelector(getDataCollectionForMarketing);
  const trackEvent = useContext(MetaMetricsContext);

  let nextRouteByBrowser = useSelector(
    getFirstTimeFlowTypeRouteAfterMetaMetricsOptIn,
  );
  if (
    isFirefox &&
    firstTimeFlowType !== FirstTimeFlowType.restore &&
    firstTimeFlowType !== FirstTimeFlowType.socialImport
  ) {
    nextRouteByBrowser = ONBOARDING_WELCOME_ROUTE;
  }

  const onConfirm = async () => {
    if (dataCollectionForMarketing === null) {
      await dispatch(setDataCollectionForMarketing(false));
    }
    await dispatch(setParticipateInMetaMetrics(true));
    try {
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.AppInstalled,
      });

      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.AnalyticsPreferenceSelected,
        properties: {
          is_metrics_opted_in: true,
          has_marketing_consent: Boolean(dataCollectionForMarketing),
          location: 'onboarding_metametrics',
        },
      });
      // Flush buffered events when user opts in
      await submitRequestToBackground('trackEventsAfterMetricsOptIn');
      await submitRequestToBackground('clearEventsAfterMetricsOptIn');
    } finally {
      history.push(nextRouteByBrowser);
    }
  };

  const onCancel = async () => {
    await dispatch(setParticipateInMetaMetrics(false));
    await dispatch(setDataCollectionForMarketing(false));
    await submitRequestToBackground('clearEventsAfterMetricsOptIn');
    discardBufferedTraces();
    await submitRequestToBackground('clearEventsAfterMetricsOptIn');
    history.push(nextRouteByBrowser);
  };

  return (
    <div
      className="onboarding-metametrics"
      data-testid="onboarding-metametrics"
    >
      <Text
        variant={TextVariant.headingLg}
        textAlign={TextAlign.Left}
        fontWeight={FontWeight.Bold}
        marginBottom={4}
      >
        {t('onboardingMetametricsTitle')}
      </Text>
      <Text className="onboarding-metametrics__desc" textAlign={TextAlign.Left}>
        {t('onboardingMetametricsDescription')}
      </Text>
      <ul>
        <li>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            paddingBottom={4}
          >
            <Icon
              marginInlineEnd={2}
              name={IconName.Check}
              size={IconSize.Sm}
              color={IconColor.successDefault}
            />
            <Text color={TextColor.textAlternative}>
              {t('onboardingMetametricsNeverCollect', [
                <Text
                  variant={TextVariant.inherit}
                  key="never"
                  fontWeight={FontWeight.Bold}
                  color={TextColor.textDefault}
                  marginTop={0}
                >
                  {t('onboardingMetametricsNeverCollectEmphasis')}
                </Text>,
              ])}
            </Text>
          </Box>
        </li>
        <li>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            paddingBottom={4}
          >
            <Icon
              marginInlineEnd={2}
              name={IconName.Check}
              size={IconSize.Sm}
              color={IconColor.successDefault}
            />
            <Text color={TextColor.textAlternative}>
              {t('onboardingMetametricsNeverCollectIP', [
                <Text
                  variant={TextVariant.inherit}
                  key="never-collect"
                  fontWeight={FontWeight.Bold}
                  color={TextColor.textDefault}
                >
                  {t('onboardingMetametricsNeverCollectIPEmphasis')}
                </Text>,
              ])}
            </Text>
          </Box>
        </li>
        <li>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            paddingBottom={4}
          >
            <Icon
              marginInlineEnd={2}
              name={IconName.Check}
              size={IconSize.Sm}
              color={IconColor.successDefault}
            />
            <Text color={TextColor.textAlternative}>
              {t('onboardingMetametricsNeverSellData', [
                <Text
                  variant={TextVariant.inherit}
                  key="never-sell"
                  fontWeight={FontWeight.Bold}
                  color={TextColor.textDefault}
                >
                  {t('onboardingMetametricsNeverSellDataEmphasis')}
                </Text>,
              ])}
            </Text>
          </Box>
        </li>
      </ul>
      <Checkbox
        id="metametrics-opt-in"
        data-testid="metametrics-data-collection-checkbox"
        isChecked={dataCollectionForMarketing}
        onClick={() =>
          dispatch(setDataCollectionForMarketing(!dataCollectionForMarketing))
        }
        label={
          <Text variant={TextVariant.bodySm} fontWeight={FontWeight.Medium}>
            {t('onboardingMetametricsUseDataCheckbox')}
          </Text>
        }
        paddingBottom={3}
        alignItems={AlignItems.flexStart}
      />
      <Text
        color={TextColor.textAlternative}
        textAlign={TextAlign.Left}
        variant={TextVariant.bodySm}
        paddingTop={4}
        className="onboarding-metametrics__terms"
      >
        {t('onboardingMetametricsInfuraTerms', [
          <a
            href={
              isFirefox
                ? 'https://addons.mozilla.org/en-CA/firefox/addon/ether-metamask/privacy/'
                : 'https://metamask.io/privacy.html'
            }
            target="_blank"
            rel="noopener noreferrer"
            key="privacy-link"
          >
            {t('onboardingMetametricsInfuraTermsPolicy')}
          </a>,
        ])}
      </Text>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        width={BlockSize.Full}
        className="onboarding-metametrics__buttons"
        marginTop={6}
        marginBottom={4}
        gap={4}
      >
        <Button
          data-testid="metametrics-no-thanks"
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={onCancel}
        >
          {t('noThanks')}
        </Button>
        <Button
          data-testid="metametrics-i-agree"
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={onConfirm}
        >
          {t('onboardingMetametricsAgree')}
        </Button>
      </Box>
    </div>
  );
}
