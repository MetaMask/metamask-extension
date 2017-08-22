const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const { getSelectedIdentity, getSelectedAddress } = require('../../selectors')
const genAccountLink = require('../../../lib/account-link.js')
const Identicon = require('../identicon')
const QrView = require('../qr-code')

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    address: state.metamask.selectedAddress,
    selectedAddress: getSelectedAddress(state),
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

// Not yet pixel perfect todos:
  // fonts of qr-header and close button

AccountDetailsModal.prototype.render = function () {
  const { selectedIdentity, selectedAddress, network } = this.props

  return h('div', {}, [
    h('div.account-details-modal-wrapper', {
    }, [

      h('div.account-details-modal-header', {}, [
        h('div', {}, [

          h(
            Identicon,
            {
              address: selectedIdentity.address,
              diameter: 64,
              style: {},
            },
          ),

        ]),

        h('div.account-details-modal-close', {}),
      ]),

      h(QrView, {
        Qr: {
          message: this.props.selectedIdentity.name,
          data: this.props.selectedIdentity.address,
        }
      }, []),

      // divider
      h('div.account-details-modal-divider', {
        style: {}
      }, []),

      h('button.btn-clear', {
        onClick: () => {
          const url = genAccountLink(selectedIdentity.address, network)
          global.platform.openWindow({ url })
        },
      }, [
        'View account on Etherscan',
      ]),

      // Holding on redesign for Export Private Key functionality
      h('button.btn-clear', {}, [
        'Export private key',
      ]),

    ])
  ])
}
