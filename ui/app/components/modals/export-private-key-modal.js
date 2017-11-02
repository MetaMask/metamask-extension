const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const ethUtil = require('ethereumjs-util')
const actions = require('../../actions')
const AccountModalContainer = require('./account-modal-container')
const { getSelectedIdentity } = require('../../selectors')
const ReadOnlyInput = require('../readonly-input')
const copyToClipboard = require('copy-to-clipboard')

function mapStateToProps (state) {
  return {
    warning: state.appState.warning,
    privateKey: state.appState.accountDetail.privateKey,
    network: state.metamask.network,
    selectedIdentity: getSelectedIdentity(state),
    previousModalState: state.appState.modal.previousModalState.name,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    exportAccount: (password, address) => dispatch(actions.exportAccount(password, address)),
    showAccountDetailModal: () => dispatch(actions.showModal({ name: 'ACCOUNT_DETAILS' })),
    hideModal: () => dispatch(actions.hideModal()),
  }
}

inherits(ExportPrivateKeyModal, Component)
function ExportPrivateKeyModal () {
  Component.call(this)

  this.state = {
    password: '',
    privateKey: null,
  }
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(ExportPrivateKeyModal)

ExportPrivateKeyModal.prototype.exportAccountAndGetPrivateKey = function (password, address) {
  const { exportAccount } = this.props

  exportAccount(password, address)
    .then(privateKey => this.setState({ privateKey }))
}

ExportPrivateKeyModal.prototype.renderPasswordLabel = function (privateKey) {
  return h('span.private-key-password-label', privateKey
    ? 'This is your private key (click to copy)'
    : 'Type Your Password'
  )
}

ExportPrivateKeyModal.prototype.renderPasswordInput = function (privateKey) {
  const plainKey = privateKey && ethUtil.stripHexPrefix(privateKey)

  return privateKey
    ? h(ReadOnlyInput, {
        wrapperClass: 'private-key-password-display-wrapper',
        inputClass: 'private-key-password-display-textarea',
        textarea: true,
        value: plainKey,
        onClick: () => copyToClipboard(plainKey),
      })
    : h('input.private-key-password-input', {
      type: 'password',
      onChange: event => this.setState({ password: event.target.value }),
    })
}

ExportPrivateKeyModal.prototype.renderButton = function (className, onClick, label) {
  return h('button', {
    className,
    onClick,
  }, label)
}

ExportPrivateKeyModal.prototype.renderButtons = function (privateKey, password, address, hideModal) {
  return h('div.export-private-key-buttons', {}, [
    !privateKey && this.renderButton('btn-clear btn-cancel', () => hideModal(), 'Cancel'),

    (privateKey
      ? this.renderButton('btn-clear', () => hideModal(), 'Done')
      : this.renderButton('btn-clear', () => this.exportAccountAndGetPrivateKey(this.state.password, address), 'Show')
    ),

  ])
}

ExportPrivateKeyModal.prototype.render = function () {
  const {
    selectedIdentity,
    warning,
    showAccountDetailModal,
    hideModal,
    previousModalState,
  } = this.props
  const { name, address } = selectedIdentity

  const { privateKey } = this.state

  return h(AccountModalContainer, {
    showBackButton: previousModalState === 'ACCOUNT_DETAILS',
    backButtonAction: () => showAccountDetailModal(),
  }, [

      h('span.account-name', name),

      h(ReadOnlyInput, {
        wrapperClass: 'ellip-address-wrapper',
        inputClass: 'qr-ellip-address ellip-address',
        value: address,
      }),

      h('div.account-modal-divider'),

      h('span.modal-body-title', 'Show Private Keys'),

      h('div.private-key-password', {}, [
        this.renderPasswordLabel(privateKey),

        this.renderPasswordInput(privateKey),

        !warning ? null : h('span.private-key-password-error', warning),
      ]),

      h('div.private-key-password-warning', `Warning: Never disclose this key.
        Anyone with your private keys can take steal any assets held in your
        account.`
      ),

      this.renderButtons(privateKey, this.state.password, address, hideModal),

  ])
}
