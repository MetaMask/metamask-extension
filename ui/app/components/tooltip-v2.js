const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const ReactTippy = require('react-tippy').Tooltip

module.exports = Tooltip

inherits(Tooltip, Component)
function Tooltip () {
  Component.call(this)
}

Tooltip.prototype.render = function () {
  const props = this.props
  const { position, title, children, style, wrapperClassName } = props

  return h('div', {
      className: wrapperClassName,
    }, [

    h(ReactTippy, {
      title,
      position: position || 'left',
      trigger: 'mouseenter',
      hideOnClick: false,
      size: 'small',
      arrow: true,
      style,
    }, children),

  ])
}
