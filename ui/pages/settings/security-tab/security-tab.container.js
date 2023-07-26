import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  setFeatureFlag,
  setIpfsGateway,
  setParticipateInMetaMetrics,
  setUseCurrencyRateCheck,
  setUseMultiAccountBalanceChecker,
  setUsePhishDetect,
  setUseTokenDetection,
} from '../../../store/actions';
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
    ipfsGateway,
    useMultiAccountBalanceChecker,
    useCurrencyRateCheck,
  } = metamask;

  return {
    warning,
    showIncomingTransactions,
    participateInMetaMetrics,
    usePhishDetect,
    useTokenDetection,
    ipfsGateway,
    useMultiAccountBalanceChecker,
    useCurrencyRateCheck,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setParticipateInMetaMetrics: (val) =>
      dispatch(setParticipateInMetaMetrics(val)),
    setShowIncomingTransactionsFeatureFlag: (shouldShow) =>
      dispatch(setFeatureFlag('showIncomingTransactions', shouldShow)),
    setUsePhishDetect: (val) => dispatch(setUsePhishDetect(val)),
    setUseCurrencyRateCheck: (val) => dispatch(setUseCurrencyRateCheck(val)),
    setUseTokenDetection: (value) => {
      return dispatch(setUseTokenDetection(value));
    },
    setIpfsGateway: (value) => {
      return dispatch(setIpfsGateway(value));
    },
    setUseMultiAccountBalanceChecker: (value) => {
      return dispatch(setUseMultiAccountBalanceChecker(value));
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SecurityTab);
