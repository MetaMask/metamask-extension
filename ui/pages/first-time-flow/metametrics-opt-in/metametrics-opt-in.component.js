import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer';
import { EVENT } from '../../../../shared/constants/metametrics';
import { INITIALIZE_SELECT_ACTION_ROUTE } from '../../../helpers/constants/routes';

export default class MetaMetricsOptIn extends Component {
  static propTypes = {
    history: PropTypes.object,
    setParticipateInMetaMetrics: PropTypes.func,
    participateInMetaMetrics: PropTypes.bool,
  };

  static contextTypes = {
    trackEvent: PropTypes.func,
    t: PropTypes.func,
  };

  render() {
    const { trackEvent, t } = this.context;
    const {
      history,
      setParticipateInMetaMetrics,
      participateInMetaMetrics,
    } = this.props;

    return (
      <div className="metametrics-opt-in">
        <div className="metametrics-opt-in__main">
          <MetaFoxLogo />
          <div className="metametrics-opt-in__body-graphic">
            <img src="images/metrics-chart.svg" alt="" />
          </div>
          <div className="metametrics-opt-in__title">
            {t('metametricsHelpImproveMetaMask')}
          </div>
          <div className="metametrics-opt-in__body">
            <div className="metametrics-opt-in__description">
              {t('metametricsOptInDescription')}
            </div>
            <div className="metametrics-opt-in__description">
              {t('metametricsCommitmentsIntro')}
            </div>

            <div className="metametrics-opt-in__committments">
              <div className="metametrics-opt-in__row">
                <i className="fa fa-check" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsAllowOptOut')}
                </div>
              </div>
              <div className="metametrics-opt-in__row">
                <i className="fa fa-check" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsSendAnonymizedEvents')}
                </div>
              </div>
              <div className="metametrics-opt-in__row metametrics-opt-in__break-row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsNeverCollectKeysEtc', [
                    <span
                      className="metametrics-opt-in__bold"
                      key="neverCollectKeys"
                    >
                      {t('metametricsCommitmentsBoldNever')}
                    </span>,
                  ])}
                </div>
              </div>
              <div className="metametrics-opt-in__row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsNeverCollectIP', [
                    <span
                      className="metametrics-opt-in__bold"
                      key="neverCollectIP"
                    >
                      {t('metametricsCommitmentsBoldNever')}
                    </span>,
                  ])}
                </div>
              </div>
              <div className="metametrics-opt-in__row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  {t('metametricsCommitmentsNeverSellDataForProfit', [
                    <span
                      className="metametrics-opt-in__bold"
                      key="neverSellData"
                    >
                      {t('metametricsCommitmentsBoldNever')}
                    </span>,
                  ])}
                </div>
              </div>
            </div>
          </div>
          <div className="metametrics-opt-in__footer">
            <PageContainerFooter
              onCancel={async () => {
                await setParticipateInMetaMetrics(false);

                history.push(INITIALIZE_SELECT_ACTION_ROUTE);
              }}
              cancelText={t('noThanks')}
              hideCancel={false}
              onSubmit={async () => {
                await setParticipateInMetaMetrics(true);
                try {
                  if (
                    participateInMetaMetrics === null ||
                    participateInMetaMetrics === false
                  ) {
                    await trackEvent(
                      {
                        category: EVENT.CATEGORIES.ONBOARDING,
                        event: 'Metrics Opt In',
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
                  history.push(INITIALIZE_SELECT_ACTION_ROUTE);
                }
              }}
              submitText={t('affirmAgree')}
              disabled={false}
            />
            <div className="metametrics-opt-in__bottom-text">
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
            </div>
          </div>
        </div>
      </div>
    );
  }
}
