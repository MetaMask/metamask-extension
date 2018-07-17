const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const AccountModalContainer = require('./account-modal-container')
const { getSelectedIdentity } = require('../../selectors')
const genAccountLink = require('../../../lib/account-link.js')
const QrView = require('../qr-code')
const EditableLabel = require('../editable-label')

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    selectedIdentity: getSelectedIdentity(state),
    settings: state.metamask.settings,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    // Is this supposed to be used somewhere?
    showQrView: (selected, identity) => dispatch(actions.showQrView(selected, identity)),
    showExportPrivateKeyModal: () => {
      dispatch(actions.showModal({ name: 'EXPORT_PRIVATE_KEY' }))
    },
    hideModal: () => dispatch(actions.hideModal()),
    setAccountLabel: (address, label) => dispatch(actions.setAccountLabel(address, label)),
  }
}

inherits(AccountDetailsModal, Component)
function AccountDetailsModal () {
  Component.call(this)
}

AccountDetailsModal.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountDetailsModal)


// Not yet pixel perfect todos:
  // fonts of qr-header

AccountDetailsModal.prototype.render = function () {
  const {
    selectedIdentity,
    network,
    showExportPrivateKeyModal,
    setAccountLabel,
  } = this.props
  const { name, address } = selectedIdentity

  let link
  if (this.props.settings && this.props.settings.blockExplorerAddr) {
    link = this.props.settings.blockExplorerAddr
  }

  return h(AccountModalContainer, {}, [
      h(EditableLabel, {
        className: 'account-modal__name',
        defaultValue: name,
        onSubmit: label => setAccountLabel(address, label),
      }),

      h(QrView, {
        Qr: {
          data: address,
        },
      }),

      h('div.account-modal-divider'),

      h('button.btn-primary.account-modal__button', {
        onClick: () => global.platform.openWindow({ url: genAccountLink(address, network, link) }),
      }, this.context.t('etherscanView')),

      // Holding on redesign for Export Private Key functionality
      h('button.btn-primary.account-modal__button', {
        onClick: () => showExportPrivateKeyModal(),
      }, this.context.t('exportPrivateKey')),

  ])
}
