import { connect } from 'react-redux'
import QrScanner from './qr-scanner.component'

const { hideModal, qrCodeDetected, showQrScanner } = require('../../../../store/actions')
import {
  SEND_ROUTE,
} from '../../../../helpers/constants/routes'

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
    scanQrCode: () => dispatch(showQrScanner(SEND_ROUTE)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(QrScanner)
