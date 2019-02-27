import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../button'
import { DEFAULT_ROUTE } from '../../../../routes'

export default class EndOfFlowScreen extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    completeOnboarding: PropTypes.func,
  }

  render () {
    const { t } = this.context
    const { history, completeOnboarding } = this.props

    return (
      <div className="end-of-flow">
        <div className="app-header__logo-container">
          <img
            className="app-header__metafox-logo app-header__metafox-logo--horizontal"
            src="/images/logo/metamask-logo-horizontal.svg"
            height={30}
          />
          <img
            className="app-header__metafox-logo app-header__metafox-logo--icon"
            src="/images/logo/metamask-fox.svg"
            height={42}
            width={42}
          />
        </div>
        <div className="end-of-flow__emoji">🎉</div>
        <div className="first-time-flow__header">
          { t('congratulations') }
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-1">
          { t('endOfFlowMessage1') }
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-2">
          { t('endOfFlowMessage2') }
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-3">
          { '• ' + t('endOfFlowMessage3') }
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-4">
          { '• ' + t('endOfFlowMessage4') }
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-3">
          { t('endOfFlowMessage5') }
        </div>
        <div className="first-time-flow__text-block end-of-flow__text-3">
          { '*' + t('endOfFlowMessage6') }
        </div>
        <Button
          type="confirm"
          className="first-time-flow__button"
          onClick={async () => {
            await completeOnboarding()
            history.push(DEFAULT_ROUTE)
          }}
        >
          { 'All Done' }
        </Button>
      </div>
    )
  }
}
