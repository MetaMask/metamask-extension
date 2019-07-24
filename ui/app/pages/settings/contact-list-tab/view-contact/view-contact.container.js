import ViewContact from './view-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBookEntryName } from '../../../../selectors/selectors'
import { removeFromAddressBook } from '../../../../store/actions'

const mapStateToProps = (state, ownProps) => {
  const address = ownProps.match.params.id
  console.log('!! ownProps', ownProps)
  console.log('!! address', address)
  const name = getAddressBookEntryName(state, address)

  return {
    name,
    address,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    removeFromAddressBook: (addressToRemove) => dispatch(removeFromAddressBook(addressToRemove)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ViewContact)
