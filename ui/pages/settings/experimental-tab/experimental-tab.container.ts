import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setBitcoinSupportEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  setUseRequestQueue,
  setPetnamesEnabled,
  setFeatureNotificationsEnabled,
  setRedesignedConfirmationsEnabled,
} from '../../../store/actions';
import {
  getIsBitcoinSupportEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  getUseRequestQueue,
  getPetnamesEnabled,
  getFeatureNotificationsEnabled,
  getRedesignedConfirmationsEnabled,
} from '../../../selectors';
import ExperimentalTab from './experimental-tab.component';

import type { MetaMaskReduxDispatch, MetaMaskReduxState } from '../../../store/store';


const mapStateToProps = (state: MetaMaskReduxState) => {
  const petnamesEnabled = getPetnamesEnabled(state);
  const featureNotificationsEnabled = getFeatureNotificationsEnabled(state);
  return {
    bitcoinSupportEnabled: getIsBitcoinSupportEnabled(state),
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    addSnapAccountEnabled: getIsAddSnapAccountEnabled(state),
    ///: END:ONLY_INCLUDE_IF
    useRequestQueue: getUseRequestQueue(state),
    petnamesEnabled,
    featureNotificationsEnabled,
    redesignedConfirmationsEnabled: getRedesignedConfirmationsEnabled(state),
  };
};

const mapDispatchToProps = (dispatch: MetaMaskReduxDispatch) => {
  return {
    setBitcoinSupportEnabled: (value: boolean) => setBitcoinSupportEnabled(value),
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    setAddSnapAccountEnabled: (value: boolean) => setAddSnapAccountEnabled(value),
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
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
