import { connect } from 'react-redux'
import { compose } from 'recompose'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import DisconnectAll from './disconnect-all.component'
import { clearPermissions } from '../../../../store/actions'

const mapStateToProps = state => {
  return {
    ...state.appState.modal.modalState.props || {},
  }
}

const mapDispatchToProps = dispatch => {
  return {
    disconnectAll: () => {
      dispatch(clearPermissions())
    },
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps)
)(DisconnectAll)
