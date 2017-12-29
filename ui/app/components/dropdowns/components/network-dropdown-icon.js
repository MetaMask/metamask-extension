const inherits = require('util').inherits
const Component = require('react').Component
const h = require('react-hyperscript')


inherits(NetworkDropdownIcon, Component)
module.exports = NetworkDropdownIcon

function NetworkDropdownIcon () {
  Component.call(this)
}

NetworkDropdownIcon.prototype.render = function () {
  const {
    backgroundColor,
    isSelected,
    innerBorder = 'none',
  } = this.props

  return h(`.menu-icon-circle${isSelected ? '--active' : ''}`, {},
    h('div', {
      style: {
        background: backgroundColor,
        border: innerBorder,
      },
    })
  )
}
