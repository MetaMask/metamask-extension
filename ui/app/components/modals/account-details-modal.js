const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const { getSelectedIdentity, getSelectedAddress } = require('../../selectors')

const QrView = require('../qr-code')

function mapStateToProps (state) {
  return {
    address: state.metamask.selectedAddress,
    // selectedAddress: getSelectedAddress(state),
    selectedIdentity: getSelectedIdentity(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    },
    showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
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
  const { selectedIdentity } = this.props

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
        h(QrView, {
          Qr: {
            message: this.props.selectedIdentity.name,
            data: this.props.selectedIdentity.address,
          }
        }, []),
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
