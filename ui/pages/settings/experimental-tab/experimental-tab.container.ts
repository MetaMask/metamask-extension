import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setBitcoinSupportEnabled,
  setBitcoinTestnetSupportEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  setUseRequestQueue,
  setPetnamesEnabled,
  setFeatureNotificationsEnabled,
  setRedesignedConfirmationsEnabled,
  setRedesignedTransactionsEnabled,
  setWatchEthereumAccountEnabled,
} from '../../../store/actions';
import {
  getIsBitcoinSupportEnabled,
  getIsBitcoinTestnetSupportEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  getUseRequestQueue,
  getPetnamesEnabled,
  getFeatureNotificationsEnabled,
  getRedesignedConfirmationsEnabled,
  getRedesignedTransactionsEnabled,
  getIsWatchEthereumAccountEnabled,
} from '../../../selectors';
import type {
  MetaMaskReduxDispatch,
  MetaMaskReduxState,
} from '../../../store/store';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (state: MetaMaskReduxState) => {
  const petnamesEnabled = getPetnamesEnabled(state);
  const featureNotificationsEnabled = getFeatureNotificationsEnabled(state);
  return {
    watchAccountEnabled: getIsWatchEthereumAccountEnabled(state),
    bitcoinSupportEnabled: getIsBitcoinSupportEnabled(state),
    bitcoinTestnetSupportEnabled: getIsBitcoinTestnetSupportEnabled(state),
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    addSnapAccountEnabled: getIsAddSnapAccountEnabled(state),
    ///: END:ONLY_INCLUDE_IF
    useRequestQueue: getUseRequestQueue(state),
    petnamesEnabled,
    featureNotificationsEnabled,
    redesignedConfirmationsEnabled: getRedesignedConfirmationsEnabled(state),
    redesignedTransactionsEnabled: getRedesignedTransactionsEnabled(state),
  };
};

const mapDispatchToProps = (dispatch: MetaMaskReduxDispatch) => {
  return {
    setWatchAccountEnabled: (value: boolean) =>
      setWatchEthereumAccountEnabled(value),
    setBitcoinSupportEnabled: (value: boolean) =>
      setBitcoinSupportEnabled(value),
    setBitcoinTestnetSupportEnabled: (value: boolean) =>
      setBitcoinTestnetSupportEnabled(value),
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    setAddSnapAccountEnabled: (value: boolean) =>
      setAddSnapAccountEnabled(value),
    ///: END:ONLY_INCLUDE_IF
    setUseRequestQueue: (value: boolean) => setUseRequestQueue(value),
    setPetnamesEnabled: (value: boolean) => {
      return dispatch(setPetnamesEnabled(value));
    },
    setFeatureNotificationsEnabled: (value: boolean) => {
      return dispatch(setFeatureNotificationsEnabled(value));
    },
    setRedesignedConfirmationsEnabled: (value: boolean) =>
      dispatch(setRedesignedConfirmationsEnabled(value)),
    setRedesignedTransactionsEnabled: (value: boolean) =>
      dispatch(setRedesignedTransactionsEnabled(value)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
