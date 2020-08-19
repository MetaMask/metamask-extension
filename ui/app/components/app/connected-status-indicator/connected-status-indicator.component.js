import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites'

export default class ConnectedStatusIndicator extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    status: PropTypes.oneOf([STATUS_CONNECTED, STATUS_CONNECTED_TO_ANOTHER_ACCOUNT, STATUS_NOT_CONNECTED]),
    onClick: PropTypes.func,
  }

  static defaultProps = {
    status: STATUS_NOT_CONNECTED,
    onClick: null,
  }

  renderStatusCircle = () => {
    const { status } = this.props

    return (
      <div
        className={classnames({
          'connected-status-indicator__green-circle': status === STATUS_CONNECTED,
          'connected-status-indicator__yellow-circle': status === STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
          'connected-status-indicator__grey-circle': status === STATUS_NOT_CONNECTED,
        })}
      >
        <span className="connected-status-indicator__inner-circle" />
      </div>
    )
  }

  renderStatusText = () => {
    const { t } = this.context
    const { status } = this.props

    const text = status === STATUS_CONNECTED
      ? t('statusConnected')
      : t('statusNotConnected')

    return (
      <div className="connected-status-indicator__text">{ text }</div>
    )
  }

  render () {
    return (
      <button className="connected-status-indicator" onClick={this.props.onClick}>
        { this.renderStatusCircle() }
        { this.renderStatusText() }
      </button>
    )
  }
}
