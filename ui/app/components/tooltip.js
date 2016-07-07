const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const ReactTooltip = require('react-tooltip-component')

module.exports = Tooltip

inherits(Tooltip, Component)
function Tooltip () {
  Component.call(this)
}

Tooltip.prototype.render = function () {
  const props = this.props

  return h(ReactTooltip, {
    position: props.position ? props.position : 'left',
    title: props.title,
    fixed: false,
  }, props.children)

}
