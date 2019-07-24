import AddContact from './add-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { addToAddressBook } from '../../../../store/actions'

const mapDispatchToProps = dispatch => {
  return {
    addToAddressBook: (recipient, nickname) => dispatch(addToAddressBook(recipient, nickname)),
  }
}

export default compose(
  withRouter,
  connect(null, mapDispatchToProps)
)(AddContact)
