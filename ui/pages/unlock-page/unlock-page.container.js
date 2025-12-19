import { connect } from 'react-redux';
import { compose } from 'redux';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import {
  DEFAULT_ROUTE,
  RESTORE_VAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  tryUnlockMetamask,
  markPasswordForgotten,
  forceUpdateMetamaskState,
  checkIsSeedlessPasswordOutdated,
  resetOnboarding,
  resetWallet,
  getIsSeedlessOnboardingUserAuthenticated,
} from '../../store/actions';
import { getIsSocialLoginFlow, getFirstTimeFlowType } from '../../selectors';
import {
  getCompletedOnboarding,
  getIsWalletResetInProgress,
} from '../../ducks/metamask/metamask';
import withRouterHooks from '../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import UnlockPage from './unlock-page.component';

const mapStateToProps = (state) => {
  const {
    metamask: { isUnlocked },
  } = state;
  return {
    isUnlocked,
    isSocialLoginFlow: getIsSocialLoginFlow(state),
    isOnboardingCompleted: getCompletedOnboarding(state),
    firstTimeFlowType: getFirstTimeFlowType(state),
    isWalletResetInProgress: getIsWalletResetInProgress(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    tryUnlockMetamask: (password) => dispatch(tryUnlockMetamask(password)),
    markPasswordForgotten: () => dispatch(markPasswordForgotten()),
    forceUpdateMetamaskState: () => forceUpdateMetamaskState(dispatch),
    loginWithDifferentMethod: () => dispatch(resetOnboarding()),
    checkIsSeedlessPasswordOutdated: () =>
      dispatch(checkIsSeedlessPasswordOutdated()),
    resetWallet: () => dispatch(resetWallet()),
    getIsSeedlessOnboardingUserAuthenticated: () =>
      dispatch(getIsSeedlessOnboardingUserAuthenticated()),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    markPasswordForgotten: propsMarkPasswordForgotten,
    tryUnlockMetamask: propsTryUnlockMetamask,
    ...restDispatchProps
  } = dispatchProps;
  const {
    navigate,
    onSubmit: ownPropsSubmit,
    location,
    ...restOwnProps
  } = ownProps;

  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  const onImport = async () => {
    await propsMarkPasswordForgotten();
    navigate(RESTORE_VAULT_ROUTE, { replace: true });

    if (isPopup) {
      global.platform.openExtensionInBrowser?.(RESTORE_VAULT_ROUTE);
    }
  };

  const onSubmit = async (password) => {
    await propsTryUnlockMetamask(password);
    // Redirect to the intended route if available, otherwise DEFAULT_ROUTE
    let redirectTo = DEFAULT_ROUTE;
    const fromLocation = location.state?.from;
    if (fromLocation?.pathname) {
      const search = fromLocation.search || '';
      redirectTo = fromLocation.pathname + search;
    }
    navigate(redirectTo);
  };

  return {
    ...stateProps,
    ...restDispatchProps,
    ...restOwnProps,
    onRestore: onImport,
    onSubmit: ownPropsSubmit || onSubmit,
    navigate,
    location,
    isPopup,
  };
};

const UnlockPageConnected = compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(UnlockPage);

export default UnlockPageConnected;
