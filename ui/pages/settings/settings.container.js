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
} from '../../../shared/lib/hexstring-utils';

import {
  ABOUT_US_ROUTE,
  ADVANCED_ROUTE,
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
  TRANSACTION_SHIELD_MANAGE_PLAN_ROUTE,
  TRANSACTION_SHIELD_MANAGE_PAST_PLAN_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
} from '../../helpers/constants/routes';
import { getProviderConfig } from '../../../shared/lib/selectors/networks';
import { toggleNetworkMenu } from '../../store/actions';
import { getSnapName } from '../../helpers/utils/util';
import { getIsSeedlessPasswordOutdated } from '../../ducks/metamask/metamask';
import { getIsMetaMaskShieldFeatureEnabled } from '../../../shared/lib/environment';
import { getHasSubscribedToShield } from '../../selectors/subscription/subscription';
import { SHIELD_QUERY_PARAMS } from '../../../shared/lib/deep-links/routes/shield';
import Settings from './settings.component';
import { CLAIMS_TAB_KEYS } from './transaction-shield-tab/types';

const ROUTES_TO_I18N_KEYS = {
  [ABOUT_US_ROUTE]: 'about',
  [ADD_NETWORK_ROUTE]: 'networks',
  [ADD_POPULAR_CUSTOM_NETWORK]: 'addNetwork',
  [ADVANCED_ROUTE]: 'advanced',
  [BACKUPANDSYNC_ROUTE]: 'backupAndSync',
  [DEVELOPER_OPTIONS_ROUTE]: 'developerOptions',
  [EXPERIMENTAL_ROUTE]: 'experimental',
  [GENERAL_ROUTE]: 'general',
  [NETWORKS_FORM_ROUTE]: 'networks',
  [NETWORKS_ROUTE]: 'networks',
  [NOTIFICATIONS_SETTINGS_ROUTE]: 'notifications',
  [REVEAL_SRP_LIST_ROUTE]: 'revealSecretRecoveryPhrase',
  [SECURITY_PASSWORD_CHANGE_ROUTE]: 'securityChangePassword',
  [SECURITY_ROUTE]: 'securityAndPrivacy',
  [TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL]: 'shieldClaim',
  [TRANSACTION_SHIELD_CLAIM_ROUTES.BASE]: 'shieldClaimsListTitle',
  [TRANSACTION_SHIELD_MANAGE_PAST_PLAN_ROUTE]: 'shieldPastPlansTitle',
  [TRANSACTION_SHIELD_MANAGE_PLAN_ROUTE]: 'shieldManagePlan',
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
  const snapIdFromSearch = searchParams.get('snapId');

  const pathNameTail = pathname.match(/[^/]+$/u)?.[0] || '';
  const isAddressEntryPage = pathNameTail.includes('0x');
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
  const isSnapSettingsRoute = pathname === SNAP_SETTINGS_ROUTE;
  const isShieldClaimNewPage = Boolean(
    pathname.match(TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL),
  );
  const isShieldClaimViewActivePage = Boolean(
    pathname.startsWith(TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_PENDING.FULL),
  );
  const isShieldClaimViewCompletedPage = Boolean(
    pathname.startsWith(TRANSACTION_SHIELD_CLAIM_ROUTES.VIEW_HISTORY.FULL),
  );
  const isShieldClaimEditDraftPage = Boolean(
    pathname.startsWith(TRANSACTION_SHIELD_CLAIM_ROUTES.EDIT_DRAFT.FULL),
  );
  const isShieldClaimBasePage = Boolean(
    pathname.startsWith(TRANSACTION_SHIELD_CLAIM_ROUTES.BASE),
  );
  const isShieldManagePlanPage = Boolean(
    pathname.startsWith(TRANSACTION_SHIELD_MANAGE_PLAN_ROUTE),
  );
  const isShieldManagePastPlanPage = Boolean(
    pathname.startsWith(TRANSACTION_SHIELD_MANAGE_PAST_PLAN_ROUTE),
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

  // If pathname is view claim route rename the tab title to "Claim details"
  if (
    isShieldClaimViewActivePage ||
    isShieldClaimViewCompletedPage ||
    isShieldClaimEditDraftPage
  ) {
    pathnameI18nKey = 'shieldClaimsListTitle';
  }

  let backRoute = SETTINGS_ROUTE;
  if (isNetworksFormPage) {
    backRoute = NETWORKS_ROUTE;
  } else if (isAddPopularCustomNetwork) {
    backRoute = NETWORKS_ROUTE;
  } else if (isRevealSrpListPage || isPasswordChangePage) {
    backRoute = SECURITY_ROUTE;
  } else if (isShieldClaimNewPage) {
    backRoute = TRANSACTION_SHIELD_CLAIM_ROUTES.BASE;
  } else if (isShieldClaimViewActivePage || isShieldClaimEditDraftPage) {
    backRoute = `${TRANSACTION_SHIELD_CLAIM_ROUTES.BASE}?tab=${CLAIMS_TAB_KEYS.PENDING}`;
  } else if (isShieldClaimViewCompletedPage) {
    backRoute = `${TRANSACTION_SHIELD_CLAIM_ROUTES.BASE}?tab=${CLAIMS_TAB_KEYS.HISTORY}`;
  } else if (
    isShieldClaimBasePage ||
    isShieldManagePlanPage ||
    isShieldManagePastPlanPage
  ) {
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
    isSnapSettingsRoute && snapIdFromSearch
      ? snapNameGetter(snapIdFromSearch)
      : '';

  return {
    addNewNetwork,
    addressName,
    backRoute,
    conversionDate,
    currentPath: pathname,
    currentSnapId: snapIdFromSearch,
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
