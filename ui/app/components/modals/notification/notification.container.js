import { connect } from 'react-redux'
import Notification from './notification.component'

const { hideModal } = require('../../../actions')

const mapStateToProps = state => {
  const { appState: { modal: { modalState: { props } } } } = state
  const { onHide } = props
  return {
    onHide,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => dispatch(hideModal()),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { onHide, ...otherStateProps } = stateProps
  const { hideModal, ...otherDispatchProps } = dispatchProps

  return {
    ...otherStateProps,
    ...otherDispatchProps,
    ...ownProps,
    onHide: () => {
      hideModal()

      if (onHide && typeof onHide === 'function') {
        onHide()
      }
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Notification)
