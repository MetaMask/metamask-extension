import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setTransactionSecurityCheckEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  setSecurityAlertsEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  setAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  setUseRequestQueue,
  setPetnamesEnabled,
} from '../../../store/actions';
import {
  getIsTransactionSecurityCheckEnabled,
  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  getIsSecurityAlertsEnabled,
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IF
  getUseRequestQueue,
  getPetnamesEnabled,
} from '../../../selectors';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (state) => {
  const petnamesEnabled = getPetnamesEnabled(state);
  return {
    transactionSecurityCheckEnabled:
      getIsTransactionSecurityCheckEnabled(state),

    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    securityAlertsEnabled: getIsSecurityAlertsEnabled(state),
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    addSnapAccountEnabled: getIsAddSnapAccountEnabled(state),
    ///: END:ONLY_INCLUDE_IF
    useRequestQueue: getUseRequestQueue(state),
    petnamesEnabled,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setTransactionSecurityCheckEnabled: (val) =>
      dispatch(setTransactionSecurityCheckEnabled(val)),
    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    setSecurityAlertsEnabled: (val) => setSecurityAlertsEnabled(val),
    ///: END:ONLY_INCLUDE_IF

    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    setAddSnapAccountEnabled: (val) => setAddSnapAccountEnabled(val),
    ///: END:ONLY_INCLUDE_IF
    setUseRequestQueue: (val) => dispatch(setUseRequestQueue(val)),
    setPetnamesEnabled: (value) => {
      return dispatch(setPetnamesEnabled(value));
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
