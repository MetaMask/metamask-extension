import { compose } from 'redux'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBookEntry } from '../../../../selectors'
import { checksumAddress } from '../../../../helpers/utils/util'
import {
  CONTACT_EDIT_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_MY_ACCOUNTS_EDIT_ROUTE,
  CONTACT_MY_ACCOUNTS_ROUTE,
  CONTACT_MY_ACCOUNTS_VIEW_ROUTE,
} from '../../../../helpers/constants/routes'
import ViewContact from './view-contact.component'

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

  const showingMyAccounts = Boolean(
    pathname.match(CONTACT_MY_ACCOUNTS_VIEW_ROUTE),
  )

  return {
    name,
    address: contact ? address : null,
    checkSummedAddress: checksumAddress(address),
    memo,
    editRoute: showingMyAccounts
      ? CONTACT_MY_ACCOUNTS_EDIT_ROUTE
      : CONTACT_EDIT_ROUTE,
    listRoute: showingMyAccounts
      ? CONTACT_MY_ACCOUNTS_ROUTE
      : CONTACT_LIST_ROUTE,
  }
}

export default compose(withRouter, connect(mapStateToProps))(ViewContact)
