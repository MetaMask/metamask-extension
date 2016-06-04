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

  if (networkNumber ==  'loading') {
    return h('img', {
      title: 'Attempting to connect to blockchain.',
      style: {
        width: '27px',
        marginRight: '-27px'
      },
      src: 'images/loading.svg',
    })
  } else if (parseInt(networkNumber) ==  1) {
    hoverText = 'Main Ethereum Network'
    iconName = 'ethereum-network'
  }else if (parseInt(networkNumber) ==  2) {
    hoverText = "Morden Test Network"
    iconName = 'morden-test-network'
  }else {
    hoverText = "Unknown Private Network"
    iconName = 'unknown-private-network'
  }
  return (
    h('#network_component.flex-center.pointer', {
      style: {
        marginRight: '-27px',
        marginLeft: '-3px',
      },
      title: hoverText,
      onClick:(event) => this.props.onClick(event),
    },[
        function() {
          switch (iconName) {
            case 'ethereum-network':
              return h('.menu-icon.ether-icon')
            case 'morden-test-network':
              return h('.menu-icon.morden-icon')
            default:
              return h('i.fa.fa-question-circle.fa-lg', {
                ariaHidden: true,
                style: {
                  margin: '10px',
                  color: 'rgb(125, 128, 130)',
                },
              })
          }
        }()
    ])
  )
}
