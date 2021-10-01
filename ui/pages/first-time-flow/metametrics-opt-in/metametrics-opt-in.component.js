import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Typography from '../../../components/ui/typography/typography';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';

export default class MetaMetricsOptIn extends Component {
  static propTypes = {
    history: PropTypes.object,
    setParticipateInMetaMetrics: PropTypes.func,
    nextRoute: PropTypes.string,
    firstTimeSelectionMetaMetricsName: PropTypes.string,
    participateInMetaMetrics: PropTypes.bool,
  };

  static contextTypes = {
    metricsEvent: PropTypes.func,
    t: PropTypes.func,
  };

  render() {
    const { metricsEvent, t } = this.context;
    const {
      nextRoute,
      history,
      setParticipateInMetaMetrics,
      firstTimeSelectionMetaMetricsName,
      participateInMetaMetrics,
    } = this.props;

    return (
      <div className="metametrics-opt-in">
        <div className="metametrics-opt-in__main">
          <Typography variant={TYPOGRAPHY.H2} fontWeight={FONT_WEIGHT.BOLD}>
            {t('metametricsTitle')}
          </Typography>
          <div className="metametrics-opt-in__body">
            <Typography align={TEXT_ALIGN.CENTER}>
              {t('metametricsOptInDescription2')}{' '}
              <span>{t('metametricsOptInDescription3')}</span>
            </Typography>

            <ul className="metametrics-opt-in__commitments">
              <li className="metametrics-opt-in__row">
                <i className="fa fa-check" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsAllowOptOut2')}
                </div>
              </li>
              <li className="metametrics-opt-in__row">
                <i className="fa fa-check" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsSendAnonymizedEvents')}
                </div>
              </li>
              <li className="metametrics-opt-in__row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsNeverCollectKeysEtc', [
                    t('metametricsCommitmentsBoldNever'),
                  ])}
                </div>
              </li>
              <li className="metametrics-opt-in__row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsNeverCollectIP', [
                    t('metametricsCommitmentsBoldNever'),
                  ])}
                </div>
              </li>
              <li className="metametrics-opt-in__row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsNeverSellDataForProfit', [
                    t('metametricsCommitmentsBoldNever'),
                  ])}
                </div>
              </li>
            </ul>
          </div>
          <Typography>
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
          <div className="metametrics-opt-in__footer">
            <PageContainerFooter
              onCancel={async () => {
                await setParticipateInMetaMetrics(false);

                try {
                  if (
                    participateInMetaMetrics === null ||
                    participateInMetaMetrics === true
                  ) {
                    await metricsEvent({
                      eventOpts: {
                        category: 'Onboarding',
                        action: 'Metrics Option',
                        name: 'Metrics Opt Out',
                      },
                      isOptIn: true,
                      flushImmediately: true,
                    });
                  }
                } finally {
                  history.push(nextRoute);
                }
              }}
              cancelText={t('noThanks')}
              hideCancel={false}
              onSubmit={async () => {
                const [, metaMetricsId] = await setParticipateInMetaMetrics(
                  true,
                );
                try {
                  const metrics = [];
                  if (
                    participateInMetaMetrics === null ||
                    participateInMetaMetrics === false
                  ) {
                    metrics.push(
                      metricsEvent({
                        eventOpts: {
                          category: 'Onboarding',
                          action: 'Metrics Option',
                          name: 'Metrics Opt In',
                        },
                        isOptIn: true,
                        flushImmediately: true,
                      }),
                    );
                  }
                  metrics.push(
                    metricsEvent({
                      eventOpts: {
                        category: 'Onboarding',
                        action: 'Import or Create',
                        name: firstTimeSelectionMetaMetricsName,
                      },
                      isOptIn: true,
                      metaMetricsId,
                      flushImmediately: true,
                    }),
                  );
                  await Promise.all(metrics);
                } finally {
                  history.push(nextRoute);
                }
              }}
              submitText={t('affirmAgree')}
              submitButtonType="primary"
              disabled={false}
            />
          </div>
        </div>
      </div>
    );
  }
}
