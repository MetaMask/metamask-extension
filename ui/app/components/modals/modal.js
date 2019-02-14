const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const FadeModal = require('boron').FadeModal
const actions = require('../../actions')
const { resetCustomData: resetCustomGasData } = require('../../ducks/gas.duck')
const isMobileView = require('../../../lib/is-mobile-view')
const { getEnvironmentType } = require('../../../../app/scripts/lib/util')
const { ENVIRONMENT_TYPE_POPUP } = require('../../../../app/scripts/lib/enums')
const extend = require('xtend')

// Modal Components
const BuyOptions = require('./buy-options-modal')
const DepositEtherModal = require('./deposit-ether-modal')
const AccountDetailsModal = require('./account-details-modal')
const EditAccountNameModal = require('./edit-account-name-modal')
const ExportPrivateKeyModal = require('./export-private-key-modal')
const NewAccountModal = require('./new-account-modal')
const ShapeshiftDepositTxModal = require('./shapeshift-deposit-tx-modal.js')
const HideTokenConfirmationModal = require('./hide-token-confirmation-modal')
const NotifcationModal = require('./notification-modal')
const QRScanner = require('./qr-scanner')

import ConfirmRemoveAccount from './confirm-remove-account'
import ConfirmResetAccount from './confirm-reset-account'
import TransactionConfirmed from './transaction-confirmed'
import CancelTransaction from './cancel-transaction'
import RejectTransactions from './reject-transactions'
import ClearApprovedOrigins from './clear-approved-origins'
import ConfirmCustomizeGasModal from '../gas-customization/gas-modal-page-container'
import ExternalSignModal from './external-sign-modal'

const modalContainerBaseStyle = {
  transform: 'translate3d(-50%, 0, 0px)',
  border: '1px solid #CCCFD1',
  borderRadius: '8px',
  backgroundColor: '#FFFFFF',
  boxShadow: '0 2px 22px 0 rgba(0,0,0,0.2)',
}

const modalContainerLaptopStyle = {
  ...modalContainerBaseStyle,
  width: '344px',
  top: '15%',
}

const modalContainerMobileStyle = {
  ...modalContainerBaseStyle,
  width: '309px',
  top: '12.5%',
}

const accountModalStyle = {
  mobileModalStyle: {
    width: '95%',
    // top: isPopupOrNotification() === 'popup' ? '52vh' : '36.5vh',
    boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    borderRadius: '4px',
    top: '10%',
    transform: 'none',
    left: '0',
    right: '0',
    margin: '0 auto',
  },
  laptopModalStyle: {
    width: '360px',
    // top: 'calc(33% + 45px)',
    boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    borderRadius: '4px',
    top: '10%',
    transform: 'none',
    left: '0',
    right: '0',
    margin: '0 auto',
  },
  contentStyle: {
    borderRadius: '4px',
  },
}

const MODALS = {
  BUY: {
    contents: [
      h(BuyOptions, {}, []),
    ],
    mobileModalStyle: {
      width: '95%',
      // top: isPopupOrNotification() === 'popup' ? '48vh' : '36.5vh',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
      boxShadow: '0 0 7px 0 rgba(0,0,0,0.08)',
      top: '10%',
    },
    laptopModalStyle: {
      width: '66%',
      maxWidth: '550px',
      top: 'calc(10% + 10px)',
      left: '0',
      right: '0',
      margin: '0 auto',
      boxShadow: '0 0 7px 0 rgba(0,0,0,0.08)',
      transform: 'none',
    },
  },

  DEPOSIT_ETHER: {
    contents: [
      h(DepositEtherModal, {}, []),
    ],
    onHide: (props) => props.hideWarning(),
    mobileModalStyle: {
      width: '100%',
      height: '100%',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
      boxShadow: '0 0 7px 0 rgba(0,0,0,0.08)',
      top: '0',
      display: 'flex',
    },
    laptopModalStyle: {
      width: 'initial',
      maxWidth: '850px',
      top: 'calc(10% + 10px)',
      left: '0',
      right: '0',
      margin: '0 auto',
      boxShadow: '0 0 6px 0 rgba(0,0,0,0.3)',
      borderRadius: '7px',
      transform: 'none',
      height: 'calc(80% - 20px)',
      overflowY: 'hidden',
    },
    contentStyle: {
      borderRadius: '7px',
      height: '100%',
    },
  },

  EDIT_ACCOUNT_NAME: {
    contents: [
      h(EditAccountNameModal, {}, []),
    ],
    mobileModalStyle: {
      width: '95%',
      // top: isPopupOrNotification() === 'popup' ? '48vh' : '36.5vh',
      top: '10%',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
    laptopModalStyle: {
      width: '375px',
      // top: 'calc(30% + 10px)',
      top: '10%',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
  },

  ACCOUNT_DETAILS: {
    contents: [
      h(AccountDetailsModal, {}, []),
    ],
    ...accountModalStyle,
  },

  EXTERNAL_SIGN: {
    contents: [
      h(ExternalSignModal),
    ],
    mobileModalStyle: {
      width: '100vw',
      height: '100vh',
      top: '0',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
    laptopModalStyle: {
      width: '600px',
      height: '640px',
      top: '20px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
  },

  EXPORT_PRIVATE_KEY: {
    contents: [
      h(ExportPrivateKeyModal, {}, []),
    ],
    ...accountModalStyle,
  },

  SHAPESHIFT_DEPOSIT_TX: {
    contents: [
      h(ShapeshiftDepositTxModal),
    ],
    ...accountModalStyle,
  },

  HIDE_TOKEN_CONFIRMATION: {
    contents: [
      h(HideTokenConfirmationModal, {}, []),
    ],
    mobileModalStyle: {
      width: '95%',
      top: getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP ? '52vh' : '36.5vh',
    },
    laptopModalStyle: {
      width: '449px',
      top: 'calc(33% + 45px)',
    },
  },

  CLEAR_APPROVED_ORIGINS: {
    contents: h(ClearApprovedOrigins),
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  OLD_UI_NOTIFICATION_MODAL: {
    contents: [
      h(NotifcationModal, {
        header: 'oldUI',
        message: 'oldUIMessage',
      }),
    ],
    mobileModalStyle: {
      width: '95%',
      top: getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP ? '52vh' : '36.5vh',
    },
    laptopModalStyle: {
      width: '449px',
      top: 'calc(33% + 45px)',
    },
  },

  GAS_PRICE_INFO_MODAL: {
    contents: [
      h(NotifcationModal, {
        header: 'gasPriceNoDenom',
        message: 'gasPriceInfoModalContent',
      }),
    ],
    mobileModalStyle: {
      width: '95%',
      top: getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP ? '52vh' : '36.5vh',
    },
    laptopModalStyle: {
      width: '449px',
      top: 'calc(33% + 45px)',
    },
  },

  GAS_LIMIT_INFO_MODAL: {
    contents: [
      h(NotifcationModal, {
        header: 'gasLimit',
        message: 'gasLimitInfoModalContent',
      }),
    ],
    mobileModalStyle: {
      width: '95%',
      top: getEnvironmentType(window.location.href) === ENVIRONMENT_TYPE_POPUP ? '52vh' : '36.5vh',
    },
    laptopModalStyle: {
      width: '449px',
      top: 'calc(33% + 45px)',
    },
  },

  CONFIRM_RESET_ACCOUNT: {
    contents: h(ConfirmResetAccount),
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  CONFIRM_REMOVE_ACCOUNT: {
    contents: h(ConfirmRemoveAccount),
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  NEW_ACCOUNT: {
    contents: [
      h(NewAccountModal, {}, []),
    ],
    mobileModalStyle: {
      width: '95%',
      // top: isPopupOrNotification() === 'popup' ? '52vh' : '36.5vh',
      top: '10%',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
    laptopModalStyle: {
      width: '449px',
      // top: 'calc(33% + 45px)',
      top: '10%',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
  },

  CUSTOMIZE_GAS: {
    contents: [
      h(ConfirmCustomizeGasModal),
    ],
    mobileModalStyle: {
      width: '100vw',
      height: '100vh',
      top: '0',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
    laptopModalStyle: {
      width: 'auto',
      height: '0px',
      top: '80px',
      left: '0px',
      transform: 'none',
      margin: '0 auto',
      position: 'relative',
    },
    contentStyle: {
      borderRadius: '8px',
    },
    customOnHideOpts: {
      action: resetCustomGasData,
      args: [],
    },
  },

  TRANSACTION_CONFIRMED: {
    disableBackdropClick: true,
    contents: h(TransactionConfirmed),
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  QR_SCANNER: {
    contents: h(QRScanner),
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  CANCEL_TRANSACTION: {
    contents: h(CancelTransaction),
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  REJECT_TRANSACTIONS: {
    contents: h(RejectTransactions),
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  DEFAULT: {
    contents: [],
    mobileModalStyle: {},
    laptopModalStyle: {},
  },
}

const BACKDROPSTYLE = {
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
}

function mapStateToProps (state) {
  return {
    active: state.appState.modal.open,
    currentView: state.appState.currentView.name,
    modalState: state.appState.modal.modalState,
    extToSign: state.metamask.extToSign,
    txId: state.confirmTransaction ? state.confirmTransaction.txData.id : null,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: (customOnHideOpts) => {
      dispatch(actions.hideModal())
      if (customOnHideOpts && customOnHideOpts.action) {
        dispatch(customOnHideOpts.action(...customOnHideOpts.args))
      }
    },
    hideWarning: () => {
      dispatch(actions.hideWarning())
    },
    showModal: (payload) => {
      dispatch(actions.showModal(payload))
    },
  }
}

// Global Modal Component
inherits(Modal, Component)
function Modal () {
  Component.call(this)
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Modal)

Modal.prototype.render = function () {
  const modal = MODALS[this.props.modalState.name || 'DEFAULT']

  const { contents: children, disableBackdropClick = false } = modal
  const modalStyle = modal[isMobileView() ? 'mobileModalStyle' : 'laptopModalStyle']
  const contentStyle = modal.contentStyle || {}

  return h(FadeModal,
    {
      className: 'modal',
      keyboard: false,
      onHide: () => {
        if (modal.onHide) {
          modal.onHide(this.props)
        }
        this.onHide(modal.customOnHideOpts)
      },
      ref: (ref) => {
        this.modalRef = ref
      },
      modalStyle,
      contentStyle,
      backdropStyle: BACKDROPSTYLE,
      closeOnClick: !disableBackdropClick,
    },
    children,
  )
}

Modal.prototype.componentWillReceiveProps = function (nextProps) {
  if (nextProps.extToSign) {
    const extToSign = nextProps.extToSign[0]
    if (
      (
        !this.props.extToSign ||
        nextProps.extToSign.length > this.props.extToSign.length
      ) &&
      (
        (
          extToSign.type === 'sign_transaction' &&
          nextProps.txId === extToSign.id
        ) ||
        extToSign.type !== 'sign_transaction'
      ) &&
      !(this.props.modalState.name === 'EXTERNAL_SIGN' &&
        this.props.modalState.open)
    ) {
      this.props.showModal({
        name: 'EXTERNAL_SIGN',
        signable: extend({}, nextProps.extToSign[0]),
        updateMetamask: true,
      })
    }
  }
  if (nextProps.active) {
    this.show()
  } else if (this.props.active) {
    this.hide()
  }
}

Modal.prototype.onHide = function (customOnHideOpts) {
  if (this.props.onHideCallback) {
    this.props.onHideCallback()
  }
  this.props.hideModal(customOnHideOpts)
}

Modal.prototype.hide = function () {
  this.modalRef.hide()
}

Modal.prototype.show = function () {
  this.modalRef.show()
}
