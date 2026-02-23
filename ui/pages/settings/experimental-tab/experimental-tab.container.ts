import { connect } from 'react-redux';
import {
  setAddSnapAccountEnabled,
  setFeatureNotificationsEnabled,
  setWatchEthereumAccountEnabled,
} from '../../../store/actions';
import {
  getIsAddSnapAccountEnabled,
  getFeatureNotificationsEnabled,
  getIsWatchEthereumAccountEnabled,
} from '../../../selectors';
import type {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
} from '../../../store/store';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (state: MetaMaskReduxState) => {
  const featureNotificationsEnabled = getFeatureNotificationsEnabled(state);
  return {
    watchAccountEnabled: getIsWatchEthereumAccountEnabled(state),
    addSnapAccountEnabled: getIsAddSnapAccountEnabled(state),
    featureNotificationsEnabled,
  };
};

const mapDispatchToProps = (dispatch: MetaMaskReduxDispatch) => {
  return {
    setWatchAccountEnabled: (value: boolean) =>
      setWatchEthereumAccountEnabled(value),
    setAddSnapAccountEnabled: (value: boolean) =>
      setAddSnapAccountEnabled(value),
    setFeatureNotificationsEnabled: (value: boolean) => {
      return dispatch(setFeatureNotificationsEnabled(value));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ExperimentalTab);
