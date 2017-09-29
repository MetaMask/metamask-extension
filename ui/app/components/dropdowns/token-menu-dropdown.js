const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = TokenMenuDropdown

inherits(TokenMenuDropdown, Component)
function TokenMenuDropdown () {
  Component.call(this)

  this.onClose = this.onClose.bind(this)
}

TokenMenuDropdown.prototype.onClose = function (e) {
  e.stopPropagation()
  this.props.onClose()
}

TokenMenuDropdown.prototype.render = function () {
  return h('div.token-menu-dropdown', {}, [
    h('div.token-menu-dropdown__close-area', {
      onClick: this.onClose,
    }),
    h('div.token-menu-dropdown__container', {}, [
      h('div.token-menu-dropdown__options', {}, [
        
        h('div.token-menu-dropdown__option', {
          onClick: (e) => {
            e.stopPropagation()
            console.log('div.token-menu-dropdown__option!')
          },
        }, 'Hide Token')

      ]),
    ]),
  ])
}

