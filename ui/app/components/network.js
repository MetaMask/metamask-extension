const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = Network

inherits(Network, Component)

function Network() {
  Component.call(this)
}

Network.prototype.render = function() {
  var state = this.props
  var networkNumber = state.network
  var networkName;
  var imagePath = "/images/"

  if (networkNumber == undefined || networkNumber == "error") {
    networkName = "No Blockchain Connection"
  } else if (networkNumber ==  1) {
    networkName = "Main Ethereum Network"
  } else if (networkNumber ==  2) {
    networkName = "Morden Test Network"
  } else {
    networkName = "Unknown Private Network"
  }
  return (
    h('#network_component.flex-center', {
      style: {},
      title: networkName
    },[ h('img',{src: imagePath + networkName + ".jpg", width: '25px'}) ])
  )
}
