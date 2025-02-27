import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  setIncomingTransactionsPreferences,
  setIpfsGateway,
  setIsIpfsGatewayEnabled,
  setParticipateInMetaMetrics,
  setDataCollectionForMarketing,
  setUseCurrencyRateCheck,
  setUseMultiAccountBalanceChecker,
  setUsePhishDetect,
  setUseTokenDetection,
  toggleExternalServices,
  setUseAddressBarEnsResolution,
  setOpenSeaEnabled,
  setUseNftDetection,
  setUse4ByteResolution,
  setUseSafeChainsListValidation,
  setUseExternalNameSources,
  setUseTransactionSimulations,
  setSecurityAlertsEnabled,
  updateDataDeletionTaskStatus,
} from '../../../store/actions';
import {
  getIsSecurityAlertsEnabled,
  getMetaMetricsDataDeletionId,
  getPetnamesEnabled,
} from '../../../selectors/selectors';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { openBasicFunctionalityModal } from '../../../ducks/app/app';
///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
import { getMetaMaskHdKeyrings } from '../../../selectors';
///: END:ONLY_INCLUDE_IF
import SecurityTab from './security-tab.component';

const mapStateToProps = (state) => {
  const { metamask } = state;

  const petnamesEnabled = getPetnamesEnabled(state);

  const {
    incomingTransactionsPreferences,
    participateInMetaMetrics,
    dataCollectionForMarketing,
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
    useExternalServices,
    useExternalNameSources,
  } = metamask;

  const networkConfigurations = getNetworkConfigurationsByChainId(state);

  ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
  const hasMultipleHdKeyrings = getMetaMaskHdKeyrings(state).length > 1;
  ///: END:ONLY_INCLUDE_IF

  return {
    incomingTransactionsPreferences,
    networkConfigurations,
    participateInMetaMetrics,
    dataCollectionForMarketing,
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
    useExternalServices,
    petnamesEnabled,
    securityAlertsEnabled: getIsSecurityAlertsEnabled(state),
    useTransactionSimulations: metamask.useTransactionSimulations,
    metaMetricsDataDeletionId: getMetaMetricsDataDeletionId(state),
    ///: BEGIN:ONLY_INCLUDE_IF(multi-srp)
    hasMultipleHdKeyrings,
    ///: END:ONLY_INCLUDE_IF
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setIncomingTransactionsPreferences: (chainId, value) =>
      dispatch(setIncomingTransactionsPreferences(chainId, value)),
    setParticipateInMetaMetrics: (val) =>
      dispatch(setParticipateInMetaMetrics(val)),
    setDataCollectionForMarketing: (val) =>
      dispatch(setDataCollectionForMarketing(val)),
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
    setBasicFunctionalityModalOpen: () =>
      dispatch(openBasicFunctionalityModal()),
    setOpenSeaEnabled: (val) => dispatch(setOpenSeaEnabled(val)),
    setUseNftDetection: (val) => dispatch(setUseNftDetection(val)),
    setUse4ByteResolution: (value) => {
      return dispatch(setUse4ByteResolution(value));
    },
    setUseExternalNameSources: (value) => {
      return dispatch(setUseExternalNameSources(value));
    },
    toggleExternalServices: (value) => {
      return dispatch(toggleExternalServices(value));
    },
    setUseTransactionSimulations: (value) => {
      return dispatch(setUseTransactionSimulations(value));
    },
    updateDataDeletionTaskStatus: () => {
      return updateDataDeletionTaskStatus();
    },
    setSecurityAlertsEnabled: (value) => setSecurityAlertsEnabled(value),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(SecurityTab);
