const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')

module.exports = connect(null, mapDispatchToProps)(TokenMenuDropdown)

function mapDispatchToProps (dispatch) {
  return {
    showHideTokenConfirmationModal: (token) => {
      dispatch(actions.showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token }))
    },
  }
}


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
  const { showHideTokenConfirmationModal } = this.props

  return h('div.token-menu-dropdown', {}, [
    h('div.token-menu-dropdown__close-area', {
      onClick: this.onClose,
    }),
    h('div.token-menu-dropdown__container', {}, [
      h('div.token-menu-dropdown__options', {}, [

        h('div.token-menu-dropdown__option', {
          onClick: (e) => {
            e.stopPropagation()
            showHideTokenConfirmationModal(this.props.token)
            this.props.onClose()
          },
        }, 'Hide Token'),

      ]),
    ]),
  ])
}
