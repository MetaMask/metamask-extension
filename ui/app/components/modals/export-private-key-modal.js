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
      
  ])
}
