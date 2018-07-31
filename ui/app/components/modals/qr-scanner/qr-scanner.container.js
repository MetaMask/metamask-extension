import { connect } from 'react-redux'
import QrScanner from './qr-scanner.component'

const { hideModal, qrCodeDetected } = require('../../../actions')

const mapStateToProps = state => {
  return {
    error: state.appState.modal.modalState.props.error,
    errorType: state.appState.modal.modalState.props.errorType,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => dispatch(hideModal()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(QrScanner)
