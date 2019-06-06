import ViewContact from './view-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBook } from '../../../../selectors/selectors'
import { addToAddressBook, removeFromAddressBook } from '../../../../store/actions'

const mapStateToProps = state => {
  return {
    addressBook: getAddressBook(state),
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
)(ViewContact)
