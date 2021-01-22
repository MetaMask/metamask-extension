import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { NETWORK_TYPE_RPC } from '../../../../../shared/constants/network'

export default class NetworkDisplay extends Component {
  static defaultProps = {
    colored: true,
  }

  static propTypes = {
    networkNickname: PropTypes.string.isRequired,
    networkType: PropTypes.string.isRequired,
    colored: PropTypes.bool,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  renderNetworkIcon() {
    const { networkType } = this.props

    return networkType ? (
      <div
        className={`network-display__icon network-display__icon--${networkType}`}
      />
    ) : (
      <div
        className="i fa fa-question-circle fa-med"
        style={{
          margin: '0 4px',
          color: 'rgb(125, 128, 130)',
        }}
      />
    )
  }

  render() {
    const { colored, networkNickname, networkType } = this.props

    return (
      <div
        className={classnames('network-display__container', {
          'network-display__container--colored': colored,
          [`network-display__container--${networkType}`]:
            colored && networkType,
        })}
      >
        {networkType ? (
          <div
            className={`network-display__icon network-display__icon--${networkType}`}
          />
        ) : (
          <div
            className="i fa fa-question-circle fa-med"
            style={{
              margin: '0 4px',
              color: 'rgb(125, 128, 130)',
            }}
          />
        )}
        <div className="network-display__name">
          {networkType === NETWORK_TYPE_RPC && networkNickname
            ? networkNickname
            : this.context.t(networkType)}
        </div>
      </div>
    )
  }
}
