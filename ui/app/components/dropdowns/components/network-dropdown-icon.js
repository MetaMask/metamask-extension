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
    innerBorder,
    nonSelectBackgroundColor
  } = this.props

  return h('.menu-icon-circle-select', {
    style: {
      border: isSelected && '1px solid white',
      background: isSelected ? 'rgba(100, 100, 100, 0.4)' : 'none',
    },
  }, h('.menu-icon-circle', {
    style: {
      background: isSelected ? backgroundColor : nonSelectBackgroundColor,
      border: innerBorder ? innerBorder : 'none',
    },
  }))
}
