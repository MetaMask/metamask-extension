import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  setIncomingTransactionsPreferences,
  setIpfsGateway,
  setIsIpfsGatewayEnabled,
  setParticipateInMetaMetrics,
  setUseCurrencyRateCheck,
  setUseMultiAccountBalanceChecker,
  setUsePhishDetect,
  setUseTokenDetection,
  setUseAddressBarEnsResolution,
  setOpenSeaEnabled,
  setUseNftDetection,
  setUse4ByteResolution,
  setUseSafeChainsListValidation,
  setUseExternalNameSources,
  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  setSecurityAlertsEnabled,
  ///: END:ONLY_INCLUDE_IF
  setTransactionSecurityCheckEnabled,
} from '../../../store/actions';
import {
  getAllNetworks,
  ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
  getIsSecurityAlertsEnabled,
  ///: END:ONLY_INCLUDE_IF
  getIsTransactionSecurityCheckEnabled,
  getPetnamesEnabled,
} from '../../../selectors';
import SecurityTab from './security-tab.component';

const mapStateToProps = (state) => {
  const {
    appState: { warning },
    metamask,
  } = state;

  const petnamesEnabled = getPetnamesEnabled(state);

  const {
    incomingTransactionsPreferences,
    participateInMetaMetrics,
    usePhishDetect,
    useTokenDetection,
    ipfsGateway,
    useMultiAccountBalanceChecker,
    useSafeChainsListValidation,
    useCurrencyRateCheck,
    useAddressBarEnsResolution,
    openSeaEnabled,
    useNftDetection,
    use4ByteResolution,
    useExternalNameSources,
  } = metamask;

  const allNetworks = getAllNetworks(state);

  return {
    warning,
    incomingTransactionsPreferences,
    allNetworks,
    participateInMetaMetrics,
    usePhishDetect,
    useTokenDetection,
    ipfsGateway,
    useMultiAccountBalanceChecker,
    useSafeChainsListValidation,
    useCurrencyRateCheck,
    useAddressBarEnsResolution,
    openSeaEnabled,
    useNftDetection,
    use4ByteResolution,
    useExternalNameSources,
    petnamesEnabled,
    transactionSecurityCheckEnabled:
      getIsTransactionSecurityCheckEnabled(state),
    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    securityAlertsEnabled: getIsSecurityAlertsEnabled(state),
    ///: END:ONLY_INCLUDE_IF
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setIncomingTransactionsPreferences: (chainId, value) =>
      dispatch(setIncomingTransactionsPreferences(chainId, value)),
    setParticipateInMetaMetrics: (val) =>
      dispatch(setParticipateInMetaMetrics(val)),
    setUsePhishDetect: (val) => dispatch(setUsePhishDetect(val)),
    setUseCurrencyRateCheck: (val) => dispatch(setUseCurrencyRateCheck(val)),
    setUseTokenDetection: (val) => dispatch(setUseTokenDetection(val)),
    setIpfsGateway: (val) => dispatch(setIpfsGateway(val)),
    setIsIpfsGatewayEnabled: (val) => dispatch(setIsIpfsGatewayEnabled(val)),
    setUseMultiAccountBalanceChecker: (val) =>
      dispatch(setUseMultiAccountBalanceChecker(val)),
    setUseAddressBarEnsResolution: (val) =>
      dispatch(setUseAddressBarEnsResolution(val)),
    setUseSafeChainsListValidation: (val) =>
      dispatch(setUseSafeChainsListValidation(val)),
    setOpenSeaEnabled: (val) => dispatch(setOpenSeaEnabled(val)),
    setUseNftDetection: (val) => dispatch(setUseNftDetection(val)),
    setUse4ByteResolution: (value) => {
      return dispatch(setUse4ByteResolution(value));
    },
    setUseExternalNameSources: (value) => {
      return dispatch(setUseExternalNameSources(value));
    },
    setTransactionSecurityCheckEnabled: (value) =>
      dispatch(setTransactionSecurityCheckEnabled(value)),
    ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
    setSecurityAlertsEnabled: (value) => setSecurityAlertsEnabled(value),
    ///: END:ONLY_INCLUDE_IF
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SecurityTab);
