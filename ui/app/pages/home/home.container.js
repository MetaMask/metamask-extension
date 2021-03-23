import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  activeTabHasPermissions,
  getCurrentEthBalance,
  getFirstPermissionRequest,
  getIsMainnet,
  getOriginOfCurrentTab,
  getTotalUnapprovedCount,
  getUnapprovedTemplatedConfirmations,
  getWeb3ShimUsageStateForOrigin,
  unconfirmedTransactionsCountSelector,
} from '../../selectors';

import {
  restoreFromThreeBox,
  turnThreeBoxSyncingOn,
  getThreeBoxLastUpdated,
  setShowRestorePromptToFalse,
  setConnectedStatusPopoverHasBeenShown,
  setDefaultHomeActiveTabName,
  setSwapsWelcomeMessageHasBeenShown,
  setWeb3ShimUsageAlertDismissed,
  setAlertEnabledness,
} from '../../store/actions';
import { setThreeBoxLastUpdated } from '../../ducks/app/app';
import { getWeb3ShimUsageAlertEnabledness } from '../../ducks/metamask/metamask';
import {
  getSwapsWelcomeMessageSeenStatus,
  getSwapsFeatureLiveness,
} from '../../ducks/swaps/swaps';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../shared/constants/app';
import {
  ALERT_TYPES,
  WEB3_SHIM_USAGE_ALERT_STATES,
} from '../../../../shared/constants/alerts';
import Home from './home.component';

const mapStateToProps = (state) => {
  const { metamask, appState } = state;
  const {
    suggestedTokens,
    seedPhraseBackedUp,
    tokens,
    threeBoxSynced,
    showRestorePrompt,
    selectedAddress,
    connectedStatusPopoverHasBeenShown,
    defaultHomeActiveTabName,
    swapsState,
  } = metamask;
  const accountBalance = getCurrentEthBalance(state);
  const { forgottenPassword, threeBoxLastUpdated } = appState;
  const totalUnapprovedCount = getTotalUnapprovedCount(state);
  const swapsEnabled = getSwapsFeatureLiveness(state);
  const pendingConfirmations = getUnapprovedTemplatedConfirmations(state);

  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;

  const firstPermissionsRequest = getFirstPermissionRequest(state);
  const firstPermissionsRequestId =
    firstPermissionsRequest && firstPermissionsRequest.metadata
      ? firstPermissionsRequest.metadata.id
      : null;

  const originOfCurrentTab = getOriginOfCurrentTab(state);
  const shouldShowWeb3ShimUsageNotification =
    isPopup &&
    getWeb3ShimUsageAlertEnabledness(state) &&
    activeTabHasPermissions(state) &&
    getWeb3ShimUsageStateForOrigin(state, originOfCurrentTab) ===
      WEB3_SHIM_USAGE_ALERT_STATES.RECORDED;

  return {
    forgottenPassword,
    suggestedTokens,
    swapsEnabled,
    unconfirmedTransactionsCount: unconfirmedTransactionsCountSelector(state),
    shouldShowSeedPhraseReminder:
      seedPhraseBackedUp === false &&
      (parseInt(accountBalance, 16) > 0 || tokens.length > 0),
    isPopup,
    isNotification,
    threeBoxSynced,
    showRestorePrompt,
    selectedAddress,
    threeBoxLastUpdated,
    firstPermissionsRequestId,
    totalUnapprovedCount,
    connectedStatusPopoverHasBeenShown,
    defaultHomeActiveTabName,
    swapsWelcomeMessageHasBeenShown: getSwapsWelcomeMessageSeenStatus(state),
    haveSwapsQuotes: Boolean(Object.values(swapsState.quotes || {}).length),
    swapsFetchParams: swapsState.fetchParams,
    showAwaitingSwapScreen: swapsState.routeState === 'awaiting',
    isMainnet: getIsMainnet(state),
    originOfCurrentTab,
    shouldShowWeb3ShimUsageNotification,
    pendingConfirmations,
  };
};

const mapDispatchToProps = (dispatch) => ({
  turnThreeBoxSyncingOn: () => dispatch(turnThreeBoxSyncingOn()),
  setupThreeBox: () => {
    dispatch(getThreeBoxLastUpdated()).then((lastUpdated) => {
      if (lastUpdated) {
        dispatch(setThreeBoxLastUpdated(lastUpdated));
      } else {
        dispatch(setShowRestorePromptToFalse());
        dispatch(turnThreeBoxSyncingOn());
      }
    });
  },
  restoreFromThreeBox: (address) => dispatch(restoreFromThreeBox(address)),
  setShowRestorePromptToFalse: () => dispatch(setShowRestorePromptToFalse()),
  setConnectedStatusPopoverHasBeenShown: () =>
    dispatch(setConnectedStatusPopoverHasBeenShown()),
  onTabClick: (name) => dispatch(setDefaultHomeActiveTabName(name)),
  setSwapsWelcomeMessageHasBeenShown: () =>
    dispatch(setSwapsWelcomeMessageHasBeenShown()),
  setWeb3ShimUsageAlertDismissed: (origin) =>
    setWeb3ShimUsageAlertDismissed(origin),
  disableWeb3ShimUsageAlert: () =>
    setAlertEnabledness(ALERT_TYPES.web3ShimUsage, false),
});

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Home);
