import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setTransactionSecurityCheckEnabled,
  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  setSecurityAlertsEnabled,
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  setAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IN
  setUseRequestQueue,
} from '../../../store/actions';
import {
  getIsTransactionSecurityCheckEnabled,
  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  getIsSecurityAlertsEnabled,
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IN
  getUseRequestQueue,
} from '../../../selectors';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (state) => {
  return {
    transactionSecurityCheckEnabled:
      getIsTransactionSecurityCheckEnabled(state),

    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    securityAlertsEnabled: getIsSecurityAlertsEnabled(state),
    ///: END:ONLY_INCLUDE_IN

    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    addSnapAccountEnabled: getIsAddSnapAccountEnabled(state),
    ///: END:ONLY_INCLUDE_IN
    useRequestQueue: getUseRequestQueue(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setTransactionSecurityCheckEnabled: (val) =>
      dispatch(setTransactionSecurityCheckEnabled(val)),
    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    setSecurityAlertsEnabled: (val) => setSecurityAlertsEnabled(val),
    ///: END:ONLY_INCLUDE_IN

    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    setAddSnapAccountEnabled: (val) => setAddSnapAccountEnabled(val),
    ///: END:ONLY_INCLUDE_IN
    setUseRequestQueue: (val) => dispatch(setUseRequestQueue(val)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
