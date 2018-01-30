const Component = require('react').Component
const h = require('react-hyperscript')
const classnames = require('classnames')
const inherits = require('util').inherits
const NetworkDropdownIcon = require('./dropdowns/components/network-dropdown-icon')

module.exports = Network

inherits(Network, Component)

function Network () {
  Component.call(this)
}

Network.prototype.render = function () {
  const props = this.props
  const networkNumber = props.network
  let providerName
  try {
    providerName = props.provider.type
  } catch (e) {
    providerName = null
  }
  let iconName, hoverText

  if (networkNumber === 'loading') {
    return h('span.pointer', {
      style: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
      },
      onClick: (event) => this.props.onClick(event),
    }, [
      h('img', {
        title: 'Attempting to connect to blockchain.',
        style: {
          width: '27px',
        },
        src: 'images/loading.svg',
      }),
    ])
  } else if (providerName === 'mainnet') {
    hoverText = 'Main Ethereum Network'
    iconName = 'ethereum-network'
  } else if (providerName === 'ropsten') {
    hoverText = 'Ropsten Test Network'
    iconName = 'ropsten-test-network'
  } else if (parseInt(networkNumber) === 3) {
    hoverText = 'Ropsten Test Network'
    iconName = 'ropsten-test-network'
  } else if (providerName === 'kovan') {
    hoverText = 'Kovan Test Network'
    iconName = 'kovan-test-network'
  } else if (providerName === 'rinkeby') {
    hoverText = 'Rinkeby Test Network'
    iconName = 'rinkeby-test-network'
  } else {
    hoverText = 'Unknown Private Network'
    iconName = 'unknown-private-network'
  }

  return (
    h('div.network-component.pointer', {
      className: classnames({
        'network-component--disabled': this.props.disabled,
        'ethereum-network': providerName === 'mainnet',
        'ropsten-test-network': providerName === 'ropsten' || parseInt(networkNumber) === 3,
        'kovan-test-network': providerName === 'kovan',
        'rinkeby-test-network': providerName === 'rinkeby',
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
              }),
              h('.network-name', 'Main Network'),
              h('i.fa.fa-chevron-down.fa-lg.network-caret'),
            ])
          case 'ropsten-test-network':
            return h('.network-indicator', [
              h(NetworkDropdownIcon, {
                backgroundColor: '#e91550', // $crimson
                nonSelectBackgroundColor: '#ec2c50',
              }),
              h('.network-name', 'Ropsten Test Net'),
              h('i.fa.fa-chevron-down.fa-lg.network-caret'),
            ])
          case 'kovan-test-network':
            return h('.network-indicator', [
              h(NetworkDropdownIcon, {
                backgroundColor: '#690496', // $purple
                nonSelectBackgroundColor: '#b039f3',
              }),
              h('.network-name', 'Kovan Test Net'),
              h('i.fa.fa-chevron-down.fa-lg.network-caret'),
            ])
          case 'rinkeby-test-network':
            return h('.network-indicator', [
              h(NetworkDropdownIcon, {
                backgroundColor: '#ebb33f', // $tulip-tree
                nonSelectBackgroundColor: '#ecb23e',
              }),
              h('.network-name', 'Rinkeby Test Net'),
              h('i.fa.fa-chevron-down.fa-lg.network-caret'),
            ])
          default:
            return h('.network-indicator', [
              h('i.fa.fa-question-circle.fa-lg', {
                style: {
                  margin: '10px',
                  color: 'rgb(125, 128, 130)',
                },
              }),

              h('.network-name', 'Private Network'),
              h('i.fa.fa-chevron-down.fa-lg.network-caret'),
            ])
        }
      })(),
    ])
  )
}
