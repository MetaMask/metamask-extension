const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

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
      className: props.onClick && 'pointer',
      style: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
      },
      onClick: (event) => props.onClick && props.onClick(event),
    }, [
      props.onClick && h('img', {
        title: 'Attempting to connect to blockchain.',
        style: {
          width: '27px',
        },
        src: 'images/loading.svg',
      }),
      h('i.fa.fa-caret-down'),
    ])
  } else if (providerName === 'mainnet') {
    hoverText = 'Main Ethereum Network'
    iconName = 'ethereum-network'
  } else if (providerName === 'ropsten') {
    hoverText = 'Ropsten Test Network'
    iconName = 'ropsten-test-network'
  } else if (providerName === 'sokol') {
    hoverText = 'POA Sokol Test Network'
    iconName = 'sokol-test-network'
  } else if (parseInt(networkNumber) === 3) {
    hoverText = 'Ropsten Test Network'
    iconName = 'ropsten-test-network'
  } else if (providerName === 'kovan') {
    hoverText = 'Kovan Test Network'
    iconName = 'kovan-test-network'
  } else if (providerName === 'rinkeby') {
    hoverText = 'Rinkeby Test Network'
    iconName = 'rinkeby-test-network'
  } else if (providerName === 'poa') {
    hoverText = 'POA Network'
    iconName = 'poa-network'
  } else {
    hoverText = 'Unknown Private Network'
    iconName = 'unknown-private-network'
  }

  return (
    h('#network_component', {
      className: props.onClick && 'pointer',
      title: hoverText,
      onClick: (event) => props.onClick && props.onClick(event),
    }, [
      (function () {
        switch (iconName) {
          case 'ethereum-network':
            return h('.network-indicator', [
              h('.network-name', {
                style: {
                  paddingLeft: '9px',
                  color: '#6729a8',
                }},
              'Main Network'),
              props.onClick && h('i.fa.fa-caret-down.fa-lg'),
            ])
          case 'sokol-test-network':
            return h('.network-indicator', [
              h('.network-name', {
                style: {
                  paddingLeft: '9px',
                  color: '#6729a8',
                }},
              [ h('div', 'Sokol'),
                h('div', 'Test Net') ]),
              props.onClick && h('i.fa.fa-caret-down.fa-lg'),
            ])
          case 'ropsten-test-network':
            return h('.network-indicator', [
              h('.network-name', {
                style: {
                  paddingLeft: '9px',
                  color: '#6729a8',
                }},
              'Ropsten Test Net'),
              props.onClick && h('i.fa.fa-caret-down.fa-lg'),
            ])
          case 'kovan-test-network':
            return h('.network-indicator', [
              h('.network-name', {
                style: {
                  paddingLeft: '9px',
                  color: '#6729a8',
                }},
              'Kovan Test Net'),
              props.onClick && h('i.fa.fa-caret-down.fa-lg'),
            ])
          case 'rinkeby-test-network':
            return h('.network-indicator', [
              h('.network-name', {
                style: {
                  paddingLeft: '9px',
                  color: '#6729a8',
                }},
              'Rinkeby Test Net'),
              props.onClick && h('i.fa.fa-caret-down.fa-lg'),
            ])
          case 'poa-network':
            return h('.network-indicator', [
              h('.network-name', {
                style: {
                  paddingLeft: '9px',
                  color: '#6729a8',
                }},
              'POA Network'),
              props.onClick && h('i.fa.fa-caret-down.fa-lg'),
            ])
          default:
            return h('.network-indicator', [

              h('.network-name', {
                style: {
                  paddingLeft: '9px',
                  color: '#6729a8',
                }},
              'Private Network'),
              props.onClick && h('i.fa.fa-caret-down.fa-lg'),
            ])
        }
      })(),
    ])
  )
}
