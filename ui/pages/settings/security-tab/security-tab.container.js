import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setFeatureFlag,
  setMetaMetricsParticipationMode,
  setUsePhishDetect,
} from '../../../store/actions';
import SecurityTab from './security-tab.component';

const mapStateToProps = (state) => {
  const {
    appState: { warning },
    metamask,
  } = state;
  const {
    featureFlags: { showIncomingTransactions } = {},
    metaMetricsParticipationMode,
    usePhishDetect,
  } = metamask;

  return {
    warning,
    showIncomingTransactions,
    metaMetricsParticipationMode,
    usePhishDetect,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setMetaMetricsParticipationMode: (val) =>
      dispatch(setMetaMetricsParticipationMode(val)),
    setShowIncomingTransactionsFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('showIncomingTransactions', shouldShow)),
    setUsePhishDetect: (val) => dispatch(setUsePhishDetect(val)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SecurityTab);
