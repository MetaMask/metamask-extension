<<<<<<< HEAD
const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const classnames = require('classnames')
const inherits = require('util').inherits
const NetworkDropdownIcon = require('./dropdowns/components/network-dropdown-icon')

Network.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect()(Network)


inherits(Network, Component)

function Network () {
  Component.call(this)
}

Network.prototype.render = function () {
  const props = this.props
  const context = this.context
  const networkNumber = props.network
  let providerName, providerNick, providerUrl
  try {
    providerName = props.provider.type
    providerNick = props.provider.nickname || ''
    providerUrl = props.provider.rpcTarget
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
=======
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import classnames from 'classnames'
import NetworkDropdownIcon from './dropdowns/components/network-dropdown-icon'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

function NetworkIndicator ({ disabled, children, hoverText, onClick, providerName }) {
  return (
<<<<<<< HEAD
    h('div.network-component.pointer', {
      className: classnames({
        'network-component--disabled': this.props.disabled,
=======
    <div
      className={classnames('network-component pointer', {
        'network-component--disabled': disabled,
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
        'ethereum-network': providerName === 'mainnet',
        'ropsten-test-network': providerName === 'ropsten',
        'kovan-test-network': providerName === 'kovan',
        'rinkeby-test-network': providerName === 'rinkeby',
        'goerli-test-network': providerName === 'goerli',
<<<<<<< HEAD
      }),
      title: hoverText,
      onClick: (event) => {
        if (!this.props.disabled) {
          this.props.onClick(event)
        }
      },
    }, [
      (function () {
        switch (iconName) {
          case 'ethereum-network':
            return h('.network-indicator', [
              h(NetworkDropdownIcon, {
                backgroundColor: '#038789', // $blue-lagoon
                nonSelectBackgroundColor: '#15afb2',
                loading: networkNumber === 'loading',
              }),
              h('.network-name', context.t('mainnet')),
              h('.network-indicator__down-arrow'),
            ])
          case 'ropsten-test-network':
            return h('.network-indicator', [
              h(NetworkDropdownIcon, {
                backgroundColor: '#e91550', // $crimson
                nonSelectBackgroundColor: '#ec2c50',
                loading: networkNumber === 'loading',
              }),
              h('.network-name', context.t('ropsten')),
              h('.network-indicator__down-arrow'),
            ])
          case 'kovan-test-network':
            return h('.network-indicator', [
              h(NetworkDropdownIcon, {
                backgroundColor: '#690496', // $purple
                nonSelectBackgroundColor: '#b039f3',
                loading: networkNumber === 'loading',
              }),
              h('.network-name', context.t('kovan')),
              h('.network-indicator__down-arrow'),
            ])
          case 'rinkeby-test-network':
            return h('.network-indicator', [
              h(NetworkDropdownIcon, {
                backgroundColor: '#ebb33f', // $tulip-tree
                nonSelectBackgroundColor: '#ecb23e',
                loading: networkNumber === 'loading',
              }),
              h('.network-name', context.t('rinkeby')),
              h('.network-indicator__down-arrow'),
            ])
          case 'goerli-test-network':
            return h('.network-indicator', [
              h(NetworkDropdownIcon, {
                backgroundColor: '#3099f2', // $dodger-blue
                nonSelectBackgroundColor: '#ecb23e',
                loading: networkNumber === 'loading',
              }),
              h('.network-name', context.t('goerli')),
              h('.network-indicator__down-arrow'),
            ])
          default:
            return h('.network-indicator', [
              networkNumber === 'loading'
                ? h('span.pointer.network-loading-spinner', {
                  onClick: (event) => this.props.onClick(event),
                }, [
                  h('img', {
                    title: context.t('attemptingConnect'),
                    src: 'images/loading.svg',
                  }),
                ])
                : h('i.fa.fa-question-circle.fa-lg', {
                  style: {
                    color: 'rgb(125, 128, 130)',
                  },
                }),

              h('.network-name', providerName === 'localhost' ? context.t('localhost') : providerNick || context.t('privateNetwork')),
              h('.network-indicator__down-arrow'),
            ])
        }
      })(),
    ])
=======
      })}
      title={hoverText}
      onClick={(event) => {
        if (!disabled) {
          onClick(event)
        }
      }}
    >
      <div className="network-indicator">
        {children}
        <div className="network-indicator__down-arrow" />
      </div>
    </div>
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  )
}

NetworkIndicator.propTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  hoverText: PropTypes.string,
  onClick: PropTypes.func,
  providerName: PropTypes.string,
}

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
    const {
      t,
    } = this.context

    const {
      disabled,
      network: networkNumber,
      onClick,
      provider,
    } = this.props

    let providerName, providerNick, providerUrl
    if (provider) {
      providerName = provider.type
      providerNick = provider.nickname || ''
      providerUrl = provider.rpcTarget
    }

    switch (providerName) {
      case 'mainnet':
        return (
          <NetworkIndicator disabled={disabled} hoverText={t('mainnet')} onClick={onClick} providerName={providerName}>
            <NetworkDropdownIcon
              backgroundColor="#038789"
              nonSelectBackgroundColor="#15afb2"
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t('mainnet')}</div>
          </NetworkIndicator>
        )

      case 'ropsten':
        return (
          <NetworkIndicator disabled={disabled} hoverText={t('ropsten')} onClick={onClick} providerName={providerName}>
            <NetworkDropdownIcon
              backgroundColor="#e91550"
              nonSelectBackgroundColor="#ec2c50"
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t('ropsten')}</div>
          </NetworkIndicator>
        )

      case 'kovan':
        return (
          <NetworkIndicator disabled={disabled} hoverText={t('kovan')} onClick={onClick} providerName={providerName}>
            <NetworkDropdownIcon
              backgroundColor="#690496"
              nonSelectBackgroundColor="#b039f3"
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t('kovan')}</div>
          </NetworkIndicator>
        )

      case 'rinkeby':
        return (
          <NetworkIndicator disabled={disabled} hoverText={t('rinkeby')} onClick={onClick} providerName={providerName}>
            <NetworkDropdownIcon
              backgroundColor="#ebb33f"
              nonSelectBackgroundColor="#ecb23e"
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t('rinkeby')}</div>
          </NetworkIndicator>
        )

      case 'goerli':
        return (
          <NetworkIndicator disabled={disabled} hoverText={t('goerli')} onClick={onClick} providerName={providerName}>
            <NetworkDropdownIcon
              backgroundColor="#3099f2"
              nonSelectBackgroundColor="#ecb23e"
              loading={networkNumber === 'loading'}
            />
            <div className="network-name">{t('goerli')}</div>
          </NetworkIndicator>
        )

      default:
        return (
          <NetworkIndicator
            disabled={disabled}
            hoverText={providerNick || providerName || providerUrl || null}
            onClick={onClick}
            providerName={providerName}
          >
            {
              networkNumber === 'loading'
                ? (
                  <span className="pointer network-loading-spinner" onClick={(event) => onClick(event)}>
                    <img title={t('attemptingConnect')} src="images/loading.svg" alt="" />
                  </span>
                )
                : (
                  <i className="fa fa-question-circle fa-lg" style={{ color: 'rgb(125, 128, 130)' }} />
                )
            }
            <div className="network-name">
              {
                providerName === 'localhost'
                  ? t('localhost')
                  : providerNick || t('privateNetwork')
              }
            </div>
          </NetworkIndicator>
        )
    }
  }
}
