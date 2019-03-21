import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { exportAsFile } from '../../../helpers/utils/util'
import ToggleButton from 'react-toggle-button'
import {REVEAL_SEED_ROUTE, MOBILE_SYNC_ROUTE } from '../../../helpers/constants/routes'
import Button from '../../../components/ui/button'

export default class SecurityTab extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    setPrivacyMode: PropTypes.func,
    privacyMode: PropTypes.bool,
    displayWarning: PropTypes.func,
    revealSeedConfirmation: PropTypes.func,
    showClearApprovalModal: PropTypes.func,
    warning: PropTypes.string,
    history: PropTypes.object,
    mobileSync: PropTypes.bool,
    participateInMetaMetrics: PropTypes.bool,
    setParticipateInMetaMetrics: PropTypes.func,
  }

  renderStateLogs () {
    const { t } = this.context
    const { displayWarning } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('stateLogs') }</span>
          <span className="settings-page__content-description">
            { t('stateLogsDescription') }
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="primary"
              large
              onClick={() => {
                window.logStateString((err, result) => {
                  if (err) {
                    displayWarning(t('stateLogError'))
                  } else {
                    exportAsFile('MetaMask State Logs.json', result)
                  }
                })
              }}
            >
              { t('downloadStateLogs') }
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderClearApproval () {
    const { t } = this.context
    const { showClearApprovalModal } = this.props
    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('approvalData') }</span>
          <span className="settings-page__content-description">
            { t('approvalDataDescription') }
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="secondary"
              large
              className="settings-tab__button--orange"
              onClick={event => {
                event.preventDefault()
                showClearApprovalModal()
              }}
            >
              { t('clearApprovalData') }
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderSeedWords () {
    const { t } = this.context
    const { history } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('revealSeedWords') }</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="secondary"
              large
              onClick={event => {
                event.preventDefault()
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Settings',
                    action: 'Reveal Seed Phrase',
                    name: 'Reveal Seed Phrase',
                  },
                })
                history.push(REVEAL_SEED_ROUTE)
              }}
            >
              { t('revealSeedWords') }
            </Button>
          </div>
        </div>
      </div>
    )
  }


  renderMobileSync () {
    const { t } = this.context
    const { history } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('syncWithMobile') }</span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="primary"
              large
              onClick={event => {
                event.preventDefault()
                history.push(MOBILE_SYNC_ROUTE)
              }}
            >
              { t('syncWithMobile') }
            </Button>
          </div>
        </div>
      </div>
    )
  }

  renderPrivacyOptIn () {
    const { t } = this.context
    const { privacyMode, setPrivacyMode } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('privacyMode') }</span>
          <div className="settings-page__content-description">
            { t('privacyModeDescription') }
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={privacyMode}
              onToggle={value => setPrivacyMode(!value)}
              activeLabel=""
              inactiveLabel=""
            />
          </div>
        </div>
      </div>
    )
  }

  renderMetaMetricsOptIn () {
    const { t } = this.context
    const { participateInMetaMetrics, setParticipateInMetaMetrics } = this.props

    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('participateInMetaMetrics') }</span>
          <div className="settings-page__content-description">
            <span>{ t('participateInMetaMetricsDescription') }</span>
          </div>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <ToggleButton
              value={participateInMetaMetrics}
              onToggle={value => setParticipateInMetaMetrics(!value)}
              activeLabel=""
              inactiveLabel=""
            />
          </div>
        </div>
      </div>
    )
  }

  renderContent () {
    const { warning } = this.props

    return (
      <div className="settings-page__body">
        { warning && <div className="settings-tab__error">{ warning }</div> }
        { this.renderPrivacyOptIn() }
        { this.renderClearApproval() }
        { this.renderSeedWords() }
        { this.renderMobileSync() }
        { this.renderMetaMetricsOptIn() }
      </div>
    )
  }

  render () {
    return this.renderContent()
  }
}
