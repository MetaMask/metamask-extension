import { connect } from 'react-redux'
import QrScanner from './qr-scanner.component'

import { hideModal, qrCodeDetected } from '../../../../store/actions'

const mapDispatchToProps = (dispatch) => {
  return {
    hideModal: () => dispatch(hideModal()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
  }
}

export default connect(null, mapDispatchToProps)(QrScanner)
