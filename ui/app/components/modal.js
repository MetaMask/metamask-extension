const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
// const elementType = require('react-prop-types/lib/elementType')
// const PropTypes from 'prop-types'
const FadeModal = require('boron').FadeModal
const actions = require('../actions')

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

Modal.prototype.render = function () {

  return h(FadeModal,
    {
      className: 'modal',
      keyboard: false,
      onHide: () => {this.onHide()},
      ref: (ref) => {
        this.modalRef = ref
      },
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

// Modal.defaultProps = {}

// Modal.propTypes = {
//   active: PropTypes.bool,
//   hideModal: PropTypes.func.isRequired,
//   component: elementType,
//   onHideCallback: PropTypes.func,
// }
