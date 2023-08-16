import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-mmi,build-beta)
  setTransactionSecurityCheckEnabled,
  ///: END:ONLY_INCLUDE_IN

  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  setSecurityAlertsEnabled,
  ///: END:ONLY_INCLUDE_IN
} from '../../../store/actions';
import {
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-mmi,build-beta)
  getIsTransactionSecurityCheckEnabled,
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
  getIsSecurityAlertsEnabled,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-mmi,build-beta,blockaid)
  state,
  ///: END:ONLY_INCLUDE_IN
) => {
  return {
    ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-mmi,build-beta)
    transactionSecurityCheckEnabled:
      getIsTransactionSecurityCheckEnabled(state),
    ///: END:ONLY_INCLUDE_IN
    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    securityAlertsEnabled: getIsSecurityAlertsEnabled(state),
    ///: END:ONLY_INCLUDE_IN
  };
};

const mapDispatchToProps = (
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-mmi,build-beta)
  dispatch,
  ///: END:ONLY_INCLUDE_IN
) => {
  return {
    ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-mmi,build-beta)
    setTransactionSecurityCheckEnabled: (val) =>
      dispatch(setTransactionSecurityCheckEnabled(val)),
    ///: END:ONLY_INCLUDE_IN
    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    setSecurityAlertsEnabled: (val) => setSecurityAlertsEnabled(val),
    ///: END:ONLY_INCLUDE_IN
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
