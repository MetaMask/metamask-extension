import EditContact from './edit-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBookEntry } from '../../../../selectors/selectors'
import { addToAddressBook, removeFromAddressBook } from '../../../../store/actions'

const mapStateToProps = (state, ownProps) => {
  const address = ownProps.match.params.id
  const { name, memo } = getAddressBookEntry(state, address)

  return {
    address,
    name,
    memo,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addToAddressBook: (recipient, nickname, memo) => dispatch(addToAddressBook(recipient, nickname, memo)),
    removeFromAddressBook: (addressToRemove) => dispatch(removeFromAddressBook(addressToRemove)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(EditContact)
