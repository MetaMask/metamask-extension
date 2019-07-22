import ViewContact from './view-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBook } from '../../../../selectors/selectors'
import { removeFromAddressBook } from '../../../../store/actions'
import { addressSlicer } from '../../../../helpers/utils/util'


const mapStateToProps = (state, ownProps) => {
  const address = ownProps.match.params.id
  const addressBook = getAddressBook(state)
  const currentEntry = addressBook[address]
  const name = currentEntry.name !== '' ? currentEntry.name : addressSlicer(address)
  return {
    addressBook: getAddressBook(state),
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
