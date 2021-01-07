import { connect } from 'react-redux'
import { compose } from 'redux'
import { withRouter } from 'react-router-dom'
import { hideModal, qrCodeDetected } from '../../../../store/actions'
import ExternalWalletImporter from './external-wallet-importer.component'

const mapDispatchToProps = (dispatch) => {
  return {
    hideModal: () => dispatch(hideModal()),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
  }
}

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
)(ExternalWalletImporter)
