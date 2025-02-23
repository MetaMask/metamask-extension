import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  setBitcoinSupportEnabled,
  setBitcoinTestnetSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  setPetnamesEnabled,
  setFeatureNotificationsEnabled,
  setWatchEthereumAccountEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  setSolanaSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
} from '../../../store/actions';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(solana)
  getIsSolanaSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
  getIsBitcoinSupportEnabled,
  getIsBitcoinTestnetSupportEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  getPetnamesEnabled,
  getFeatureNotificationsEnabled,
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
    ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
    bitcoinSupportEnabled: getIsBitcoinSupportEnabled(state),
    bitcoinTestnetSupportEnabled: getIsBitcoinTestnetSupportEnabled(state),
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    addSnapAccountEnabled: getIsAddSnapAccountEnabled(state),
    ///: END:ONLY_INCLUDE_IF
    petnamesEnabled,
    featureNotificationsEnabled,
  };
};

const mapDispatchToProps = (dispatch: MetaMaskReduxDispatch) => {
  return {
    setWatchAccountEnabled: (value: boolean) =>
      setWatchEthereumAccountEnabled(value),
    ///: BEGIN:ONLY_INCLUDE_IF(solana)
    setSolanaSupportEnabled: (value: boolean) => setSolanaSupportEnabled(value),
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
    setBitcoinSupportEnabled: (value: boolean) =>
      setBitcoinSupportEnabled(value),
    setBitcoinTestnetSupportEnabled: (value: boolean) =>
      setBitcoinTestnetSupportEnabled(value),
    ///: END:ONLY_INCLUDE_IF
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
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
