const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const FadeModal = require('boron').FadeModal
const actions = require('../../../store/actions')
const { resetCustomData: resetCustomGasData } = require('../../../ducks/gas/gas.duck')
const isMobileView = require('../../../../lib/is-mobile-view')
const { getEnvironmentType } = require('../../../../../app/scripts/lib/util')
const { ENVIRONMENT_TYPE_POPUP } = require('../../../../../app/scripts/lib/enums')

// Modal Components
const DepositEtherModal = require('./deposit-ether-modal')
import AccountDetailsModal from './account-details-modal'
const ExportPrivateKeyModal = require('./export-private-key-modal')
const HideTokenConfirmationModal = require('./hide-token-confirmation-modal')
const NotifcationModal = require('./notification-modal')
const QRScanner = require('./qr-scanner')

import ConfirmRemoveAccount from './confirm-remove-account'
import ConfirmResetAccount from './confirm-reset-account'
import TransactionConfirmed from './transaction-confirmed'
import CancelTransaction from './cancel-transaction'

import MetaMetricsOptInModal from './metametrics-opt-in-modal'
import RejectTransactions from './reject-transactions'
import ClearApprovedOrigins from './clear-approved-origins'
import ConfirmCustomizeGasModal from '../gas-customization/gas-modal-page-container'
import ConfirmDeleteNetwork from './confirm-delete-network'
import AddToAddressBookModal from './add-to-addressbook-modal'

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

  ADD_TO_ADDRESSBOOK: {
    contents: [
      h(AddToAddressBookModal, {}, []),
    ],
    mobileModalStyle: {
      width: '95%',
      top: '10%',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
      borderRadius: '10px',
    },
    laptopModalStyle: {
      width: '375px',
      top: '10%',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
      borderRadius: '10px',
    },
    contentStyle: {
      borderRadius: '10px',
    },
  },

  ACCOUNT_DETAILS: {
    contents: [
      h(AccountDetailsModal, {}, []),
    ],
    ...accountModalStyle,
  },

  EXPORT_PRIVATE_KEY: {
    contents: [
      h(ExportPrivateKeyModal, {}, []),
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

  METAMETRICS_OPT_IN_MODAL: {
    contents: h(MetaMetricsOptInModal),
    mobileModalStyle: {
      ...modalContainerMobileStyle,
      width: '100%',
      height: '100%',
      top: '0px',
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
      top: '10%',
    },
    contentStyle: {
      borderRadius: '8px',
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

  CONFIRM_DELETE_NETWORK: {
    contents: h(ConfirmDeleteNetwork),
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
    modalState: state.appState.modal.modalState,
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
