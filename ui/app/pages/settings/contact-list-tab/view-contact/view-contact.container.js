import ViewContact from './view-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBookEntry } from '../../../../selectors/selectors'
import { removeFromAddressBook } from '../../../../store/actions'
import { checksumAddress } from '../../../../helpers/utils/util'
import {
  CONTACT_EDIT_ROUTE,
  CONTACT_MY_ACCOUNTS_EDIT_ROUTE,
  CONTACT_MY_ACCOUNTS_VIEW_ROUTE,
} from '../../../../helpers/constants/routes'

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps
  const { pathname } = location
  const pathNameTail = pathname.match(/[^/]+$/)[0]
  const pathNameTailIsAddress = pathNameTail.includes('0x')
  const address = pathNameTailIsAddress ? pathNameTail.toLowerCase() : ownProps.match.params.id

  const { memo, name } = getAddressBookEntry(state, address) || state.metamask.identities[address]

  const showingMyAccounts = Boolean(pathname.match(CONTACT_MY_ACCOUNTS_VIEW_ROUTE))

  return {
    name,
    address,
    checkSummedAddress: checksumAddress(address),
    memo,
    editRoute: showingMyAccounts ? CONTACT_MY_ACCOUNTS_EDIT_ROUTE : CONTACT_EDIT_ROUTE,
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
