const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const AccountModalContainer = require('./account-modal-container')
const { getSelectedIdentity, getSelectedAddress } = require('../../selectors')
const genAccountLink = require('../../../lib/account-link.js')
const QrView = require('../qr-code')

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    selectedIdentity: getSelectedIdentity(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    // Is this supposed to be used somewhere?
    showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
  }
}

inherits(AccountDetailsModal, Component)
function AccountDetailsModal () {
  Component.call(this)
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountDetailsModal)

// Not yet pixel perfect todos:
  // fonts of qr-header

AccountDetailsModal.prototype.render = function () {
  const { selectedIdentity, network } = this.props
  const { name, address } = selectedIdentity

  return h(AccountModalContainer, {}, [
      h(QrView, {
        Qr: {
          message: name,
          data: address,
        },
      }),

      h('div.account-modal-divider'),

      h('button.btn-clear', {
        onClick: () => global.platform.openWindow({ url: genAccountLink(address, network) }),
      }, [ 'View account on Etherscan' ]),

      // Holding on redesign for Export Private Key functionality
      h('button.btn-clear', [ 'Export private key' ]),
      
  ])
}
