import EventEmitter from 'events'
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Mascot from '../../../mascot'
import Button from '../../../button'
import { INITIALIZE_CREATE_PASSWORD_ROUTE, INITIALIZE_NOTICE_ROUTE } from '../../../../routes'

export default class Welcome extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    isInitialized: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  constructor (props) {
    super(props)

    this.animationEventEmitter = new EventEmitter()
  }

  componentDidMount () {
    const { history, isInitialized } = this.props

    if (isInitialized) {
      history.push(INITIALIZE_NOTICE_ROUTE)
    }
  }

  handleContinue = () => {
    this.props.history.push(INITIALIZE_CREATE_PASSWORD_ROUTE)
  }

  render () {
    const { t } = this.context

    return (
      <div className="welcome-page__wrapper">
        <div className="welcome-page">
          <Mascot
            animationEventEmitter={this.animationEventEmitter}
            width="225"
            height="225"
          />
          <div className="welcome-page__header">
            { t('welcome') }
          </div>
          <div className="welcome-page__description">
            <div>{ t('metamaskDescription') }</div>
            <div>{ t('holdEther') }</div>
          </div>
          <Button
            type="first-time"
            className="first-time-flow__button"
            onClick={this.handleContinue}
          >
            { t('continue') }
          </Button>
        </div>
      </div>
    )
  }
}
