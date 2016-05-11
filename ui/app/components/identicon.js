const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const jazzicon = require('jazzicon')
const findDOMNode = require('react-dom').findDOMNode

module.exports = IdenticonComponent

inherits(IdenticonComponent, Component)
function IdenticonComponent() {
  Component.call(this)

  this.diameter = 46
}

IdenticonComponent.prototype.render = function() {
  return (
    h('div', {
      key: 'identicon-' + this.props.address,
      style: {
        display: 'inline-block',
        height: this.diameter,
        width: this.diameter,
        borderRadius: this.diameter / 2,
        overflow: 'hidden',
      },
    })
  )
}

IdenticonComponent.prototype.componentDidMount = function(){
  var state = this.props
  var address = state.address

  if (!address) return
    console.log('rendering for address ' + address)
  var numericRepresentation = jsNumberForAddress(address)

  var container = findDOMNode(this)
  // jazzicon with hack to fix inline svg error
  var identicon = jazzicon(this.diameter, numericRepresentation)
  var identiconSrc = identicon.innerHTML
  var dataUri = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(identiconSrc)
  var img = document.createElement('img')
  img.src = dataUri
  container.appendChild(img)
}

function jsNumberForAddress(address) {
  var addr = address.slice(2, 10)
  var seed = parseInt(addr, 16)
  return seed
}
