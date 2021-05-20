import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MetaFoxLogo from '../../../ui/metafox-logo';
import PageContainerFooter from '../../../ui/page-container/page-container-footer';

export default class MetaMetricsOptInModal extends Component {
  static propTypes = {
    setParticipateInMetaMetrics: PropTypes.func,
    hideModal: PropTypes.func,
  };

  static contextTypes = {
    metricsEvent: PropTypes.func,
    t: PropTypes.func,
  };

  render() {
    const { metricsEvent, t } = this.context;
    const { setParticipateInMetaMetrics, hideModal } = this.props;

    return (
      <div className="metametrics-opt-in metametrics-opt-in-modal">
        <div className="metametrics-opt-in__main">
          <div className="metametrics-opt-in__content">
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
          <div className="metametrics-opt-in__footer">
            <PageContainerFooter
              onCancel={() => {
                setParticipateInMetaMetrics(false).then(() => {
                  metricsEvent(
                    {
                      eventOpts: {
                        category: 'Onboarding',
                        action: 'Metrics Option',
                        name: 'Metrics Opt Out',
                      },
                      isOptIn: true,
                    },
                    {
                      excludeMetaMetricsId: true,
                    },
                  );
                  hideModal();
                });
              }}
              cancelText={t('noThanks')}
              hideCancel={false}
              onSubmit={() => {
                setParticipateInMetaMetrics(true).then(() => {
                  metricsEvent({
                    eventOpts: {
                      category: 'Onboarding',
                      action: 'Metrics Option',
                      name: 'Metrics Opt In',
                    },
                    isOptIn: true,
                  });
                  hideModal();
                });
              }}
              submitText={t('affirmAgree')}
              submitButtonType="confirm"
              disabled={false}
            />
          </div>
        </div>
      </div>
    );
  }
}
