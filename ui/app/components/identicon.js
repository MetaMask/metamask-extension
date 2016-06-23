const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
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
  var state = this.props
  var diameter = state.diameter || this.defaultDiameter
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
  var state = this.props
  var address = state.address

  if (!address) return

  var container = findDOMNode(this)
  var diameter = state.diameter || this.defaultDiameter
  var imageify = state.imageify
  var img = iconFactory.iconForAddress(address, diameter, imageify)
  container.appendChild(img)
}

