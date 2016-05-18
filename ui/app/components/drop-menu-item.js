const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = DropMenuItem


inherits(DropMenuItem, Component)
function DropMenuItem() {
  Component.call(this)
}

DropMenuItem.prototype.render = function() {

  return h('li.drop-menu-item', {
    onClick:() => {
      this.props.closeMenu()
      this.props.action()
    },
    style: {
      listStyle: 'none',
      padding: '6px 10px 6px 17px',
      fontFamily: 'Transat Medium',
      color: 'rgb(125, 128, 130)',
      cursor: 'pointer',
    },
  }, [
    this.props.icon,
    this.props.label,
  ])
}
