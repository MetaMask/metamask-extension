import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  getAddressBookEntryOrAccountName,
  getSettingsPageSnapsIds,
  getSnapsMetadata,
  getUseExternalServices,
} from '../../selectors';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import {
  isValidHexAddress,
  isBurnAddress,
} from '../../../shared/modules/hexstring-utils';

import {
  ABOUT_US_ROUTE,
  ADVANCED_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
  DEVELOPER_OPTIONS_ROUTE,
  GENERAL_ROUTE,
  NETWORKS_FORM_ROUTE,
  NETWORKS_ROUTE,
  SECURITY_ROUTE,
  SETTINGS_ROUTE,
  EXPERIMENTAL_ROUTE,
  ADD_NETWORK_ROUTE,
  ADD_POPULAR_CUSTOM_NETWORK,
  SNAP_SETTINGS_ROUTE,
  REVEAL_SRP_LIST_ROUTE,
  BACKUPANDSYNC_ROUTE,
  SECURITY_PASSWORD_CHANGE_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../helpers/constants/routes';
import { getProviderConfig } from '../../../shared/modules/selectors/networks';
import { toggleNetworkMenu } from '../../store/actions';
import { getSnapName } from '../../helpers/utils/util';
import { decodeSnapIdFromPathname } from '../../helpers/utils/snaps';
import { getIsSeedlessPasswordOutdated } from '../../ducks/metamask/metamask';
import Settings from './settings.component';

const ROUTES_TO_I18N_KEYS = {
  [ABOUT_US_ROUTE]: 'about',
  [ADD_NETWORK_ROUTE]: 'networks',
  [ADD_POPULAR_CUSTOM_NETWORK]: 'addNetwork',
  [ADVANCED_ROUTE]: 'advanced',
  [BACKUPANDSYNC_ROUTE]: 'backupAndSync',
  [CONTACT_ADD_ROUTE]: 'newContact',
  [CONTACT_EDIT_ROUTE]: 'editContact',
  [CONTACT_LIST_ROUTE]: 'contacts',
  [CONTACT_VIEW_ROUTE]: 'viewContact',
  [DEVELOPER_OPTIONS_ROUTE]: 'developerOptions',
  [EXPERIMENTAL_ROUTE]: 'experimental',
  [GENERAL_ROUTE]: 'general',
  [NETWORKS_FORM_ROUTE]: 'networks',
  [NETWORKS_ROUTE]: 'networks',
  [REVEAL_SRP_LIST_ROUTE]: 'revealSecretRecoveryPhrase',
  [SECURITY_PASSWORD_CHANGE_ROUTE]: 'securityChangePassword',
  [SECURITY_ROUTE]: 'securityAndPrivacy',
  [TRANSACTION_SHIELD_ROUTE]: 'transactionShield',
};

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const { pathname } = location;
  const { ticker } = getProviderConfig(state);
  const {
    metamask: { currencyRates, socialLoginEmail },
  } = state;
  const settingsPageSnapsIds = getSettingsPageSnapsIds(state);
  const snapsMetadata = getSnapsMetadata(state);
  const conversionDate = currencyRates[ticker]?.conversionDate;

  const pathNameTail = pathname.match(/[^/]+$/u)[0];
  const isAddressEntryPage = pathNameTail.includes('0x');
  const isAddContactPage = Boolean(pathname.match(CONTACT_ADD_ROUTE));
  const isEditContactPage = Boolean(pathname.match(CONTACT_EDIT_ROUTE));
  const isRevealSrpListPage = Boolean(pathname.match(REVEAL_SRP_LIST_ROUTE));
  const isPasswordChangePage = Boolean(
    pathname.match(SECURITY_PASSWORD_CHANGE_ROUTE),
  );
  const isTransactionShieldPage = Boolean(
    pathname.match(TRANSACTION_SHIELD_ROUTE),
  );
  const isNetworksFormPage =
    Boolean(pathname.match(NETWORKS_FORM_ROUTE)) ||
    Boolean(pathname.match(ADD_NETWORK_ROUTE));
  const addNewNetwork = Boolean(pathname.match(ADD_NETWORK_ROUTE));
  const isAddPopularCustomNetwork = Boolean(
    pathname.match(ADD_POPULAR_CUSTOM_NETWORK),
  );
  const isSnapSettingsRoute = Boolean(pathname.match(SNAP_SETTINGS_ROUTE));

  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
  const socialLoginEnabled = Boolean(socialLoginEmail);

  let pathnameI18nKey = ROUTES_TO_I18N_KEYS[pathname];

  // if pathname is `REVEAL_SRP_LIST_ROUTE` and socialLoginEnabled rename the tab title to "Manage recovery methods"
  if (isRevealSrpListPage && socialLoginEnabled) {
    pathnameI18nKey = 'securitySrpWalletRecovery';
  }

  let backRoute = SETTINGS_ROUTE;
  if (isEditContactPage) {
    backRoute = `${CONTACT_VIEW_ROUTE}/${pathNameTail}`;
  } else if (isAddressEntryPage || isAddContactPage) {
    backRoute = CONTACT_LIST_ROUTE;
  } else if (isNetworksFormPage) {
    backRoute = NETWORKS_ROUTE;
  } else if (isAddPopularCustomNetwork) {
    backRoute = NETWORKS_ROUTE;
  } else if (isRevealSrpListPage || isPasswordChangePage) {
    backRoute = SECURITY_ROUTE;
  }

  let initialBreadCrumbRoute;
  let initialBreadCrumbKey;

  const addressName = getAddressBookEntryOrAccountName(
    state,
    !isBurnAddress(pathNameTail) &&
      isValidHexAddress(pathNameTail, { mixedCaseUseChecksum: true })
      ? pathNameTail
      : '',
  );
  const useExternalServices = getUseExternalServices(state);

  const snapNameGetter = getSnapName(snapsMetadata);

  const settingsPageSnaps = settingsPageSnapsIds.map((snapId) => ({
    id: snapId,
    name: snapNameGetter(snapId),
  }));

  const snapSettingsTitle =
    isSnapSettingsRoute && snapNameGetter(decodeSnapIdFromPathname(pathname));

  return {
    addNewNetwork,
    addressName,
    backRoute,
    conversionDate,
    currentPath: pathname,
    initialBreadCrumbKey,
    initialBreadCrumbRoute,
    isAddressEntryPage,
    isPasswordChangePage,
    isPopup,
    isRevealSrpListPage,
    isSeedlessPasswordOutdated: getIsSeedlessPasswordOutdated(state),
    isTransactionShieldPage,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    pathnameI18nKey,
    settingsPageSnaps,
    snapSettingsTitle,
    useExternalServices,
  };
};

function mapDispatchToProps(dispatch) {
  return {
    toggleNetworkMenu: (payload) => dispatch(toggleNetworkMenu(payload)),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Settings);
