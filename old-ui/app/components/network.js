const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const ethNetProps = require('eth-net-props')
const { networks } = require('../../../app/scripts/controllers/network/util')

module.exports = Network

inherits(Network, Component)

function Network () {
  Component.call(this)
}

Network.prototype.render = function () {
  const props = this.props
  const { provider, network: networkNumber } = props
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
    if (networkNumber && networks[networkNumber]) {
      displayName = networks[networkNumber].displayNameDropdown
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
