import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  TextVariant,
  FontWeight,
  TextAlign,
  TextColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import Button from '../../../components/ui/button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setParticipateInMetaMetrics } from '../../../store/actions';
import {
  getFirstTimeFlowTypeRoute,
  getFirstTimeFlowType,
} from '../../../selectors';

import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';

import Box from '../../../components/ui/box/box';

export default function OnboardingMetametrics() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const nextRoute = useSelector(getFirstTimeFlowTypeRoute);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const trackEvent = useContext(MetaMetricsContext);

  const onConfirm = async () => {
    const [, metaMetricsId] = await dispatch(setParticipateInMetaMetrics(true));
    try {
      trackEvent(
        {
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.WalletSetupStarted,
          properties: {
            account_type:
              firstTimeFlowType === 'create'
                ? MetaMetricsEventAccountType.Default
                : MetaMetricsEventAccountType.Imported,
          },
        },
        {
          isOptIn: true,
          metaMetricsId,
          flushImmediately: true,
        },
      );
    } finally {
      history.push(nextRoute);
    }
  };

  const onCancel = async () => {
    await dispatch(setParticipateInMetaMetrics(false));
    history.push(nextRoute);
  };

  return (
    <div
      className="onboarding-metametrics"
      data-testid="onboarding-metametrics"
    >
      <Text
        variant={TextVariant.headingLg}
        as="h2"
        textAlign={TextAlign.Center}
        fontWeight={FontWeight.Bold}
      >
        {t('onboardingMetametricsTitle')}
      </Text>
      <Text className="onboarding-metametrics__desc" align={TextAlign.Center}>
        {t('onboardingMetametricsDescription')}
      </Text>
      <Text className="onboarding-metametrics__desc" align={TextAlign.Center}>
        {t('onboardingMetametricsDescription2')}
      </Text>
      <ul>
        <li>
          <Icon
            name={IconName.Check}
            color={IconColor.successDefault}
            marginInlineEnd={3}
          />
          {t('onboardingMetametricsAllowOptOut')}
        </li>
        <li>
          <Icon
            name={IconName.Check}
            color={IconColor.successDefault}
            marginInlineEnd={3}
          />
          {t('onboardingMetametricsSendAnonymize')}
        </li>
        <li>
          <Box>
            <Icon
              marginInlineEnd={2}
              name={IconName.Close}
              size={IconSize.Sm}
              color={IconColor.errorDefault}
            />
            {t('onboardingMetametricsNeverCollect', [
              <Text
                as="span"
                variant={TextVariant.bodyMd}
                key="never"
                fontWeight={FontWeight.Bold}
              >
                {t('onboardingMetametricsNeverEmphasis')}
              </Text>,
            ])}
          </Box>
        </li>
        <li>
          <Box>
            <Icon
              marginInlineEnd={2}
              name={IconName.Close}
              size={IconSize.Sm}
              color={IconColor.errorDefault}
            />
            {t('onboardingMetametricsNeverCollectIP', [
              <Text
                as="span"
                variant={TextVariant.bodyMd}
                key="never-collect"
                fontWeight={FontWeight.Bold}
              >
                {t('onboardingMetametricsNeverEmphasis')}
              </Text>,
            ])}
          </Box>
        </li>
        <li>
          <Box>
            <Icon
              marginInlineEnd={2}
              name={IconName.Close}
              size={IconSize.Sm}
              color={IconColor.errorDefault}
            />
            {t('onboardingMetametricsNeverSellData', [
              <Text
                as="span"
                variant={TextVariant.bodyMd}
                key="never-sell"
                fontWeight={FontWeight.Bold}
              >
                {t('onboardingMetametricsNeverEmphasis')}
              </Text>,
            ])}
          </Box>{' '}
        </li>
      </ul>
      <Text
        color={TextColor.textAlternative}
        align={TextAlign.Center}
        variant={TextVariant.bodySm}
        as="h6"
        className="onboarding-metametrics__terms"
      >
        {t('onboardingMetametricsDataTerms')}
      </Text>
      <Text
        color={TextColor.textAlternative}
        align={TextAlign.Center}
        variant={TextVariant.bodySm}
        as="h6"
        className="onboarding-metametrics__terms"
      >
        {t('onboardingMetametricsInfuraTerms', [
          <a
            href="https://consensys.net/blog/news/consensys-data-retention-update/"
            target="_blank"
            rel="noopener noreferrer"
            key="retention-link"
          >
            {t('onboardingMetametricsInfuraTermsPolicyLink')}
          </a>,
          <a
            href="https://metamask.io/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            key="privacy-link"
          >
            {t('onboardingMetametricsInfuraTermsPolicy')}
          </a>,
        ])}
      </Text>

      <div className="onboarding-metametrics__buttons">
        <Button
          data-testid="metametrics-i-agree"
          type="primary"
          large
          onClick={onConfirm}
        >
          {t('onboardingMetametricsAgree')}
        </Button>
        <Button
          data-testid="metametrics-no-thanks"
          type="secondary"
          large
          onClick={onCancel}
        >
          {t('onboardingMetametricsDisagree')}
        </Button>
      </div>
    </div>
  );
}
