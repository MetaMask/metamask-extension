const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = Network

inherits(Network, Component)

function Network() {
  Component.call(this)
}

Network.prototype.render = function() {
  const state = this.props
  const networkNumber = state.network
  let iconName, hoverText
  const imagePath = "/images/"

  if (networkNumber == undefined || networkNumber == "error") {
    hoverText = 'No Blockchain Connection'
    iconName = 'no-connection'
  } else if (networkNumber ==  'loading') {
    return h('img', {
      title: 'Contacting network...',
      style: {
        width: '27px',
      },
      src: 'images/loading.svg',
    })
  } else if (networkNumber ==  1) {
    hoverText = 'Main Ethereum Network'
    iconName = 'ethereum-network'
  }else if (networkNumber ==  2) {
    hoverText = "Morden Test Network"
    iconName = 'morden-test-network'
  }else {
    hoverText = "Unknown Private Network"
    iconName = 'unknown-private-network'
  }
  return (
    h('#network_component.flex-center', {
      style: {},
      title: hoverText,
    },[ h('img',{src: imagePath + iconName + ".jpg", width: '25px'}) ])
  )
}
