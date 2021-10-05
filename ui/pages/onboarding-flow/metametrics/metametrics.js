import React from 'react';
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
import { useMetricEvent } from '../../../hooks/useMetricEvent';

const firstTimeFlowTypeNameMap = {
  create: 'Selected Create New Wallet',
  import: 'Selected Import Wallet',
};

export default function OnboardingMetametrics() {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();

  const nextRoute = useSelector(getFirstTimeFlowTypeRoute);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);

  const participateInMetaMetrics = Boolean(
    useSelector(getParticipateInMetaMetrics),
  );
  const firstTimeSelectionMetaMetricsName =
    firstTimeFlowTypeNameMap[firstTimeFlowType];

  const nonParticipationOptOut = useMetricEvent({
    eventOpts: {
      category: 'Onboarding',
      action: 'Metrics Option',
      name: 'Metrics Opt Out',
    },
    isOptIn: true,
    flushImmediately: true,
  });

  const nonParticipationOptIn = useMetricEvent({
    eventOpts: {
      category: 'Onboarding',
      action: 'Metrics Option',
      name: 'Metrics Opt In',
    },
    isOptIn: true,
    flushImmediately: true,
  });

  const onConfirm = async () => {
    const [, metaMetricsId] = await dispatch(setParticipateInMetaMetrics(true));

    const participationOptIn = useMetricEvent({
      eventOpts: {
        category: 'Onboarding',
        action: 'Import or Create',
        name: firstTimeSelectionMetaMetricsName,
      },
      isOptIn: true,
      metaMetricsId,
      flushImmediately: true,
    });

    try {
      if (!participateInMetaMetrics) {
        nonParticipationOptIn();
      }
      participationOptIn();
    } finally {
      history.push(nextRoute);
    }
  };

  const onCancel = async () => {
    await dispatch(setParticipateInMetaMetrics(false));

    try {
      if (!participateInMetaMetrics) {
        nonParticipationOptOut();
      }
    } finally {
      history.push(nextRoute);
    }
  };

  return (
    <div className="onboarding-metametrics">
      <Typography
        variant={TYPOGRAPHY.H2}
        align={TEXT_ALIGN.CENTER}
        fontWeight={FONT_WEIGHT.BOLD}
      >
        {t('metametricsTitle')}
      </Typography>
      <Typography align={TEXT_ALIGN.CENTER}>
        {t('metametricsOptInDescription2')}
      </Typography>
      <ul>
        <li>
          <i className="fa fa-check" />
          {t('metametricsCommitmentsAllowOptOut2')}
        </li>
        <li>
          <i className="fa fa-check" />
          {t('metametricsCommitmentsSendAnonymizedEvents')}
        </li>
        <li>
          <i className="fa fa-times" />
          {t('metametricsCommitmentsNeverCollect')}
        </li>
        <li>
          <i className="fa fa-times" />
          {t('metametricsCommitmentsNeverIP')}
        </li>
        <li>
          <i className="fa fa-times" />
          {t('metametricsCommitmentsNeverSell')}
        </li>
      </ul>
      <Typography color={COLORS.UI4}>
        {t('gdprMessage', [
          <a
            key="metametrics-bottom-text-wrapper"
            href="https://metamask.io/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('gdprMessagePrivacyPolicy')}
          </a>,
        ])}
      </Typography>
      <div className="onboarding-metametrics__buttons">
        <Button type="primary" onClick={onConfirm}>
          {t('affirmAgree')}
        </Button>
        <Button type="secondary" onClick={onCancel}>
          {t('noThanks')}
        </Button>
      </div>
    </div>
  );
}
