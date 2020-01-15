import PropTypes from 'prop-types'
import React, { Component } from 'react'

import classnames from 'classnames'
import NetworkDropdownIcon from './dropdowns/components/network-dropdown-icon'

export default class Network extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    network: PropTypes.string.isRequired,
    provider: PropTypes.shape({
      type: PropTypes.string,
      nickname: PropTypes.string,
      rpcTarget: PropTypes.string,
    }).isRequired,
    disabled: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
  }

  render () {
    const context = this.context
    const networkNumber = this.props.network
    let providerName, providerNick, providerUrl
    try {
      providerName = this.props.provider.type
      providerNick = this.props.provider.nickname || ''
      providerUrl = this.props.provider.rpcTarget
    } catch (e) {
      providerName = null
    }
    const providerId = providerNick || providerName || providerUrl || null
    let iconName
    let hoverText

    if (providerName === 'mainnet') {
      hoverText = context.t('mainnet')
      iconName = 'ethereum-network'
    } else if (providerName === 'testnet') {
      hoverText = 'conflux-test-network'
      iconName = 'conflux-test-network'
    } else {
      hoverText = providerId
      iconName = 'private-network'
    }

    return (
      <div
        className={classnames('network-component pointer', {
          'network-component--disabled': this.props.disabled,
          'ethereum-network': providerName === 'mainnet',
          'conflux-test-network': providerName === 'testnet',
        })}
        title={hoverText}
        onClick={event => {
          if (!this.props.disabled) {
            this.props.onClick(event)
          }
        }}
      >
        {(function () {
          switch (iconName) {
            case 'ethereum-network':
              return (
                <div className="network-indicator">
                  <NetworkDropdownIcon
                    backgroundColor="#038789"
                    nonSelectBackgroundColor="#15afb2"
                    loading={networkNumber === 'loading'}
                  />
                  <div className="network-name">{context.t('mainnet')}</div>
                  <div className="network-indicator__down-arrow" />
                </div>
              )
            case 'conflux-test-network':
              return (
                <div className="network-indicator">
                  <NetworkDropdownIcon
                    backgroundColor="#e91550"
                    nonSelectBackgroundColor="#ec2c50"
                    loading={networkNumber === 'loading'}
                  />
                  <div className="network-name">{context.t('ropsten')}</div>
                  <div className="network-indicator__down-arrow" />
                </div>
              )
            default:
              return (
                <div className="network-indicator">
                  {networkNumber === 'loading' ? (
                    <span
                      className="pointer network-loading-spinner"
                      onClick={event => this.props.onClick(event)}
                    >
                      <img
                        title={context.t('attemptingConnect')}
                        src="images/loading.svg"
                        alt=""
                      />
                    </span>
                  ) : (
                    <i
                      className="fa fa-question-circle fa-lg"
                      style={{
                        color: 'rgb(125, 128, 130)',
                      }}
                    />
                  )}
                  <div className="network-name">
                    {providerName === 'localhost'
                      ? context.t('localhost')
                      : providerNick || context.t('privateNetwork')}
                  </div>
                  <div className="network-indicator__down-arrow" />
                </div>
              )
          }
        })()}
      </div>
    )
  }
}
