const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const FadeModal = require('boron').FadeModal
const actions = require('../actions')
const isMobileView = require('../../lib/is-mobile-view')
const isPopupOrNotification = require('../../../app/scripts/lib/is-popup-or-notification')

function mapStateToProps (state) {
  return {
    active: state.appState.modalOpen
  }
}

function mapDispatchToProps (dispatch) {
  return {
    hideModal: () => {
      dispatch(actions.hideModal())
    },
  }
}

inherits(Modal, Component)
function Modal () {
  Component.call(this)
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(Modal)

const mobileModalStyles = {
  width: '95%',
  // Used to create matching t/l/r/b space in mobile view.
  top: isPopupOrNotification() === 'popup' ? '47vh' : '36.5vh',
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
    this.props.children,
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
