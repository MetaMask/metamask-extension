const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const FadeModal = require('boron').FadeModal
const actions = require('../../actions')
const isMobileView = require('../../../lib/is-mobile-view')
const isPopupOrNotification = require('../../../../app/scripts/lib/is-popup-or-notification')

// Modal Components
const BuyOptions = require('./buy-options-modal')
const AccountDetailsModal = require('./account-details-modal')
const EditAccountNameModal = require('./edit-account-name-modal')
const NewAccountModal = require('./new-account-modal')

const MODALS = {
  BUY: {
    contents: [
      h(BuyOptions, {}, []),
    ],
    mobileModalStyle: {
      width: '95%',
      top: isPopupOrNotification() === 'popup' ? '48vh' : '36.5vh',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    },
    laptopModalStyle: {
      width: '66%',
      top: 'calc(30% + 10px)',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    },
  },

  EDIT_ACCOUNT_NAME: {
    contents: [
      h(EditAccountNameModal, {}, []),
    ],
    mobileModalStyle: {
      width: '95%',
      top: isPopupOrNotification() === 'popup' ? '48vh' : '36.5vh',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    },
    laptopModalStyle: {
      width: '375px',
      top: 'calc(30% + 10px)',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    },
  },

  ACCOUNT_DETAILS: {
    contents: [
      h(AccountDetailsModal, {}, []),
    ],
    mobileModalStyle: {
      width: '95%',
      top: isPopupOrNotification() === 'popup' ? '52vh' : '36.5vh',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    },
    laptopModalStyle: {
      width: '360px',
      top: 'calc(33% + 45px)',
      boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    },
  },

  NEW_ACCOUNT: {
    contents: [
      h(NewAccountModal, {}, []),
    ],
    mobileModalStyle: {},
    laptopModalStyle: {}
  },

  DEFAULT: {
    contents: [],
    mobileModalStyle: {},
    laptopModalStyle: {},
  }
}

const BACKDROPSTYLE = {
  backgroundColor: 'rgba(245, 245, 245, 0.85)',
}

function mapStateToProps (state) {
  return {
    active: state.appState.modal.open,
    modalState: state.appState.modal.modalState,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
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

  const children = modal.contents
  const modalStyle = modal[isMobileView() ? 'mobileModalStyle' : 'laptopModalStyle']

  return h(FadeModal,
    {
      className: 'modal',
      keyboard: false,
      onHide: () => {this.onHide()},
      ref: (ref) => {
        this.modalRef = ref
      },
      modalStyle,
      backdropStyle: BACKDROPSTYLE,
    },
    children,
  )
}

Modal.prototype.componentWillReceiveProps = function(nextProps) {
  if (nextProps.active) {
    this.show()
  } else if (this.props.active) {
    this.hide()
  }
}

Modal.prototype.onHide = function() {
  if (this.props.onHideCallback) {
    this.props.onHideCallback()
  }
  this.props.hideModal()
}

Modal.prototype.hide = function() {
  this.modalRef.hide()
}

Modal.prototype.show = function() {
  this.modalRef.show()
}
