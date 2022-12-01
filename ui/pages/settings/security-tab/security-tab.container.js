import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setFeatureFlag,
  setParticipateInMetaMetrics,
  setUsePhishDetect,
<<<<<<< HEAD
  setUseMultiAccountBalanceChecker,
=======
  setUseCurrencyRateCheck,
>>>>>>> 90219e20f (adding a new toggle to enable and disable conversion rate checking using thirdparty api)
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
    useMultiAccountBalanceChecker,
    useCurrencyRateCheck,
  } = metamask;

  return {
    warning,
    showIncomingTransactions,
    participateInMetaMetrics,
    usePhishDetect,
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
    setUseMultiAccountBalanceChecker: (val) =>
      dispatch(setUseMultiAccountBalanceChecker(val)),
    setUseCurrencyRateCheck: (val) => dispatch(setUseCurrencyRateCheck(val)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SecurityTab);
