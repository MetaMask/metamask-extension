import Settings from './settings.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getAddressBookEntryName } from '../../selectors/selectors'
import { isValidAddress } from '../../helpers/utils/util'
import { ENVIRONMENT_TYPE_POPUP } from '../../../../app/scripts/lib/enums'
import { getEnvironmentType } from '../../../../app/scripts/lib/util'

import {
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
} from '../../helpers/constants/routes'

const ROUTES_TO_I18N_KEYS = {
  [GENERAL_ROUTE]: 'general',
  [ADVANCED_ROUTE]: 'advanced',
  [SECURITY_ROUTE]: 'securityAndPrivacy',
  [ABOUT_US_ROUTE]: 'about',
  [CONTACT_LIST_ROUTE]: 'contactList',
  [CONTACT_ADD_ROUTE]: 'newContact',
  [CONTACT_EDIT_ROUTE]: 'editContact',
  [CONTACT_VIEW_ROUTE]: 'viewContact',
  [CONTACT_MY_ACCOUNTS_ROUTE]: 'myAccounts',
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps
  const { pathname } = location

  const isAddressEntryPage = pathname.includes('0x')
  const isMyAccountsPage = pathname.includes('my-accounts')

  const isPopupView = getEnvironmentType(location.href) === ENVIRONMENT_TYPE_POPUP
  const pathnameI18nKey = ROUTES_TO_I18N_KEYS[pathname]

  let backRoute
  if (isAddressEntryPage || isMyAccountsPage) {
    backRoute = CONTACT_LIST_ROUTE
  } else {
    backRoute = SETTINGS_ROUTE
  }

  const address = pathname.slice(-42)
  const addressName = getAddressBookEntryName(state, isValidAddress(address) ? address : '')

  return {
    isAddressEntryPage,
    isMyAccountsPage,
    backRoute,
    currentPath: pathname,
    isPopupView,
    pathnameI18nKey,
    addressName,
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps)
)(Settings)
