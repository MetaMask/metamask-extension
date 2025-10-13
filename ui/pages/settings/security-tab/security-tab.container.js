import { connect } from 'react-redux';
import { compose } from 'redux';
import {
  PRODUCT_TYPES,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import withRouterHooks from '../../../helpers/higher-order-components/with-router-hooks/with-router-hooks';
import {
  setIpfsGateway,
  setIsIpfsGatewayEnabled,
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
  setParticipateInMetaMetrics,
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
import { getUserSubscriptions } from '../../../selectors/subscription';
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

  const { subscriptions } = getUserSubscriptions(state);
  // get shield subscription
  const shieldSubscription = subscriptions.find((subscription) =>
    subscription.products.some(
      (product) => product.name === PRODUCT_TYPES.SHIELD,
    ),
  );

  const hasActiveShieldSubscription = [
    SUBSCRIPTION_STATUSES.active,
    SUBSCRIPTION_STATUSES.trialing,
    SUBSCRIPTION_STATUSES.provisional,
  ].includes(shieldSubscription?.status);

  return {
    networkConfigurations,
    participateInMetaMetrics: getParticipateInMetaMetrics(state),
    dataCollectionForMarketing: getDataCollectionForMarketing(state),
    usePhishDetect,
    useTokenDetection,
    hasActiveShieldSubscription,
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
