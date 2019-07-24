import EditContact from './edit-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBookEntryName } from '../../../../selectors/selectors'
import { addToAddressBook, removeFromAddressBook } from '../../../../store/actions'

const mapStateToProps = (state, ownProps) => {
  const address = ownProps.match.params.id
  const name = getAddressBookEntryName(state, address)

  return {
    address,
    name,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addToAddressBook: (recipient, nickname) => dispatch(addToAddressBook(recipient, nickname)),
    removeFromAddressBook: (addressToRemove) => dispatch(removeFromAddressBook(addressToRemove)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(EditContact)
