import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { CHAIN_ID_TO_TYPE_MAP } from '../../../../../shared/constants/network'

export default class NetworkDisplay extends Component {
  static defaultProps = {
    colored: true,
  }

  static propTypes = {
    colored: PropTypes.bool,
    provider: PropTypes.shape({
      chainId: PropTypes.string.isRequired,
      nickname: PropTypes.string.isRequired,
      ticker: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      rpcUrl: PropTypes.string,
    }).isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  renderNetworkIcon() {
    const {
      provider: { chainId },
    } = this.props
    const networkType = CHAIN_ID_TO_TYPE_MAP[chainId]

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
    const {
      colored,
      provider: { chainId, nickname, type },
    } = this.props
    const networkType = CHAIN_ID_TO_TYPE_MAP[chainId]

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
          {type === 'rpc' && nickname ? nickname : this.context.t(type)}
        </div>
      </div>
    )
  }
}
