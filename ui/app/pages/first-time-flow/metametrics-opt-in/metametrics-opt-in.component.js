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
    currentLocale: PropTypes.string,
  }

  static contextTypes = {
    metricsEvent: PropTypes.func,
    t: PropTypes.func,
  }

  render () {
    const { metricsEvent } = this.context
    const { currentLocale } = this.props
    const { t } = this.context
    const {
      nextRoute,
      history,
      setParticipateInMetaMetrics,
      firstTimeSelectionMetaMetricsName,
      participateInMetaMetrics,
    } = this.props
    if (currentLocale === 'zh_CN') {
      return (
        <div className="metametrics-opt-in">
          <div className="metametrics-opt-in__main">
            <MetaFoxLogo />
            <div className="metametrics-opt-in__body-graphic">
              <img src="images/metrics-chart.svg" />
            </div>
            <div className="metametrics-opt-in__title">
              帮助我们提升 ConfluxPortal
            </div>
            <div className="metametrics-opt-in__body">
              <div className="metametrics-opt-in__description">
                ConfluxPortal
                会收集使用数据，以便更好地理解我们的用户是如何使用这个拓展工具的。这些数据可以帮助我们提升
                ConfluxPortal 的可用性以及用户体验，也会让 Conflux
                生态系统变得更好。
              </div>
              <div className="metametrics-opt-in__description">
                Conflux 将：
              </div>

              <div className="metametrics-opt-in__committments">
                {/* <div className="metametrics-opt-in__row"> */}
                {/*   <i className="fa fa-check" /> */}
                {/*   <div className="metametrics-opt-in__row-description"> */}
                {/*     Always allow you to opt-out via Settings */}
                {/*   </div> */}
                {/* </div> */}
                {/* <div className="metametrics-opt-in__row"> */}
                {/*   <i className="fa fa-check" /> */}
                {/*   <div className="metametrics-opt-in__row-description"> */}
                {/*     Send anonymized click & pageview events (not doing this in */}
                {/*     test version yet) */}
                {/*   </div> */}
                {/* </div> */}
                {/* <div className="metametrics-opt-in__row"> */}
                {/*   <i className="fa fa-check" /> */}
                {/*   <div className="metametrics-opt-in__row-description"> */}
                {/*     Maintain a public aggregate dashboard to educate the community */}
                {/*     (not doing this in test version yet) */}
                {/*   </div> */}
                {/* </div> */}
                <div className="metametrics-opt-in__row metametrics-opt-in__break-row">
                  <i className="fa fa-times" />
                  <div className="metametrics-opt-in__row-description">
                    <span className="metametrics-opt-in__bold">不会</span>{' '}
                    收集私钥/公钥、地址、交易信息、余额、哈希值或任何个人信息；
                  </div>
                </div>
                <div className="metametrics-opt-in__row">
                  <i className="fa fa-times" />
                  <div className="metametrics-opt-in__row-description">
                    <span className="metametrics-opt-in__bold">不会</span>{' '}
                    收集您的 IP 地址；
                  </div>
                </div>
                <div className="metametrics-opt-in__row">
                  <i className="fa fa-times" />
                  <div className="metametrics-opt-in__row-description">
                    <span className="metametrics-opt-in__bold">不会</span>{' '}
                    售卖数据，永远不会！
                  </div>
                </div>
              </div>
            </div>
            <div className="metametrics-opt-in__footer">
              <PageContainerFooter
                onCancel={() => {
                  setParticipateInMetaMetrics(false).then(() => {
                    const promise =
                      participateInMetaMetrics !== false
                        ? metricsEvent({
                          eventOpts: {
                            category: 'Onboarding',
                            action: 'Metrics Option',
                            name: 'Metrics Opt Out',
                          },
                          isOptIn: true,
                        })
                        : Promise.resolve()

                    promise.then(() => {
                      history.push(nextRoute)
                    })
                  })
                }}
                cancelText={t('noThanks')}
                hideCancel={false}
                onSubmit={() => {
                  setParticipateInMetaMetrics(true).then(
                    ([_, metaMetricsId]) => {
                      const promise =
                        participateInMetaMetrics !== true
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
                    }
                  )
                }}
                submitText={t('iagree')}
                submitButtonType="primary"
                disabled={false}
              />
              <div className="metametrics-opt-in__bottom-text">
                这些数据是汇总数据，遵循《欧盟通用数据保护条例》（EU-2016/679），这些数据都是匿名的。想要了解有关我们隐私惯例的更多信息，请点击此处查看我们的
                <a
                  href="https://confluxnetwork.org/policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  隐私政策
                </a>
                。
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (currentLocale === 'zh_TW') {
      return (
        <div className="metametrics-opt-in">
          <div className="metametrics-opt-in__main">
            <MetaFoxLogo />
            <div className="metametrics-opt-in__body-graphic">
              <img src="images/metrics-chart.svg" />
            </div>
            <div className="metametrics-opt-in__title">
              幫助我們提升 ConfluxPortal
            </div>
            <div className="metametrics-opt-in__body">
              <div className="metametrics-opt-in__description">
                ConfluxPortal
                會收集使用數據，以便更好地理解我們的用戶是如何使用這個拓展工具的。這些數據可以幫助我們提升
                ConfluxPortal 的可用性以及用戶體驗，也會讓 Conflux
                生態系統變得更好。
              </div>
              <div className="metametrics-opt-in__description">
                Conflux 將：
              </div>

              <div className="metametrics-opt-in__committments">
                {/* <div className="metametrics-opt-in__row"> */}
                {/*   <i className="fa fa-check" /> */}
                {/*   <div className="metametrics-opt-in__row-description"> */}
                {/*     Always allow you to opt-out via Settings */}
                {/*   </div> */}
                {/* </div> */}
                {/* <div className="metametrics-opt-in__row"> */}
                {/*   <i className="fa fa-check" /> */}
                {/*   <div className="metametrics-opt-in__row-description"> */}
                {/*     Send anonymized click & pageview events (not doing this in */}
                {/*     test version yet) */}
                {/*   </div> */}
                {/* </div> */}
                {/* <div className="metametrics-opt-in__row"> */}
                {/*   <i className="fa fa-check" /> */}
                {/*   <div className="metametrics-opt-in__row-description"> */}
                {/*     Maintain a public aggregate dashboard to educate the community */}
                {/*     (not doing this in test version yet) */}
                {/*   </div> */}
                {/* </div> */}
                <div className="metametrics-opt-in__row metametrics-opt-in__break-row">
                  <i className="fa fa-times" />
                  <div className="metametrics-opt-in__row-description">
                    <span className="metametrics-opt-in__bold">不會</span>{' '}
                    收集私鑰/公鑰、地址、交易信息、余額、哈希值或任何個人信息；
                  </div>
                </div>
                <div className="metametrics-opt-in__row">
                  <i className="fa fa-times" />
                  <div className="metametrics-opt-in__row-description">
                    <span className="metametrics-opt-in__bold">不會</span>{' '}
                    收集您的 IP 地址；
                  </div>
                </div>
                <div className="metametrics-opt-in__row">
                  <i className="fa fa-times" />
                  <div className="metametrics-opt-in__row-description">
                    <span className="metametrics-opt-in__bold">不會</span>{' '}
                    售賣數據，永遠不會！
                  </div>
                </div>
              </div>
            </div>
            <div className="metametrics-opt-in__footer">
              <PageContainerFooter
                onCancel={() => {
                  setParticipateInMetaMetrics(false).then(() => {
                    const promise =
                      participateInMetaMetrics !== false
                        ? metricsEvent({
                          eventOpts: {
                            category: 'Onboarding',
                            action: 'Metrics Option',
                            name: 'Metrics Opt Out',
                          },
                          isOptIn: true,
                        })
                        : Promise.resolve()

                    promise.then(() => {
                      history.push(nextRoute)
                    })
                  })
                }}
                cancelText={t('noThanks')}
                hideCancel={false}
                onSubmit={() => {
                  setParticipateInMetaMetrics(true).then(
                    ([_, metaMetricsId]) => {
                      const promise =
                        participateInMetaMetrics !== true
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
                    }
                  )
                }}
                submitText={t('iagree')}
                submitButtonType="primary"
                disabled={false}
              />
              <div className="metametrics-opt-in__bottom-text">
                這些數據是匯總數據，遵循《歐盟通用數據保護條例》（EU-2016/679），這些數據都是匿名的。想要了解有關我們隱私慣例的更多信息，請點擊此處查看我們的
                <a
                  href="https://confluxnetwork.org/policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  隱私政策
                </a>
                。
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="metametrics-opt-in">
        <div className="metametrics-opt-in__main">
          <MetaFoxLogo />
          <div className="metametrics-opt-in__body-graphic">
            <img src="images/metrics-chart.svg" />
          </div>
          <div className="metametrics-opt-in__title">
            Help Us Improve ConfluxPortal
          </div>
          <div className="metametrics-opt-in__body">
            <div className="metametrics-opt-in__description">
              ConfluxPortal would like to gather usage data to better understand
              how our users interact with the extension. This data will be used
              to continually improve the usability and user experience of our
              product and the Conflux ecosystem.
            </div>
            <div className="metametrics-opt-in__description">
              ConfluxPortal will..
            </div>

            <div className="metametrics-opt-in__committments">
              {/* <div className="metametrics-opt-in__row"> */}
              {/*   <i className="fa fa-check" /> */}
              {/*   <div className="metametrics-opt-in__row-description"> */}
              {/*     Always allow you to opt-out via Settings */}
              {/*   </div> */}
              {/* </div> */}
              {/* <div className="metametrics-opt-in__row"> */}
              {/*   <i className="fa fa-check" /> */}
              {/*   <div className="metametrics-opt-in__row-description"> */}
              {/*     Send anonymized click & pageview events (not doing this in */}
              {/*     test version yet) */}
              {/*   </div> */}
              {/* </div> */}
              {/* <div className="metametrics-opt-in__row"> */}
              {/*   <i className="fa fa-check" /> */}
              {/*   <div className="metametrics-opt-in__row-description"> */}
              {/*     Maintain a public aggregate dashboard to educate the community */}
              {/*     (not doing this in test version yet) */}
              {/*   </div> */}
              {/* </div> */}
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
          <div className="metametrics-opt-in__footer">
            <PageContainerFooter
              onCancel={() => {
                setParticipateInMetaMetrics(false).then(() => {
                  const promise =
                    participateInMetaMetrics !== false
                      ? metricsEvent({
                        eventOpts: {
                          category: 'Onboarding',
                          action: 'Metrics Option',
                          name: 'Metrics Opt Out',
                        },
                        isOptIn: true,
                      })
                      : Promise.resolve()

                  promise.then(() => {
                    history.push(nextRoute)
                  })
                })
              }}
              cancelText={t('noThanks')}
              hideCancel={false}
              onSubmit={() => {
                setParticipateInMetaMetrics(true).then(([_, metaMetricsId]) => {
                  const promise =
                    participateInMetaMetrics !== true
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
              submitText={t('iagree')}
              submitButtonType="primary"
              disabled={false}
            />
            <div className="metametrics-opt-in__bottom-text">
              This data is aggregated and is therefore anonymous for the
              purposes of General Data Protection Regulation (EU) 2016/679. For
              more information in relation to our privacy practices, please see
              our&nbsp;
              <a
                href="https://confluxnetwork.org/policy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy here
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    )
  }
}
