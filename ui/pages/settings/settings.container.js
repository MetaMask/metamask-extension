import { compose } from 'redux';
import { connect } from 'react-redux';
import withRouterHooks from '../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import {
  getAddressBookEntryOrAccountName,
  getSettingsPageSnapsIds,
  getSnapsMetadata,
  getUseExternalServices,
} from '../../selectors';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
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
  TRANSACTION_SHIELD_CLAIM_ROUTES,
} from '../../helpers/constants/routes';
import { getProviderConfig } from '../../../shared/modules/selectors/networks';
import { toggleNetworkMenu } from '../../store/actions';
import { getSnapName } from '../../helpers/utils/util';
import { decodeSnapIdFromPathname } from '../../helpers/utils/snaps';
import { getIsSeedlessPasswordOutdated } from '../../ducks/metamask/metamask';
import { getIsMetaMaskShieldFeatureEnabled } from '../../../shared/modules/environment';
import { getHasSubscribedToShield } from '../../selectors/subscription/subscription';
import { SHIELD_QUERY_PARAMS } from '../../../shared/lib/deep-links/routes/shield';
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
  [TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL]: 'shieldClaim',
  [TRANSACTION_SHIELD_CLAIM_ROUTES.BASE]: 'shieldClaimsListTitle',
  [TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW.FULL]: 'shieldClaimsDetailTitle',
  [TRANSACTION_SHIELD_ROUTE]: 'shieldTx',
};

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const { pathname, search } = location;
  const { ticker } = getProviderConfig(state);
  const {
    metamask: { currencyRates, socialLoginEmail },
  } = state;
  const settingsPageSnapsIds = getSettingsPageSnapsIds(state);
  const snapsMetadata = getSnapsMetadata(state);
  const conversionDate = currencyRates[ticker]?.conversionDate;

  const searchParams = new URLSearchParams(search);
  // param to check and show shield entry modal at start
  const shouldShowShieldEntryModal =
    searchParams.get(SHIELD_QUERY_PARAMS.showShieldEntryModal) === 'true';

  const pathNameTail = pathname.match(/[^/]+$/u)?.[0] || '';
  const isAddressEntryPage = pathNameTail.includes('0x');
  const isAddContactPage = Boolean(pathname.match(CONTACT_ADD_ROUTE));
  const isEditContactPage = Boolean(pathname.match(CONTACT_EDIT_ROUTE));
  const isRevealSrpListPage = Boolean(pathname.match(REVEAL_SRP_LIST_ROUTE));
  const isPasswordChangePage = Boolean(
    pathname.match(SECURITY_PASSWORD_CHANGE_ROUTE),
  );
  const isTransactionShieldPage = Boolean(
    pathname.startsWith(TRANSACTION_SHIELD_ROUTE),
  );
  const isNetworksFormPage =
    Boolean(pathname.match(NETWORKS_FORM_ROUTE)) ||
    Boolean(pathname.match(ADD_NETWORK_ROUTE));
  const addNewNetwork = Boolean(pathname.match(ADD_NETWORK_ROUTE));
  const isAddPopularCustomNetwork = Boolean(
    pathname.match(ADD_POPULAR_CUSTOM_NETWORK),
  );
  const isSnapSettingsRoute = Boolean(pathname.match(SNAP_SETTINGS_ROUTE));
  const isShieldClaimNewPage = Boolean(
    pathname.match(TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL),
  );
  const isShieldClaimViewPage = Boolean(
    pathname.startsWith(TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW.FULL),
  );
  const isShieldClaimBasePage = Boolean(
    pathname.startsWith(TRANSACTION_SHIELD_CLAIM_ROUTES.BASE),
  );

  const environmentType = getEnvironmentType();
  const isPopup =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  const socialLoginEnabled = Boolean(socialLoginEmail);

  let pathnameI18nKey = ROUTES_TO_I18N_KEYS[pathname];

  // if pathname is `REVEAL_SRP_LIST_ROUTE` and socialLoginEnabled rename the tab title to "Manage recovery methods"
  if (isRevealSrpListPage && socialLoginEnabled) {
    pathnameI18nKey = 'securitySrpWalletRecovery';
  }

  // If pathname is `TRANSACTION_SHIELD_CLAIM_VIEW_ROUTE` rename the tab title to "Claim details"
  if (pathname.startsWith(TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW.FULL)) {
    pathnameI18nKey = 'shieldClaimsDetailTitle';
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
  } else if (isShieldClaimNewPage || isShieldClaimViewPage) {
    backRoute = TRANSACTION_SHIELD_CLAIM_ROUTES.BASE;
  } else if (isShieldClaimBasePage) {
    backRoute = TRANSACTION_SHIELD_ROUTE;
  }

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
    hasSubscribedToShield: getHasSubscribedToShield(state),
    isAddressEntryPage,
    isMetaMaskShieldFeatureEnabled: getIsMetaMaskShieldFeatureEnabled(),
    isPasswordChangePage,
    isPopup,
    isRevealSrpListPage,
    isSeedlessPasswordOutdated: getIsSeedlessPasswordOutdated(state),
    isTransactionShieldPage,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    pathnameI18nKey,
    settingsPageSnaps,
    shouldShowShieldEntryModal,
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
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps),
)(Settings);
