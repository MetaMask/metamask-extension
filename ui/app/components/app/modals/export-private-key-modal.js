const log = require('loglevel')
const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const { stripHexPrefix } = require('ethereumjs-util')
const actions = require('../../../store/actions')
const AccountModalContainer = require('./account-modal-container')
const { getSelectedIdentity } = require('../../../selectors/selectors')
const ReadOnlyInput = require('../../ui/readonly-input')
const copyToClipboard = require('copy-to-clipboard')
const { checksumAddress } = require('../../../helpers/utils/util')
import Button from '../../ui/button'

function mapStateToPropsFactory () {
  let selectedIdentity = null
  return function mapStateToProps (state) {
    // We should **not** change the identity displayed here even if it changes from underneath us.
    // If we do, we will be showing the user one private key and a **different** address and name.
    // Note that the selected identity **will** change from underneath us when we unlock the keyring
    // which is the expected behavior that we are side-stepping.
    selectedIdentity = selectedIdentity || getSelectedIdentity(state)
    return {
      warning: state.appState.warning,
      privateKey: state.appState.accountDetail.privateKey,
      network: state.metamask.network,
      selectedIdentity,
      previousModalState: state.appState.modal.previousModalState.name,
    }
  }
}

function mapDispatchToProps (dispatch) {
  return {
    exportAccount: (password, address) => {
      return dispatch(actions.exportAccount(password, address))
        .then((res) => {
          dispatch(actions.hideWarning())
          return res
        })
    },
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
    showWarning: true,
  }
}

ExportPrivateKeyModal.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToPropsFactory, mapDispatchToProps)(ExportPrivateKeyModal)


ExportPrivateKeyModal.prototype.exportAccountAndGetPrivateKey = function (password, address) {
  const { exportAccount } = this.props

  exportAccount(password, address)
    .then(privateKey => this.setState({
      privateKey,
      showWarning: false,
    }))
    .catch((e) => log.error(e))
}

ExportPrivateKeyModal.prototype.renderPasswordLabel = function (privateKey) {
  return h('span.private-key-password-label', privateKey
    ? this.context.t('copyPrivateKey')
    : this.context.t('typePassword')
  )
}

ExportPrivateKeyModal.prototype.renderPasswordInput = function (privateKey) {
  const plainKey = privateKey && stripHexPrefix(privateKey)

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

ExportPrivateKeyModal.prototype.renderButtons = function (privateKey, address, hideModal) {
  return h('div.export-private-key-buttons', {}, [
    !privateKey && h(Button, {
      type: 'default',
      large: true,
      className: 'export-private-key__button export-private-key__button--cancel',
      onClick: () => hideModal(),
    }, this.context.t('cancel')),

    (privateKey
      ? (
        h(Button, {
          type: 'secondary',
          large: true,
          className: 'export-private-key__button',
          onClick: () => hideModal(),
        }, this.context.t('done'))
      ) : (
        h(Button, {
          type: 'secondary',
          large: true,
          className: 'export-private-key__button',
          onClick: () => this.exportAccountAndGetPrivateKey(this.state.password, address),
        }, this.context.t('confirm'))
      )
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

  const {
    privateKey,
    showWarning,
  } = this.state

  return h(AccountModalContainer, {
    selectedIdentity,
    showBackButton: previousModalState === 'ACCOUNT_DETAILS',
    backButtonAction: () => showAccountDetailModal(),
  }, [

    h('span.account-name', name),

    h(ReadOnlyInput, {
      wrapperClass: 'ellip-address-wrapper',
      inputClass: 'qr-ellip-address ellip-address',
      value: checksumAddress(address),
    }),

    h('div.account-modal-divider'),

    h('span.modal-body-title', this.context.t('showPrivateKeys')),

    h('div.private-key-password', {}, [
      this.renderPasswordLabel(privateKey),

      this.renderPasswordInput(privateKey),

      showWarning && warning ? h('span.private-key-password-error', warning) : null,
    ]),

    h('div.private-key-password-warning', this.context.t('privateKeyWarning')),

    this.renderButtons(privateKey, address, hideModal),

  ])
}
