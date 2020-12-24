import { connect } from 'react-redux'
import { hideModal, qrCodeDetected } from '../../../../store/actions'
import ExternalWalletImporter from './external-wallet-importer.component'

const mapDispatchToProps = (dispatch) => {
  return {
    hideModal: () => dispatch(hideModal()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
  }
}

export default connect(null, mapDispatchToProps)(ExternalWalletImporter)
