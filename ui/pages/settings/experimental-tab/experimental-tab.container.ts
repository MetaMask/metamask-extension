import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setBitcoinSupportEnabled,
  setBitcoinTestnetSupportEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  setPetnamesEnabled,
  setFeatureNotificationsEnabled,
  setRedesignedConfirmationsEnabled,
  setWatchEthereumAccountEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  setSolanaSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
} from '../../../store/actions';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  getIsSolanaSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
  getIsBitcoinSupportEnabled,
  getIsBitcoinTestnetSupportEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  getPetnamesEnabled,
  getFeatureNotificationsEnabled,
  getRedesignedConfirmationsEnabled,
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
    ///: BEGIN:ONLY_INCLUDE_IF(solana)
    solanaSupportEnabled: getIsSolanaSupportEnabled(state),
    ///: END:ONLY_INCLUDE_IF
    watchAccountEnabled: getIsWatchEthereumAccountEnabled(state),
    bitcoinSupportEnabled: getIsBitcoinSupportEnabled(state),
    bitcoinTestnetSupportEnabled: getIsBitcoinTestnetSupportEnabled(state),
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    addSnapAccountEnabled: getIsAddSnapAccountEnabled(state),
    ///: END:ONLY_INCLUDE_IF
    petnamesEnabled,
    featureNotificationsEnabled,
    redesignedConfirmationsEnabled: getRedesignedConfirmationsEnabled(state),
  };
};

const mapDispatchToProps = (dispatch: MetaMaskReduxDispatch) => {
  return {
    setWatchAccountEnabled: (value: boolean) =>
      setWatchEthereumAccountEnabled(value),
    ///: BEGIN:ONLY_INCLUDE_IF(solana)
    setSolanaSupportEnabled: (value: boolean) => setSolanaSupportEnabled(value),
    ///: END:ONLY_INCLUDE_IF
    setBitcoinSupportEnabled: (value: boolean) =>
      setBitcoinSupportEnabled(value),
    setBitcoinTestnetSupportEnabled: (value: boolean) =>
      setBitcoinTestnetSupportEnabled(value),
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    setAddSnapAccountEnabled: (value: boolean) =>
      setAddSnapAccountEnabled(value),
    ///: END:ONLY_INCLUDE_IF
    setPetnamesEnabled: (value: boolean) => {
      return dispatch(setPetnamesEnabled(value));
    },
    setFeatureNotificationsEnabled: (value: boolean) => {
      return dispatch(setFeatureNotificationsEnabled(value));
    },
    setRedesignedConfirmationsEnabled: (value: boolean) =>
      dispatch(setRedesignedConfirmationsEnabled(value)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
