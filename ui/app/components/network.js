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
    return h('img.network-indicator', {
      title: 'Attempting to connect to blockchain.',
      onClick: (event) => this.props.onClick(event),
      style: {
        width: '27px',
        marginRight: '-27px',
      },
      src: 'images/loading.svg',
    })
  } else if (providerName === 'mainnet') {
    hoverText = 'Main Ethereum Network'
    iconName = 'ethereum-network'
  } else if (providerName === 'testnet') {
    hoverText = 'Ropsten Test Network'
    iconName = 'ropsten-test-network'
  } else if (parseInt(networkNumber) === 3) {
    hoverText = 'Ropsten Test Network'
    iconName = 'ropsten-test-network'
  } else {
    hoverText = 'Unknown Private Network'
    iconName = 'unknown-private-network'
  }

  return (
    h('#network_component.pointer', {
      title: hoverText,
      onClick: (event) => this.props.onClick(event),
    }, [
      (function () {
        switch (iconName) {
          case 'ethereum-network':
            return h('.network-indicator', [
              h('.menu-icon.diamond'),
              h('.network-name', {
                style: {
                  color: '#039396',
                }},
              'Ethereum Main Net'),
            ])
          case 'ropsten-test-network':
            return h('.network-indicator', [
              h('.menu-icon.red-dot'),
              h('.network-name', {
                style: {
                  color: '#ff6666',
                }},
              'Ropsten Test Net'),
            ])
          default:
            return h('.network-indicator', [
              h('i.fa.fa-question-circle.fa-lg', {
                style: {
                  margin: '10px',
                  color: 'rgb(125, 128, 130)',
                },
              }),

              h('.network-name', {
                style: {
                  color: '#AEAEAE',
                }},
              'Private Network'),
            ])
        }
      })(),
    ])
  )
}
