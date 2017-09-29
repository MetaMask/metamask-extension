const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const Identicon = require('../identicon')

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    token: state.appState.modal.modalState.token,
  }
}

function mapDispatchToProps (dispatch) {
  return {}
}

inherits(HideTokenConfirmationModal, Component)
function HideTokenConfirmationModal () {
  Component.call(this)

  this.state = {}
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(HideTokenConfirmationModal)

HideTokenConfirmationModal.prototype.render = function () {
  const { token, network } = this.props
  const { symbol, address } = token

  return h('div.hide-token-confirmation', {}, [
    h('div.hide-token-confirmation__container', {
    }, [
      h('div.hide-token-confirmation__title', {}, [
        'Hide Token?',
      ]),

      h(Identicon, {
        className: 'hide-token-confirmation__identicon',
        diameter: 45,
        address,
        network,
      }),

      h('div.hide-token-confirmation__symbol', {}, symbol),

      h('div.hide-token-confirmation__copy', {}, [
        'You can add this token back in the future by going go to “Add token” in your accounts options menu.',
      ]),

      h('div.hide-token-confirmation__buttons', {}, [
        h('button.btn-clear', {
          onClick: () => {},
        }, [
          'CANCEL',
        ]),
        h('button.btn-clear', {
          onClick: () => {},
        }, [
          'HIDE',
        ]),
      ]),
    ]),
  ])
}
