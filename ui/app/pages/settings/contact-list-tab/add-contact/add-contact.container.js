import AddContact from './add-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { addToAddressBook, showQrScanner } from '../../../../store/actions'
import {
  CONTACT_ADD_ROUTE,
} from '../../../../helpers/constants/routes'

const mapDispatchToProps = dispatch => {
  return {
    addToAddressBook: (recipient, nickname) => dispatch(addToAddressBook(recipient, nickname)),
    scanQrCode: () => dispatch(showQrScanner(CONTACT_ADD_ROUTE)),
  }
}

export default compose(
  withRouter,
  connect(null, mapDispatchToProps)
)(AddContact)
