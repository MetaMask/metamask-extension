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
  BUY: [
    h(BuyOptions, {}, []),
  ],
  EDIT_ACCOUNT_NAME: [
    h(EditAccountNameModal, {}, []),
  ],
  ACCOUNT_DETAILS: [
    h(AccountDetailsModal, {}, []),
  ],
  NEW_ACCOUNT: [
    h(NewAccountModal, {}, []),
  ]
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

const mobileModalStyles = {
  width: '95%',
  // Used to create matching t/l/r/b space in mobile view.
  top: isPopupOrNotification() === 'popup' ? '48vh' : '36.5vh',
  boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
}

const laptopModalStyles = {
  width: '66%',
  top: 'calc(30% + 10px)',
  boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
}

const backdropStyles = {
  backgroundColor: 'rgba(245, 245, 245, 0.85)',
}

Modal.prototype.render = function () {

  const children = MODALS[this.props.modalState.name] || []

  return h(FadeModal,
    {
      className: 'modal',
      keyboard: false,
      onHide: () => {this.onHide()},
      ref: (ref) => {
        this.modalRef = ref
      },
      modalStyle: isMobileView() ? mobileModalStyles : laptopModalStyles,
      backdropStyle: backdropStyles,
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

// TODO: specify default props and proptypes
// Modal.defaultProps = {}

// const elementType = require('react-prop-types/lib/elementType')
// const PropTypes from 'prop-types'

// Modal.propTypes = {
//   active: PropTypes.bool,
//   hideModal: PropTypes.func.isRequired,
//   component: elementType,
//   onHideCallback: PropTypes.func,
// }
