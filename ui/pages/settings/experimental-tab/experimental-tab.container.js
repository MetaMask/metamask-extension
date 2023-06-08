import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setTransactionSecurityCheckEnabled,
  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  setSecurityAlertsEnabled,
  ///: END:ONLY_INCLUDE_IN
<<<<<<< HEAD
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  setAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IN
=======
  setUseRequestQueue,
>>>>>>> bb69c01557 (Add a queue for dapps accessing different networks)
} from '../../../store/actions';
import {
  getIsTransactionSecurityCheckEnabled,
  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  getIsSecurityAlertsEnabled,
  ///: END:ONLY_INCLUDE_IN
<<<<<<< HEAD
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  getIsAddSnapAccountEnabled,
  ///: END:ONLY_INCLUDE_IN
=======
  getUseRequestQueue,
>>>>>>> bb69c01557 (Add a queue for dapps accessing different networks)
} from '../../../selectors';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (state) => {
  return {
    transactionSecurityCheckEnabled:
      getIsTransactionSecurityCheckEnabled(state),

    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    securityAlertsEnabled: getIsSecurityAlertsEnabled(state),
    ///: END:ONLY_INCLUDE_IN
<<<<<<< HEAD

    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    addSnapAccountEnabled: getIsAddSnapAccountEnabled(state),
    ///: END:ONLY_INCLUDE_IN
=======
    useRequestQueue: getUseRequestQueue(state),
>>>>>>> bb69c01557 (Add a queue for dapps accessing different networks)
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setTransactionSecurityCheckEnabled: (val) =>
      dispatch(setTransactionSecurityCheckEnabled(val)),

    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    setSecurityAlertsEnabled: (val) => setSecurityAlertsEnabled(val),
    ///: END:ONLY_INCLUDE_IN

<<<<<<< HEAD
    ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
    setAddSnapAccountEnabled: (val) => setAddSnapAccountEnabled(val),
    ///: END:ONLY_INCLUDE_IN
=======
    setUseRequestQueue: (val) => dispatch(setUseRequestQueue(val)),
>>>>>>> bb69c01557 (Add a queue for dapps accessing different networks)
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
