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
} from '../../store/actions';
import { getIsSocialLoginFlow, getFirstTimeFlowType } from '../../selectors';
import { getCompletedOnboarding } from '../../ducks/metamask/metamask';
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

  const onImport = async () => {
    await propsMarkPasswordForgotten();
    navigate(RESTORE_VAULT_ROUTE);

    if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
      global.platform.openExtensionInBrowser?.(RESTORE_VAULT_ROUTE);
    }
  };

  const onSubmit = async (password) => {
    await propsTryUnlockMetamask(password);
    // Redirect to the intended route if available, otherwise DEFAULT_ROUTE
    let redirectTo = DEFAULT_ROUTE;

    // Check state first (fallback), then navigation context (HashRouter v5-compat workaround)
    if (location.state?.from?.pathname) {
      const search = location.state.from.search || '';
      redirectTo = location.state.from.pathname + search;
    } else if (ownProps.navState?.from?.pathname) {
      redirectTo =
        ownProps.navState.from.pathname + (ownProps.navState.from.search || '');
      ownProps.clearNavState();
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
  };
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(UnlockPage);
