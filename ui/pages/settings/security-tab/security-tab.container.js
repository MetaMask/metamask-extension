import { connect } from 'react-redux';
import { compose } from 'redux';
import withRouterHooks from '../../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import {
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
  setSkipDeepLinkInterstitial,
  getMarketingConsent,
  setMarketingConsent,
} from '../../../store/actions';
import {
  getIsSecurityAlertsEnabled,
  getMetaMetricsDataDeletionId,
  getHDEntropyIndex,
  getPreferences,
  getIsSocialLoginFlow,
  getSocialLoginType,
  getParticipateInMetaMetrics,
  getDataCollectionForMarketing,
} from '../../../selectors';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { openBasicFunctionalityModal } from '../../../ducks/app/app';
import { getIsPrimarySeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import SecurityTab from './security-tab.component';

const mapStateToProps = (state) => {
  const { metamask } = state;

  const {
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

  const { skipDeepLinkInterstitial } = getPreferences(state);

  const networkConfigurations = getNetworkConfigurationsByChainId(state);

  return {
    networkConfigurations,
    participateInMetaMetrics: getParticipateInMetaMetrics(state),
    dataCollectionForMarketing: getDataCollectionForMarketing(state),
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
    securityAlertsEnabled: getIsSecurityAlertsEnabled(state),
    useTransactionSimulations: metamask.useTransactionSimulations,
    metaMetricsDataDeletionId: getMetaMetricsDataDeletionId(state),
    hdEntropyIndex: getHDEntropyIndex(state),
    skipDeepLinkInterstitial: Boolean(skipDeepLinkInterstitial),
    isSeedPhraseBackedUp: getIsPrimarySeedPhraseBackedUp(state),
    socialLoginEnabled: getIsSocialLoginFlow(state),
    socialLoginType: getSocialLoginType(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
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
    setSkipDeepLinkInterstitial: (val) =>
      dispatch(setSkipDeepLinkInterstitial(val)),
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
    getMarketingConsent: () => getMarketingConsent(),
    setMarketingConsent: (value) => dispatch(setMarketingConsent(value)),
  };
};

export default compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps),
)(SecurityTab);
