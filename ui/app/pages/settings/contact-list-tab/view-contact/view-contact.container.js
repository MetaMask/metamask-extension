import ViewContact from './view-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBookEntryName } from '../../../../selectors/selectors'
import { removeFromAddressBook } from '../../../../store/actions'
import { addressSlicer } from '../../../../helpers/utils/util'


const mapStateToProps = (state, ownProps) => {
  const address = ownProps.match.params.id
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
