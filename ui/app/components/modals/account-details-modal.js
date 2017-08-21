const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')

function mapStateToProps (state) {
  return {
    address: state.metamask.selectedAddress,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    }
  }
}

inherits(AccountDetailsModal, Component)
function AccountDetailsModal () {
  Component.call(this)
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountDetailsModal)

// AccountDetailsModal is currently meant to be rendered inside <Modal />
// It is the only component in this codebase that does so
// It utilizes modal styles
AccountDetailsModal.prototype.render = function () {
  return h('div', {}, [
    h('div.account-details-modal-wrapper', {
    }, [

      h('div', {}, [
        'ICON',
      ]),

      h('div', {}, [
        'X',
      ]),

      h('div', {}, [
      ]),

      h('div', {}, [
        'QR Code',
      ]),

      h('div', {}, [
        'Account Display',
      ]),

      h('div', {}, [
        'divider',
      ]),

      h('div', {}, [
        'View aCcount on etherscan',
      ]),

      h('div', {}, [
        'export private key',
      ]),

    ])
  ])
}
