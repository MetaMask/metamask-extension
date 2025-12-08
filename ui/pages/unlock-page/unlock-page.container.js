import { connect } from 'react-redux';
import React from 'react';
import PropTypes from 'prop-types';
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
import { getCompletedOnboarding } from '../../ducks/metamask/metamask';
import withRouterHooks from '../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import { useNavState } from '../../contexts/navigation-state';
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
    navState,
    ...restOwnProps
  } = ownProps;

  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  const onImport = async () => {
    await propsMarkPasswordForgotten();
    navigate(RESTORE_VAULT_ROUTE);

    if (isPopup) {
      global.platform.openExtensionInBrowser?.(RESTORE_VAULT_ROUTE);
    }
  };

  const onSubmit = async (password) => {
    await propsTryUnlockMetamask(password);
    // Redirect to the intended route if available, otherwise DEFAULT_ROUTE
    let redirectTo = DEFAULT_ROUTE;
    // Read from both v5 location.state and v5-compat navState
    const fromLocation = location.state?.from || navState?.from;
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
    navState,
    isPopup,
  };
};

const UnlockPageConnected = compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(UnlockPage);

/**
 * Inject navState from NavigationStateContext for v5-compat navigation.
 * This wrapper ensures the unlock page can read navigation state from both
 * v5 location.state and v5-compat NavigationStateContext.
 *
 * @param {object} props - Component props (navigate, location from route)
 * @returns {React.ReactElement} UnlockPage with navState injected
 */
const UnlockPageWithNavState = (props) => {
  const navState = useNavState();
  return <UnlockPageConnected {...props} navState={navState} />;
};

UnlockPageWithNavState.propTypes = {
  navigate: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
  onSubmit: PropTypes.func,
};

// Export the connected component for Storybook/testing
export { UnlockPageConnected };

export default UnlockPageWithNavState;
