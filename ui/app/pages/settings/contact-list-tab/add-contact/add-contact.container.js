import AddContact from './add-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { addToAddressBook, showQrScanner, qrCodeDetected } from '../../../../store/actions'
import {
  CONTACT_ADD_ROUTE,
} from '../../../../helpers/constants/routes'
import {
  getQrCodeData,
} from '../../../../pages/send/send.selectors'

const mapStateToProps = state => {
  return {
    qrCodeData: getQrCodeData(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addToAddressBook: (recipient, nickname) => dispatch(addToAddressBook(recipient, nickname)),
    scanQrCode: () => dispatch(showQrScanner(CONTACT_ADD_ROUTE)),
    qrCodeDetected: (data) => dispatch(qrCodeDetected(data)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(AddContact)
