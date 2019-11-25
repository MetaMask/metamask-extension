import PropTypes from 'prop-types'
import React, {Component} from 'react'

const classnames = require('classnames')
const inherits = require('util').inherits
const NetworkDropdownIcon = require('./dropdowns/components/network-dropdown-icon')

Network.contextTypes = {
  t: PropTypes.func,
}

module.exports = Network

inherits(Network, Component)

function Network () {
  Component.call(this)
}

Network.prototype.render = function Network () {
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
  } else if (providerName === 'ropsten') {
    hoverText = context.t('ropsten')
    iconName = 'ropsten-test-network'
  } else if (providerName === 'kovan') {
    hoverText = context.t('kovan')
    iconName = 'kovan-test-network'
  } else if (providerName === 'rinkeby') {
    hoverText = context.t('rinkeby')
    iconName = 'rinkeby-test-network'
  } else if (providerName === 'goerli') {
    hoverText = context.t('goerli')
    iconName = 'goerli-test-network'
  } else {
    hoverText = providerId
    iconName = 'private-network'
  }

  return (
    <div
      className={classnames('network-component pointer', {
        'network-component--disabled': this.props.disabled,
        'ethereum-network': providerName === 'mainnet',
        'ropsten-test-network': providerName === 'ropsten',
        'kovan-test-network': providerName === 'kovan',
        'rinkeby-test-network': providerName === 'rinkeby',
        'goerli-test-network': providerName === 'goerli',
      })}
      title={hoverText}
      onClick={(event) => {
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
                <div className="network-name">
                  {context.t('mainnet')}
                </div>
                <div className="network-indicator__down-arrow" />
              </div>
            )
          case 'ropsten-test-network':
            return (
              <div className="network-indicator">
                <NetworkDropdownIcon
                  backgroundColor="#e91550"
                  nonSelectBackgroundColor="#ec2c50"
                  loading={networkNumber === 'loading'}
                />
                <div className="network-name">
                  {context.t('ropsten')}
                </div>
                <div className="network-indicator__down-arrow" />
              </div>
            )
          case 'kovan-test-network':
            return (
              <div className="network-indicator">
                <NetworkDropdownIcon
                  backgroundColor="#690496"
                  nonSelectBackgroundColor="#b039f3"
                  loading={networkNumber === 'loading'}
                />
                <div className="network-name">
                  {context.t('kovan')}
                </div>
                <div className="network-indicator__down-arrow" />
              </div>
            )
          case 'rinkeby-test-network':
            return (
              <div className="network-indicator">
                <NetworkDropdownIcon
                  backgroundColor="#ebb33f"
                  nonSelectBackgroundColor="#ecb23e"
                  loading={networkNumber === 'loading'}
                />
                <div className="network-name">
                  {context.t('rinkeby')}
                </div>
                <div className="network-indicator__down-arrow" />
              </div>
            )
          case 'goerli-test-network':
            return (
              <div className="network-indicator">
                <NetworkDropdownIcon
                  backgroundColor="#3099f2"
                  nonSelectBackgroundColor="#ecb23e"
                  loading={networkNumber === 'loading'}
                />
                <div className="network-name">{context.t('goerli')}</div>
                <div className="network-indicator__down-arrow" />
              </div>
            )
          default:
            return (
              <div className="network-indicator">
                {networkNumber === 'loading'
                  ? (
                    <span
                      className="pointer network-loading-spinner"
                      onClick={(event) => this.props.onClick(event)}
                    >
                      <img title={context.t('attemptingConnect')} src="images/loading.svg" alt="" />
                    </span>
                  )
                  : (
                    <i
                      className="fa fa-question-circle fa-lg"
                      style={{
                        color: 'rgb(125, 128, 130)',
                      }}
                    />
                  )}
                <div className="network-name">
                  {
                    providerName === 'localhost'
                      ? context.t('localhost')
                      : providerNick || context.t('privateNetwork')
                  }
                </div>
                <div className="network-indicator__down-arrow" />
              </div>
            )
        }
      })()}
    </div>
  )
}
