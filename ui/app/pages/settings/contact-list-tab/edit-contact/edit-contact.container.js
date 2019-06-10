import EditContact from './edit-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBook } from '../../../../selectors/selectors'
import { addToAddressBook } from '../../../../store/actions'

const mapStateToProps = state => {
  return {
    addressBook: getAddressBook(state),
  }
}

const mapDispatchToProps = dispatch => {
  return {
    addToAddressBook: (recipient, nickname) => dispatch(addToAddressBook(recipient, nickname)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(EditContact)
