import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { getAddressBookEntryName } from '../../selectors';
import { isValidAddress } from '../../helpers/utils/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { getMostRecentOverviewPage } from '../../ducks/history/history';

import {
  ABOUT_US_ROUTE,
  ADVANCED_ROUTE,
  ALERTS_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_MY_ACCOUNTS_ROUTE,
  CONTACT_MY_ACCOUNTS_EDIT_ROUTE,
  CONTACT_MY_ACCOUNTS_VIEW_ROUTE,
  CONTACT_VIEW_ROUTE,
  GENERAL_ROUTE,
  NETWORKS_FORM_ROUTE,
  NETWORKS_ROUTE,
  SECURITY_ROUTE,
  SETTINGS_ROUTE,
} from '../../helpers/constants/routes';
import Settings from './settings.component';

const ROUTES_TO_I18N_KEYS = {
  [ABOUT_US_ROUTE]: 'about',
  [ADVANCED_ROUTE]: 'advanced',
  [ALERTS_ROUTE]: 'alerts',
  [GENERAL_ROUTE]: 'general',
  [CONTACT_ADD_ROUTE]: 'newContact',
  [CONTACT_EDIT_ROUTE]: 'editContact',
  [CONTACT_LIST_ROUTE]: 'contacts',
  [CONTACT_MY_ACCOUNTS_ROUTE]: 'myAccounts',
  [CONTACT_VIEW_ROUTE]: 'viewContact',
  [NETWORKS_ROUTE]: 'networks',
  [NETWORKS_FORM_ROUTE]: 'networks',
  [SECURITY_ROUTE]: 'securityAndPrivacy',
};

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const { pathname } = location;
  const pathNameTail = pathname.match(/[^/]+$/u)[0];

  const isAddressEntryPage = pathNameTail.includes('0x');
  const isMyAccountsPage = pathname.match('my-accounts');
  const isAddContactPage = Boolean(pathname.match(CONTACT_ADD_ROUTE));
  const isEditContactPage = Boolean(pathname.match(CONTACT_EDIT_ROUTE));
  const isEditMyAccountsContactPage = Boolean(
    pathname.match(CONTACT_MY_ACCOUNTS_EDIT_ROUTE),
  );
  const isNetworksFormPage = Boolean(pathname.match(NETWORKS_FORM_ROUTE));

  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const pathnameI18nKey = ROUTES_TO_I18N_KEYS[pathname];

  let backRoute = SETTINGS_ROUTE;
  if (isMyAccountsPage && isAddressEntryPage) {
    backRoute = CONTACT_MY_ACCOUNTS_ROUTE;
  } else if (isEditContactPage) {
    backRoute = `${CONTACT_VIEW_ROUTE}/${pathNameTail}`;
  } else if (isEditMyAccountsContactPage) {
    backRoute = `${CONTACT_MY_ACCOUNTS_VIEW_ROUTE}/${pathNameTail}`;
  } else if (isAddressEntryPage || isMyAccountsPage || isAddContactPage) {
    backRoute = CONTACT_LIST_ROUTE;
  } else if (isNetworksFormPage) {
    backRoute = NETWORKS_ROUTE;
  }

  let initialBreadCrumbRoute;
  let breadCrumbTextKey;
  let initialBreadCrumbKey;
  if (isMyAccountsPage) {
    initialBreadCrumbRoute = CONTACT_LIST_ROUTE;
    breadCrumbTextKey = 'myWalletAccounts';
    initialBreadCrumbKey = ROUTES_TO_I18N_KEYS[initialBreadCrumbRoute];
  }

  const addressName = getAddressBookEntryName(
    state,
    isValidAddress(pathNameTail) ? pathNameTail : '',
  );

  return {
    isAddressEntryPage,
    isMyAccountsPage,
    backRoute,
    currentPath: pathname,
    isPopup,
    pathnameI18nKey,
    addressName,
    initialBreadCrumbRoute,
    breadCrumbTextKey,
    initialBreadCrumbKey,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
  };
};

export default compose(withRouter, connect(mapStateToProps))(Settings);
