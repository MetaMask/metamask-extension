const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../../actions')
const AccountModalContainer = require('./account-modal-container')
const { getSelectedIdentity } = require('../../selectors')
const ReadOnlyInput = require('../readonly-input')

function mapStateToProps (state) {
  return {
    network: state.metamask.network,
    selectedIdentity: getSelectedIdentity(state),
  }
}

inherits(ExportPrivateKeyModal, Component)
function ExportPrivateKeyModal () {
  Component.call(this)
}

module.exports = connect(mapStateToProps)(ExportPrivateKeyModal)

ExportPrivateKeyModal.prototype.render = function () {
  const { selectedIdentity, network } = this.props
  const { name, address } = selectedIdentity

  return h(AccountModalContainer, {}, [

      h('span.account-name', name),

      h(ReadOnlyInput, {
        wrapperClass: 'ellip-address-wrapper',
        inputClass: 'ellip-address',
        value: address,
      }),

      h('div.account-modal-divider'),
      
      h('span.modal-body-title', 'Download Private Keys'),

      h('div.private-key-password', {}, [
        h('span.private-key-password-label', 'Type Your Password'),

        h('input.private-key-password-input', {
          type: 'password',
          placeholder: 'Type password',
        }),
      ]),

      h('div.private-key-password-warning', `Warning: Never disclose this key.
        Anyone with your private keys can take steal any assets held in your
        account.`
      ),

      h('div.export-private-key-buttons', {}, [
        h('button.btn-clear.btn-cancel', {}, 'Cancel'),

        h('button.btn-clear', 'Download'),
      ]),
      
  ])
}
