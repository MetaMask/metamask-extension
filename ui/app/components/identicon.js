const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const isNode = require('detect-node')
const findDOMNode = require('react-dom').findDOMNode
const jazzicon = require('jazzicon')
const iconFactoryGen = require('../../lib/icon-factory')
const iconFactory = iconFactoryGen(jazzicon)

module.exports = IdenticonComponent

inherits(IdenticonComponent, Component)
function IdenticonComponent () {
  Component.call(this)

  this.defaultDiameter = 46
}

IdenticonComponent.prototype.render = function () {
  var props = this.props
  var diameter = props.diameter || this.defaultDiameter
  return (
    h('div', {
      key: 'identicon-' + this.props.address,
      style: {
        display: 'inline-block',
        height: diameter,
        width: diameter,
        borderRadius: diameter / 2,
        overflow: 'hidden',
      },
    })
  )
}

IdenticonComponent.prototype.componentDidMount = function () {
  var props = this.props
  var address = props.address

  if (!address) return

  var container = findDOMNode(this)
  var diameter = props.diameter || this.defaultDiameter
  if (!isNode) {
    var img = iconFactory.iconForAddress(address, diameter, false)
    container.appendChild(img)
  }
}

IdenticonComponent.prototype.componentDidUpdate = function () {
  var props = this.props
  var address = props.address

  if (!address) return

  var container = findDOMNode(this)

  var children = container.children
  for (var i = 0; i < children.length; i++) {
    container.removeChild(children[i])
  }

  var diameter = props.diameter || this.defaultDiameter
  if (!isNode) {
    var img = iconFactory.iconForAddress(address, diameter, false)
    container.appendChild(img)
  }
}
