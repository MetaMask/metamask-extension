import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Modal from '../../modal'

export default class MetaMetricsOptIn extends Component {
  static propTypes = {
    address: PropTypes.string,
    setParticipateInMetaMetrics: PropTypes.func,
    hideModal: PropTypes.func,
  }

  static contextTypes = {
    metricsEvent: PropTypes.func,
    t: PropTypes.func,
  }

  constructor (props) {
    super(props)

    this.state = {
      participateInMetaMetricsSelection: null,
    }
  }

  render () {
    const { t, metricsEvent } = this.context
    const { participateInMetaMetricsSelection } = this.state
    const { hideModal, setParticipateInMetaMetrics } = this.props

    return (
      <Modal
        onSubmit={() => {
          setParticipateInMetaMetrics(this.state.participateInMetaMetricsSelection)
            .then(() => {
              if (!this.state.participateInMetaMetricsSelection) {
                metricsEvent({
                  eventOpts: {
                    category: 'MetaMetricsOptIn',
                    action: 'userSelectsOptIn',
                    name: 'userOptedOut',
                  },
                  isOptIn: true,
                }, {
                  excludeMetaMetricsId: true,
                })
              }
              hideModal()
            })
        }}
        submitText={t('ok')}
      >
        <div className="first-view-main-wrapper">
          <div className="first-view-main">
            <div className="metametrics-opt-in unique-image">
              <div className="unique-image__title">Would you to participate in analytics?</div>
              <div className="unique-image__body-text">
                By doing so, you will help us make MetaMask better for everyone.
                We will never track personal or identifying data.
                yadda, yadda, yadda
              </div>
              <div className="settings-page__content-item">
                <div className="settings-page__content-item-col">
                  <div className="settings-tab__radio-buttons">
                    <div className="settings-tab__radio-button">
                      <input
                        type="radio"
                        id="metametrics-opt-in"
                        onChange={() => this.setState({ participateInMetaMetricsSelection: true })}
                        checked={Boolean(participateInMetaMetricsSelection)}
                      />
                      <label
                        htmlFor="metametrics-opt-in"
                        className="settings-tab__radio-label"
                      >
                        { 'Opt-in' }
                      </label>
                    </div>
                    <div className="settings-tab__radio-button">
                      <input
                        type="radio"
                        id="metametrics-opt-out"
                        onChange={() => this.setState({ participateInMetaMetricsSelection: false })}
                        checked={!participateInMetaMetricsSelection}
                      />
                      <label
                        htmlFor="metametrics-opt-out"
                        className="settings-tab__radio-label"
                      >
                        { 'No thanks.' }
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="first-time-flow__button"
              >
                Select and Proceed
              </button>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
}
