import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MetaFoxLogo from '../../../ui/metafox-logo'
import PageContainerFooter from '../../../ui/page-container/page-container-footer'

export default class MetaMetricsOptInModal extends Component {
  static propTypes = {
    setParticipateInMetaMetrics: PropTypes.func,
    hideModal: PropTypes.func,
  }

  static contextTypes = {
    metricsEvent: PropTypes.func,
    t: PropTypes.func,
  }

  render() {
    const { metricsEvent, t } = this.context
    const { setParticipateInMetaMetrics, hideModal } = this.props

    return (
      <div className="metametrics-opt-in metametrics-opt-in-modal">
        <div className="metametrics-opt-in__main">
          <div className="metametrics-opt-in__content">
            <MetaFoxLogo />
            <div className="metametrics-opt-in__body-graphic">
              <img src="images/metrics-chart.svg" />
            </div>
            <div className="metametrics-opt-in__title">
              Help Us Improve MetaMask
            </div>
            <div className="metametrics-opt-in__body">
              <div className="metametrics-opt-in__description">
                MetaMask would like to gather usage data to better understand
                how our users interact with the extension. This data will be
                used to continually improve the usability and user experience of
                our product and the Ethereum ecosystem.
              </div>
              <div className="metametrics-opt-in__description">
                MetaMask will..
              </div>

              <div className="metametrics-opt-in__committments">
                <div className="metametrics-opt-in__row">
                  <i className="fa fa-check" />
                  <div className="metametrics-opt-in__row-description">
                    Always allow you to opt-out via Settings
                  </div>
                </div>
                <div className="metametrics-opt-in__row">
                  <i className="fa fa-check" />
                  <div className="metametrics-opt-in__row-description">
                    Send anonymized click & pageview events
                  </div>
                </div>
                <div className="metametrics-opt-in__row">
                  <i className="fa fa-check" />
                  <div className="metametrics-opt-in__row-description">
                    Maintain a public aggregate dashboard to educate the
                    community
                  </div>
                </div>
                <div className="metametrics-opt-in__row metametrics-opt-in__break-row">
                  <i className="fa fa-times" />
                  <div className="metametrics-opt-in__row-description">
                    <span className="metametrics-opt-in__bold">Never</span>{' '}
                    collect keys, addresses, transactions, balances, hashes, or
                    any personal information
                  </div>
                </div>
                <div className="metametrics-opt-in__row">
                  <i className="fa fa-times" />
                  <div className="metametrics-opt-in__row-description">
                    <span className="metametrics-opt-in__bold">Never</span>{' '}
                    collect your full IP address
                  </div>
                </div>
                <div className="metametrics-opt-in__row">
                  <i className="fa fa-times" />
                  <div className="metametrics-opt-in__row-description">
                    <span className="metametrics-opt-in__bold">Never</span> sell
                    data for profit. Ever!
                  </div>
                </div>
              </div>
            </div>
            <div className="metametrics-opt-in__bottom-text">
              This data is aggregated and is therefore anonymous for the
              purposes of General Data Protection Regulation (EU) 2016/679. For
              more information in relation to our privacy practices, please see
              our&nbsp;
              <a
                href="https://metamask.io/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy here
              </a>
              .
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
                  )
                  hideModal()
                })
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
                  })
                  hideModal()
                })
              }}
              submitText={t('affirmAgree')}
              submitButtonType="confirm"
              disabled={false}
            />
          </div>
        </div>
      </div>
    )
  }
}
