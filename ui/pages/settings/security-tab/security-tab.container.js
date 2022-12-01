import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setFeatureFlag,
  setParticipateInMetaMetrics,
  setUsePhishDetect,
  setUseTokenDetection,
  setShowGasFeeEstimationBuySwapTokens,
  setIpfsGateway,
  setUseMultiAccountBalanceChecker,
  setUseNftDetection,
  setOpenSeaEnabled,
} from '../../../store/actions';
import { getOpenSeaEnabled, getUseNftDetection } from '../../../selectors';
import SecurityTab from './security-tab.component';

const mapStateToProps = (state) => {
  const {
    appState: { warning },
    metamask,
  } = state;
  const {
    featureFlags: { showIncomingTransactions } = {},
    participateInMetaMetrics,
    usePhishDetect,
    useTokenDetection,
    showGasFeeEstimationBuySwapTokens,
    ipfsGateway,
    useMultiAccountBalanceChecker,
  } = metamask;

  return {
    warning,
    showIncomingTransactions,
    participateInMetaMetrics,
    usePhishDetect,
    useTokenDetection,
    showGasFeeEstimationBuySwapTokens,
    ipfsGateway,
    useMultiAccountBalanceChecker,
    useNftDetection: getUseNftDetection(state),
    openSeaEnabled: getOpenSeaEnabled(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setParticipateInMetaMetrics: (val) =>
      dispatch(setParticipateInMetaMetrics(val)),
    setShowIncomingTransactionsFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('showIncomingTransactions', shouldShow)),
    setUsePhishDetect: (val) => dispatch(setUsePhishDetect(val)),
    setUseTokenDetection: (value) => {
      return dispatch(setUseTokenDetection(value));
    },
    setShowGasFeeEstimationBuySwapTokens: (value) => {
      return dispatch(setShowGasFeeEstimationBuySwapTokens(value));
    },
    setIpfsGateway: (value) => {
      return dispatch(setIpfsGateway(value));
    },
    setUseMultiAccountBalanceChecker: (value) => {
      return dispatch(setUseMultiAccountBalanceChecker(value));
    },
    setUseNftDetection: (val) => dispatch(setUseNftDetection(val)),
    setOpenSeaEnabled: (val) => dispatch(setOpenSeaEnabled(val)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SecurityTab);
