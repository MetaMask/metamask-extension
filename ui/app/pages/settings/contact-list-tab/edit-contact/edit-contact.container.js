import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBookEntry } from '../../../../selectors'
import {
  CONTACT_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_ROUTE,
  CONTACT_MY_ACCOUNTS_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_EDIT_ROUTE,
  CONTACT_LIST_ROUTE,
} from '../../../../helpers/constants/routes'
import {
  addToAddressBook,
  removeFromAddressBook,
  setAccountLabel,
} from '../../../../store/actions'
import EditContact from './edit-contact.component'

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps
  const { pathname } = location
  const pathNameTail = pathname.match(/[^/]+$/u)[0]
  const pathNameTailIsAddress = pathNameTail.includes('0x')
  const address = pathNameTailIsAddress
    ? pathNameTail.toLowerCase()
    : ownProps.match.params.id

  const contact =
    getAddressBookEntry(state, address) || state.metamask.identities[address]
  const { memo, name } = contact || {}

  const { chainId } = state.metamask.provider

  const showingMyAccounts = Boolean(
    pathname.match(CONTACT_MY_ACCOUNTS_EDIT_ROUTE),
  )

  return {
    address: contact ? address : null,
    chainId,
    name,
    memo,
    viewRoute: showingMyAccounts
      ? CONTACT_MY_ACCOUNTS_VIEW_ROUTE
      : CONTACT_VIEW_ROUTE,
    listRoute: showingMyAccounts
      ? CONTACT_MY_ACCOUNTS_ROUTE
      : CONTACT_LIST_ROUTE,
    showingMyAccounts,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    addToAddressBook: (recipient, nickname, memo) =>
      dispatch(addToAddressBook(recipient, nickname, memo)),
    removeFromAddressBook: (chainId, addressToRemove) =>
      dispatch(removeFromAddressBook(chainId, addressToRemove)),
    setAccountLabel: (address, label) =>
      dispatch(setAccountLabel(address, label)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(EditContact)
