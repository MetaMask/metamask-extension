import React, { Component } from 'react'
import PropTypes from 'prop-types'
import MetaFoxLogo from '../../../components/ui/metafox-logo'
import PageContainerFooter from '../../../components/ui/page-container/page-container-footer'

export default class MetaMetricsOptIn extends Component {
  static propTypes = {
    history: PropTypes.object,
    setParticipateInMetaMetrics: PropTypes.func,
    nextRoute: PropTypes.string,
    firstTimeSelectionMetaMetricsName: PropTypes.string,
    participateInMetaMetrics: PropTypes.bool,
  }

  static contextTypes = {
    metricsEvent: PropTypes.func,
  }

  render () {
    const { metricsEvent } = this.context
    const {
      nextRoute,
      history,
      setParticipateInMetaMetrics,
      firstTimeSelectionMetaMetricsName,
      participateInMetaMetrics,
    } = this.props

    return (
      <div className="metametrics-opt-in">
        <div className="metametrics-opt-in__main">
          <MetaFoxLogo />
          <div className="metametrics-opt-in__body-graphic">
            <img src="images/metrics-chart.svg" />
          </div>
          <div className="metametrics-opt-in__title">Help Us Improve MetaMask</div>
          <div className="metametrics-opt-in__body">
            <div className="metametrics-opt-in__description">
             MetaMask would like to gather usage data to better understand how our users interact with the extension. This data
             will be used to continually improve the usability and user experience of our product and the Ethereum ecosystem.
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
                  Maintain a public aggregate dashboard to educate the community
                </div>
              </div>
              <div className="metametrics-opt-in__row metametrics-opt-in__break-row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  <span className="metametrics-opt-in__bold">Never</span> collect keys, addresses, transactions, balances, hashes, or any personal information
                </div>
              </div>
              <div className="metametrics-opt-in__row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  <span className="metametrics-opt-in__bold">Never</span> collect your full IP address
                </div>
              </div>
              <div className="metametrics-opt-in__row">
                <i className="fa fa-times" />
                <div className="metametrics-opt-in__row-description">
                  <span className="metametrics-opt-in__bold">Never</span> sell data for profit. Ever!
                </div>
              </div>
            </div>
          </div>
          <div className="metametrics-opt-in__footer">
            <PageContainerFooter
              onCancel={() => {
                setParticipateInMetaMetrics(false)
                  .then(() => {
                    const promise = participateInMetaMetrics !== false
                      ? metricsEvent({
                        eventOpts: {
                          category: 'Onboarding',
                          action: 'Metrics Option',
                          name: 'Metrics Opt Out',
                        },
                        isOptIn: true,
                      })
                      : Promise.resolve()

                    promise
                      .then(() => {
                        history.push(nextRoute)
                      })
                  })
              }}
              cancelText="No Thanks"
              hideCancel={false}
              onSubmit={() => {
                setParticipateInMetaMetrics(true)
                  .then(([_, metaMetricsId]) => {
                    const promise = participateInMetaMetrics !== true
                      ? metricsEvent({
                        eventOpts: {
                          category: 'Onboarding',
                          action: 'Metrics Option',
                          name: 'Metrics Opt In',
                        },
                        isOptIn: true,
                      })
                      : Promise.resolve()

                    promise
                      .then(() => {
                        return metricsEvent({
                          eventOpts: {
                            category: 'Onboarding',
                            action: 'Import or Create',
                            name: firstTimeSelectionMetaMetricsName,
                          },
                          isOptIn: true,
                          metaMetricsId,
                        })
                      })
                      .then(() => {
                        history.push(nextRoute)
                      })
                  })
              }}
              submitText="I agree"
              submitButtonType="primary"
              disabled={false}
            />
            <div className="metametrics-opt-in__bottom-text">
              This data is aggregated and is therefore anonymous for the purposes of General Data Protection Regulation (EU) 2016/679. For more information in relation to our privacy practices, please see our&nbsp;
              <a
                href="https://metamask.io/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy here
              </a>.
            </div>
          </div>
        </div>
      </div>
    )
  }
}
