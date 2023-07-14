import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setUseNftDetection,
  setOpenSeaEnabled,
  setTransactionSecurityCheckEnabled,
  setSecurityAlertBlockaidEnabled,
} from '../../../store/actions';
import {
  getUseNftDetection,
  getOpenSeaEnabled,
  getIsTransactionSecurityCheckEnabled,
  getIsSecurityAlertBlockaidEnabled,
} from '../../../selectors';
import ExperimentalTab from './experimental-tab.component';

const mapStateToProps = (state) => {
  return {
    useNftDetection: getUseNftDetection(state),
    openSeaEnabled: getOpenSeaEnabled(state),
    transactionSecurityCheckEnabled:
      getIsTransactionSecurityCheckEnabled(state),
    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    securityAlertBlockaidEnabled: getIsSecurityAlertBlockaidEnabled(state),
    ///: END:ONLY_INCLUDE_IN(blockaid)
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setUseNftDetection: (val) => dispatch(setUseNftDetection(val)),
    setOpenSeaEnabled: (val) => dispatch(setOpenSeaEnabled(val)),
    setTransactionSecurityCheckEnabled: (val) =>
      dispatch(setTransactionSecurityCheckEnabled(val)),
    ///: BEGIN:ONLY_INCLUDE_IN(blockaid)
    setSecurityAlertBlockaidEnabled: (val) =>
      dispatch(setSecurityAlertBlockaidEnabled(val)),
    ///: END:ONLY_INCLUDE_IN(blockaid)
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ExperimentalTab);
