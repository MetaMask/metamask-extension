const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const ethNetProps = require('eth-net-props')

module.exports = Network

inherits(Network, Component)

function Network () {
  Component.call(this)
}

Network.prototype.render = function () {
  const props = this.props
  const { provider, network: networkNumber } = props
  let providerName
  try {
    providerName = provider.type
  } catch (e) {
    providerName = null
  }
  let displayName, hoverText

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
  } else {
    if (providerName === 'mainnet') {
      displayName = 'Main Network'
      hoverText = ethNetProps.props.getNetworkDisplayName(networkNumber)
    } else if (providerName === 'ropsten' || parseInt(networkNumber) === 3) {
      displayName = 'Ropsten Test Net'
      hoverText = ethNetProps.props.getNetworkDisplayName(networkNumber)
    } else if (providerName === 'sokol') {
      displayName = 'Sokol Network'
      hoverText = ethNetProps.props.getNetworkDisplayName(networkNumber)
    } else if (providerName === 'kovan') {
      displayName = 'Kovan Test Net'
      hoverText = ethNetProps.props.getNetworkDisplayName(networkNumber)
    } else if (providerName === 'rinkeby') {
      displayName = 'Rinkeby Test Net'
      hoverText = ethNetProps.props.getNetworkDisplayName(networkNumber)
    } else if (providerName === 'poa') {
      displayName = 'POA Network'
      hoverText = ethNetProps.props.getNetworkDisplayName(networkNumber)
    } else {
      displayName = 'Private Network'
      hoverText = `Private Network (${provider.rpcTarget})`
    }
  }

  return (
    h('#network_component', {
      className: props.onClick && 'pointer',
      title: hoverText,
      onClick: (event) => props.onClick && props.onClick(event),
    }, [
      (function () {
        return h(props.isUnlocked ? '.network-indicator' : '.network-indicator.hidden', [
          h('.network-name',
          displayName),
          props.onClick && h('i.fa.fa-caret-down.fa-lg'),
        ])
      })(),
    ])
  )
}
