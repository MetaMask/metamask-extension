const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const QrView = require('../qr-code')
const AccountModalContainer = require('./account-modal-container')

function mapStateToProps (state) {
  return {
    Qr: state.appState.modal.modalState.Qr,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    },
  }
}

inherits(ShapeshiftDepositTxModal, Component)
function ShapeshiftDepositTxModal () {
  Component.call(this)

}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ShapeshiftDepositTxModal)

ShapeshiftDepositTxModal.prototype.render = function () {
  const { Qr } = this.props

  return h(AccountModalContainer, {
  }, [
    h('div', {}, [
      h(QrView, {key: 'qr', Qr}),
    ]),
  ])
}
