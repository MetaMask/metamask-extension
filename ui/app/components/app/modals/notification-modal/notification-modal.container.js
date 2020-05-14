import { connect } from 'react-redux'
import NotifactionModal from './notification-modal.component'

function mapStateToProps (state) {
  return {
    ...(state.appState.modal.modalState.props || {}),
  }
}

export default connect(mapStateToProps)(NotifactionModal)
