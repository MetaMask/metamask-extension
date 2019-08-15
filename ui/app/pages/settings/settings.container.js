import Settings from './settings.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBookEntryName } from '../../selectors/selectors'
import { isValidAddress } from '../../helpers/utils/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'

import {
  CONNECTIONS_ROUTE,
  ADVANCED_ROUTE,
  SECURITY_ROUTE,
  GENERAL_ROUTE,
  ABOUT_US_ROUTE,
  SETTINGS_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
  CONTACT_MY_ACCOUNTS_ROUTE,
  CONTACT_MY_ACCOUNTS_EDIT_ROUTE,
  CONTACT_MY_ACCOUNTS_VIEW_ROUTE,
} from '../../helpers/constants/routes'

const ROUTES_TO_I18N_KEYS = {
  [GENERAL_ROUTE]: 'general',
  [CONNECTIONS_ROUTE]: 'connections',
  [ADVANCED_ROUTE]: 'advanced',
  [SECURITY_ROUTE]: 'securityAndPrivacy',
  [ABOUT_US_ROUTE]: 'about',
  [CONTACT_LIST_ROUTE]: 'contacts',
  [CONTACT_ADD_ROUTE]: 'newContact',
  [CONTACT_EDIT_ROUTE]: 'editContact',
  [CONTACT_VIEW_ROUTE]: 'viewContact',
  [CONTACT_MY_ACCOUNTS_ROUTE]: 'myAccounts',
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps
  const { pathname } = location
  const pathNameTail = pathname.match(/[^/]+$/)[0]

  const isAddressEntryPage = pathNameTail.includes('0x')
  const isMyAccountsPage = pathname.match('my-accounts')
  const isAddContactPage = Boolean(pathname.match(CONTACT_ADD_ROUTE))
  const isEditContactPage = Boolean(pathname.match(CONTACT_EDIT_ROUTE))
  const isEditMyAccountsContactPage = Boolean(pathname.match(CONTACT_MY_ACCOUNTS_EDIT_ROUTE))

  const isPopupView = getEnvironmentType(location.href) === ENVIRONMENT_TYPE_POPUP
  const pathnameI18nKey = ROUTES_TO_I18N_KEYS[pathname]

  let backRoute
  if (isMyAccountsPage && isAddressEntryPage) {
    backRoute = CONTACT_MY_ACCOUNTS_ROUTE
  } else if (isEditContactPage) {
    backRoute = `${CONTACT_VIEW_ROUTE}/${pathNameTail}`
  } else if (isEditMyAccountsContactPage) {
    backRoute = `${CONTACT_MY_ACCOUNTS_VIEW_ROUTE}/${pathNameTail}`
  } else if (isAddressEntryPage || isMyAccountsPage || isAddContactPage) {
    backRoute = CONTACT_LIST_ROUTE
  } else {
    backRoute = SETTINGS_ROUTE
  }

  let initialBreadCrumbRoute
  let breadCrumbTextKey
  let initialBreadCrumbKey
  if (isMyAccountsPage) {
    initialBreadCrumbRoute = CONTACT_LIST_ROUTE
    breadCrumbTextKey = 'myWalletAccounts'
    initialBreadCrumbKey = ROUTES_TO_I18N_KEYS[initialBreadCrumbRoute]
  }

  const addressName = getAddressBookEntryName(state, isValidAddress(pathNameTail) ? pathNameTail : '')

  return {
    isAddressEntryPage,
    isMyAccountsPage,
    backRoute,
    currentPath: pathname,
    isPopupView,
    pathnameI18nKey,
    addressName,
    initialBreadCrumbRoute,
    breadCrumbTextKey,
    initialBreadCrumbKey,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(Settings)
