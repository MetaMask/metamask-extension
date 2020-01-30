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

  return (
    h('div.network-component.pointer', {
      className: classnames({
        'network-component--disabled': this.props.disabled,
        'ethereum-network': providerName === 'mainnet',
        'ropsten-test-network': providerName === 'ropsten',
        'kovan-test-network': providerName === 'kovan',
        'rinkeby-test-network': providerName === 'rinkeby',
        'goerli-test-network': providerName === 'goerli',
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
  )
}
