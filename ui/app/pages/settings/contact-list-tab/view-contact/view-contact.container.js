import ViewContact from './view-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBookEntry } from '../../../../selectors/selectors'
import { removeFromAddressBook } from '../../../../store/actions'
import { checksumAddress } from '../../../../helpers/utils/util'

const mapStateToProps = (state, ownProps) => {
  const address = ownProps.match.params.id
  const { memo, name } = getAddressBookEntry(state, address)

  return {
    name,
    address,
    checkSummedAddress: checksumAddress(address),
    memo,
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
