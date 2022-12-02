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
import { setParticipateInMetaMetrics, showModal } from '../../../store/actions';
import {
  getFirstTimeFlowTypeRoute,
  getFirstTimeFlowType,
  getParticipateInMetaMetrics,
} from '../../../selectors';

import { SECURITY_ROUTE } from '../../../helpers/constants/routes';
import { EVENT, EVENT_NAMES } from '../../../../shared/constants/metametrics';

import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Icon } from '../../../components/component-library';

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
            event: EVENT_NAMES.METRICS_OPT_IN,
            properties: {
              action: 'Metrics Option',
              legacy_event: true,
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
            event: EVENT_NAMES.METRICS_OPT_OUT,
            properties: {
              action: 'Metrics Option',
              legacy_event: true,
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
        {t('metametricsHelpImproveMetaMask')}
      </Typography>
      <Typography align={TEXT_ALIGN.CENTER}>
        {t('onboardingMetametricsIntro1', [
          <Typography
            variant={TYPOGRAPHY.Span}
            fontWeight={FONT_WEIGHT.BOLD}
            color={COLORS.TEXT_ALTERNATIVE}
            key="emphasized-text"
          >
            {t('onboardingMetametricsPrivateEmphasizedText')}
          </Typography>,
        ])}
      </Typography>
      <Typography align={TEXT_ALIGN.CENTER} marginBottom={8}>
        {t('onboardingMetametricsIntro2')}
      </Typography>

      <div className="onboarding-metametrics__grouping">
        <Icon
          name="eye-slash-filled"
          color={COLORS.PRIMARY_DEFAULT}
          marginRight={3}
        />
        <div className="onboarding-metametrics__grouping-text">
          <Typography
            variant={TYPOGRAPHY.H4}
            fontWeight={FONT_WEIGHT.BOLD}
            marginTop={0}
          >
            {t('onboardingMetametricsAnonymousTitle')}
          </Typography>
          <Typography color={COLORS.TEXT_ALTERNATIVE} marginBottom={8}>
            {t('onboardingMetametricsAnonymousText')}
          </Typography>
        </div>
      </div>

      <div className="onboarding-metametrics__grouping">
        <Icon
          name="security-key-filled"
          color={COLORS.PRIMARY_DEFAULT}
          marginRight={3}
        />
        <div className="onboarding-metametrics__grouping-text">
          <Typography
            variant={TYPOGRAPHY.H4}
            fontWeight={FONT_WEIGHT.BOLD}
            marginTop={0}
          >
            {t('onboardingMetametricsPrivateTitle')}
          </Typography>
          <Typography color={COLORS.TEXT_ALTERNATIVE} marginBottom={8}>
            {t('onboardingMetametricsPrivateText', [
              <a
                href="https://consensys.net/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                key="infura-link"
              >
                {t('infura')}
              </a>,
            ])}
          </Typography>
        </div>
      </div>

      <div className="onboarding-metametrics__grouping">
        <Icon
          name="setting-filled"
          color={COLORS.PRIMARY_DEFAULT}
          marginRight={3}
        />
        <div className="onboarding-metametrics__grouping-text">
          <Typography
            variant={TYPOGRAPHY.H4}
            fontWeight={FONT_WEIGHT.BOLD}
            marginTop={0}
          >
            {t('onboardingMetametricsOptionalTitle')}
          </Typography>
          <Typography marginBottom={8} color={COLORS.TEXT_ALTERNATIVE}>
            {t('onboardingMetametricsOptionalText')}
          </Typography>
        </div>
      </div>

      <div className="onboarding-metametrics__grouping">
        <Typography color={COLORS.TEXT_ALTERNATIVE} align={TEXT_ALIGN.CENTER}>
          {t('onboardingMetametricsFooter', [
            <a
              href="https://consensys.net/privacy-policy/"
              key="link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('gdprMessagePrivacyPolicy')}
            </a>,
          ])}
        </Typography>
      </div>

      <div className="onboarding-metametrics__buttons">
        <Button
          data-testid="metametrics-no-thanks"
          type="secondary"
          onClick={onCancel}
        >
          {t('onboardingMetametricsButtonDontShare')}
        </Button>
        <Button
          data-testid="metametrics-i-agree"
          type="primary"
          onClick={onConfirm}
        >
          {t('onboardingMetametricsButtonShare')}
        </Button>
      </div>
    </div>
  );
}
