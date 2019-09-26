import ContactListTab from './contact-list-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBook } from '../../../selectors/selectors'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../../app/scripts/lib/util'

import {
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_ROUTE,
  CONTACT_MY_ACCOUNTS_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_EDIT_ROUTE,
} from '../../../helpers/constants/routes'


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps
  const { pathname } = location

  const pathNameTail = pathname.match(/[^/]+$/)[0]
  const pathNameTailIsAddress = pathNameTail.includes('0x')

  const viewingContact = Boolean(pathname.match(CONTACT_VIEW_ROUTE) || pathname.match(CONTACT_MY_ACCOUNTS_VIEW_ROUTE))
  const editingContact = Boolean(pathname.match(CONTACT_EDIT_ROUTE) || pathname.match(CONTACT_MY_ACCOUNTS_EDIT_ROUTE))
  const addingContact = Boolean(pathname.match(CONTACT_ADD_ROUTE))
  const showingMyAccounts = Boolean(
    pathname.match(CONTACT_MY_ACCOUNTS_ROUTE) ||
    pathname.match(CONTACT_MY_ACCOUNTS_VIEW_ROUTE) ||
    pathname.match(CONTACT_MY_ACCOUNTS_EDIT_ROUTE)
  )
  const envIsPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP

  const hideAddressBook = envIsPopup && (viewingContact || editingContact || addingContact)

  return {
    viewingContact,
    editingContact,
    addingContact,
    showingMyAccounts,
    addressBook: getAddressBook(state),
    selectedAddress: pathNameTailIsAddress ? pathNameTail : '',
    hideAddressBook,
    envIsPopup,
    showContactContent: !envIsPopup || hideAddressBook,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(ContactListTab)
