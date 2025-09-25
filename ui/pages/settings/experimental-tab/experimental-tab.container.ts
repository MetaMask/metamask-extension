import { compose } from 'redux';
import { connect } from 'react-redux';

import {
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  setFeatureNotificationsEnabled,
  setWatchEthereumAccountEnabled,
} from '../../../store/actions';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  getFeatureNotificationsEnabled,
  getIsWatchEthereumAccountEnabled,
} from '../../../selectors';
import type {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
} from '../../../store/store';
import withRouterHooks from '../../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (state: MetaMaskReduxState) => {
  const featureNotificationsEnabled = getFeatureNotificationsEnabled(state);
  return {
    watchAccountEnabled: getIsWatchEthereumAccountEnabled(state),
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    addSnapAccountEnabled: getIsAddSnapAccountEnabled(state),
    ///: END:ONLY_INCLUDE_IF
    featureNotificationsEnabled,
  };
};

const mapDispatchToProps = (dispatch: MetaMaskReduxDispatch) => {
  return {
    setWatchAccountEnabled: (value: boolean) =>
      setWatchEthereumAccountEnabled(value),
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    setAddSnapAccountEnabled: (value: boolean) =>
      setAddSnapAccountEnabled(value),
    ///: END:ONLY_INCLUDE_IF
    setFeatureNotificationsEnabled: (value: boolean) => {
      return dispatch(setFeatureNotificationsEnabled(value));
    },
  };
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
