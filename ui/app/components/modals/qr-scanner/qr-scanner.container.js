import { connect } from 'react-redux'
import QrScanner from './qr-scanner.component'

const { hideModal, showModal, qrCodeDetected, showQrScanner } = require('../../../actions')
import {
  SEND_ROUTE,
} from '../../../routes'

const mapStateToProps = state => {
  const props = state.appState.modal.modalState.props
  return {
    error: props.error,
    errorType: props.errorType,
    showNext: props.showNext,
    nextProps: props.nextProps,
    route: props.route,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showModal: (props) => dispatch(showModal(props)),
    hideModal: () => dispatch(hideModal()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
    scanQrCode: (route, props) => dispatch(showQrScanner(route || SEND_ROUTE, props)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(QrScanner)
