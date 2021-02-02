import ViewContact from './view-contact.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBookEntry } from '../../../../selectors/selectors'
import { checksumAddress } from '../../../../helpers/utils/util'
import {
  CONTACT_EDIT_ROUTE,
  CONTACT_MY_ACCOUNTS_EDIT_ROUTE,
  CONTACT_MY_ACCOUNTS_VIEW_ROUTE,
} from '../../../../helpers/constants/routes'
import { hexToBase32 } from '../../../../../../app/scripts/cip37.js'

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps
  const { pathname } = location
  const pathNameTail = pathname.match(/[^/]+$/)[0]
  const pathNameTailIsAddress = pathNameTail.includes('0x')
  const address = pathNameTailIsAddress
    ? pathNameTail.toLowerCase()
    : ownProps.match.params.id

  const { network } = state.metamask
  const { memo, name, base32Address } =
    getAddressBookEntry(state, address) || state.metamask.identities[address]

  const showingMyAccounts = Boolean(
    pathname.match(CONTACT_MY_ACCOUNTS_VIEW_ROUTE)
  )

  return {
    name,
    address,
    base32Address: base32Address || hexToBase32(address, parseInt(network, 10)),
    checkSummedAddress: checksumAddress(address),
    memo,
    editRoute: showingMyAccounts
      ? CONTACT_MY_ACCOUNTS_EDIT_ROUTE
      : CONTACT_EDIT_ROUTE,
  }
}

export default compose(withRouter, connect(mapStateToProps))(ViewContact)
