import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Typography from '../../../components/ui/typography/typography';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  TEXT_ALIGN,
  COLORS,
} from '../../../helpers/constants/design-system';
import Button from '../../../components/ui/button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setParticipateInMetaMetrics } from '../../../store/actions';
import {
  getFirstTimeFlowTypeRoute,
  getFirstTimeFlowType,
  getParticipateInMetaMetrics,
} from '../../../selectors';

import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';

import { MetaMetricsContext } from '../../../contexts/metametrics';

export default function OnboardingMetametrics() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const nextRoute = useSelector(getFirstTimeFlowTypeRoute);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);

  const trackEvent = useContext(MetaMetricsContext);

  const onConfirm = async () => {
    const [, metaMetricsId] = await dispatch(setParticipateInMetaMetrics(true));

    const isInitiallyNotParticipating = !participateInMetaMetrics;

    try {
      if (isInitiallyNotParticipating) {
        trackEvent(
          {
            category: EVENT.CATEGORIES.ONBOARDING,
            event: EVENT_NAMES.ONBOARDING_WALLET_METRICS_PREFENCE_SELECTED,
            properties: {
              is_metrics_enabled: true,
            },
          },
          {
            isOptIn: true,
            flushImmediately: true,
          },
        );
      }
      trackEvent(
        {
          category: EVENT.CATEGORIES.ONBOARDING,
          event: EVENT_NAMES.WALLET_SETUP_STARTED,
          properties: {
            account_type:
              firstTimeFlowType === 'create'
                ? EVENT.ACCOUNT_TYPES.DEFAULT
                : EVENT.ACCOUNT_TYPES.IMPORTED,
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

    const isInitiallyParticipatingOrNotSet =
      participateInMetaMetrics === null || participateInMetaMetrics;

    try {
      if (isInitiallyParticipatingOrNotSet) {
        trackEvent(
          {
            category: EVENT.CATEGORIES.ONBOARDING,
            event: EVENT_NAMES.ONBOARDING_WALLET_METRICS_PREFENCE_SELECTED,
            properties: {
              is_metrics_enabled: false,
            },
          },
          {
            isOptIn: true,
            flushImmediately: true,
          },
        );
      }
    } finally {
      history.push(nextRoute);
    }
  };

  return (
    <div
      className="onboarding-metametrics"
      data-testid="onboarding-metametrics"
    >
      <Typography
        variant={TYPOGRAPHY.H2}
        align={TEXT_ALIGN.CENTER}
        fontWeight={FONT_WEIGHT.BOLD}
      >
        {t('onboardingMetametricsTitle')}
      </Typography>
      <Typography
        className="onboarding-metametrics__desc"
        align={TEXT_ALIGN.CENTER}
      >
        {t('onboardingMetametricsDescription')}
      </Typography>
      <Typography
        className="onboarding-metametrics__desc"
        align={TEXT_ALIGN.CENTER}
      >
        {t('onboardingMetametricsDescription2')}
      </Typography>
      <ul>
        <li>
          <i className="fa fa-check" />
          {t('onboardingMetametricsAllowOptOut')}
        </li>
        <li>
          <i className="fa fa-check" />
          {t('onboardingMetametricsSendAnonymize')}
        </li>
        <li>
          <i className="fa fa-times" />
          {t('onboardingMetametricsNeverCollect', [
            <Typography
              variant={TYPOGRAPHY.Span}
              key="never"
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('onboardingMetametricsNeverEmphasis')}
            </Typography>,
          ])}
        </li>
        <li>
          <i className="fa fa-times" />
          {t('onboardingMetametricsNeverCollectIP', [
            <Typography
              variant={TYPOGRAPHY.Span}
              key="never-collect"
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('onboardingMetametricsNeverEmphasis')}
            </Typography>,
          ])}
        </li>
        <li>
          <i className="fa fa-times" />
          {t('onboardingMetametricsNeverSellData', [
            <Typography
              variant={TYPOGRAPHY.Span}
              key="never-sell"
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('onboardingMetametricsNeverEmphasis')}
            </Typography>,
          ])}
        </li>
      </ul>
      <Typography
        color={COLORS.TEXT_ALTERNATIVE}
        align={TEXT_ALIGN.CENTER}
        variant={TYPOGRAPHY.H6}
        className="onboarding-metametrics__terms"
      >
        {t('onboardingMetametricsDataTerms')}
      </Typography>
      <Typography
        color={COLORS.TEXT_ALTERNATIVE}
        align={TEXT_ALIGN.CENTER}
        variant={TYPOGRAPHY.H6}
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
      </Typography>

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
