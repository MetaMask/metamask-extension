import { connect } from 'react-redux'
import { hideModal, qrCodeDetected } from '../../../../store/actions'
import BidirectionalSignatureImporter from './bidirectional-signature-importer.component'

const mapDispatchToProps = (dispatch) => {
  return {
    hideModal: () => dispatch(hideModal()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
  }
}

export default connect(null, mapDispatchToProps)(BidirectionalSignatureImporter)
