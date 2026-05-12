import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Location as RouterLocation, NavigateFunction } from 'react-router-dom';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  tryUnlockMetamask,
  tryUnlockMetamaskWithPasskey,
  forceUpdateMetamaskState,
  checkIsSeedlessPasswordOutdated,
  resetOnboarding,
  getIsSeedlessOnboardingUserAuthenticated,
} from '../../store/actions';
import {
  getIsSocialLoginFlow,
  getFirstTimeFlowType,
  getIsPasskeyFeatureAvailable,
  getIsPasskeyRegistered,
  getIsEnrolledPasskeyIncompatibleWithSidepanel,
} from '../../selectors';
import {
  getCompletedOnboarding,
  getIsWalletResetInProgress,
  getPasskeyAutoUnlockSuppressed,
} from '../../ducks/metamask/metamask';
import withRouterHooks from '../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import { MetaMaskReduxDispatch, MetaMaskReduxState } from '../../store/store';
import UnlockPage from './unlock-page.component';

type OwnProps = {
  navigate: NavigateFunction;
  location: RouterLocation;
  onSubmit?: (password: string) => Promise<void>;
};

const mapStateToProps = (state: MetaMaskReduxState) => {
  const {
    metamask: { isUnlocked },
  } = state;
  const isSocialLoginFlow = getIsSocialLoginFlow(state);
  const isOnboardingCompleted = getCompletedOnboarding(state);
  const isPasskeyActive =
    getIsPasskeyFeatureAvailable(state) &&
    getIsPasskeyRegistered(state) &&
    !isSocialLoginFlow &&
    isOnboardingCompleted;
  return {
    isUnlocked,
    isSocialLoginFlow,
    isOnboardingCompleted,
    firstTimeFlowType: getFirstTimeFlowType(state),
    isWalletResetInProgress: getIsWalletResetInProgress(state),
    isPasskeyActive,
    mustDeferPasskeyToBrowserTab:
      getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL &&
      getIsEnrolledPasskeyIncompatibleWithSidepanel(state) &&
      isPasskeyActive,
    passkeyAutoUnlockSuppressed: getPasskeyAutoUnlockSuppressed(state),
  };
};

const mapDispatchToProps = (dispatch: MetaMaskReduxDispatch) => {
  return {
    tryUnlockMetamask: (password: string) =>
      dispatch(tryUnlockMetamask(password)),
    tryUnlockMetamaskWithPasskey: (
      authenticationResponse: PasskeyAuthenticationResponse,
    ) => dispatch(tryUnlockMetamaskWithPasskey(authenticationResponse)),
    forceUpdateMetamaskState: () => forceUpdateMetamaskState(dispatch),
    loginWithDifferentMethod: () => dispatch(resetOnboarding()),
    checkIsSeedlessPasswordOutdated: () =>
      dispatch(checkIsSeedlessPasswordOutdated()),
    getIsSeedlessOnboardingUserAuthenticated: () =>
      dispatch(getIsSeedlessOnboardingUserAuthenticated()),
  };
};

const mergeProps = (
  stateProps: ReturnType<typeof mapStateToProps>,
  dispatchProps: ReturnType<typeof mapDispatchToProps>,
  ownProps: OwnProps,
) => {
  const {
    tryUnlockMetamask: propsTryUnlockMetamask,
    tryUnlockMetamaskWithPasskey: propsTryUnlockMetamaskWithPasskey,
    ...restDispatchProps
  } = dispatchProps;
  const {
    navigate,
    onSubmit: ownPropsSubmit,
    location,
    ...restOwnProps
  } = ownProps;

  const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

  const navigateAfterUnlock = () => {
    // Redirect to the intended route if available, otherwise DEFAULT_ROUTE
    let redirectTo = DEFAULT_ROUTE;
    const fromLocation = location.state?.from;
    if (fromLocation?.pathname) {
      const search = fromLocation.search || '';
      redirectTo = fromLocation.pathname + search;
    }
    navigate(redirectTo, { replace: true });
  };

  const onSubmit = async (password: string) => {
    await propsTryUnlockMetamask(password);
    navigateAfterUnlock();
  };

  const onUnlockWithPasskey = async (
    authenticationResponse: PasskeyAuthenticationResponse,
  ) => {
    await propsTryUnlockMetamaskWithPasskey(authenticationResponse);
    navigateAfterUnlock();
  };

  return {
    ...stateProps,
    ...restDispatchProps,
    ...restOwnProps,
    onSubmit: ownPropsSubmit || onSubmit,
    onUnlockWithPasskey,
    navigate,
    location,
    isPopup,
  };
};

const UnlockPageConnected = compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(UnlockPage) as React.ComponentType<React.PropsWithChildren<{
  onSubmit?: (password: string) => Promise<void>;
}>>;

export default UnlockPageConnected;
