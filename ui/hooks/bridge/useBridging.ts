import { useCallback, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { setBridgeFeatureFlags } from '../../ducks/bridge/actions';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  getCurrentKeyring,
  getDataCollectionForMarketing,
  getIsBridgeChain,
  getIsBridgeEnabled,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getUseExternalServices,
  SwapsEthToken,
  ///: END:ONLY_INCLUDE_IF
} from '../../selectors';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../shared/constants/metametrics';

import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
  ///: END:ONLY_INCLUDE_IF
} from '../../helpers/constants/routes';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { isHardwareKeyring } from '../../helpers/utils/hardware';
import { getPortfolioUrl } from '../../helpers/utils/portfolio';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import { getProviderConfig } from '../../../shared/modules/selectors/networks';
import { useCrossChainSwapsEventTracker } from './useCrossChainSwapsEventTracker';
///: END:ONLY_INCLUDE_IF

const useBridging = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const providerConfig = useSelector(getProviderConfig);
  const keyring = useSelector(getCurrentKeyring);
  const isExternalServicesEnabled = useSelector(getUseExternalServices);
  // @ts-expect-error keyring type is wrong maybe?
  const usingHardwareWallet = isHardwareKeyring(keyring.type);

  const isBridgeSupported = useSelector(getIsBridgeEnabled);
  const isBridgeChain = useSelector(getIsBridgeChain);

  useEffect(() => {
    if (isExternalServicesEnabled) {
      dispatch(setBridgeFeatureFlags());
    }
  }, [dispatch, setBridgeFeatureFlags]);

  const openBridgeExperience = useCallback(
    (
      location: string,
      token: SwapsTokenObject | SwapsEthToken,
      portfolioUrlSuffix?: string,
    ) => {
      if (!isBridgeChain || !providerConfig) {
        return;
      }

      if (isBridgeSupported) {
        trackCrossChainSwapsEvent({
          event: MetaMetricsEventName.ActionOpened,
          category: MetaMetricsEventCategory.Navigation,
          properties: {
            location:
              location === 'Home'
                ? MetaMetricsSwapsEventSource.MainView
                : MetaMetricsSwapsEventSource.TokenView,
            chain_id_source: providerConfig.chainId,
            token_symbol_source: token.symbol,
            token_address_source: token.address,
          },
        });
        trackEvent({
          event: MetaMetricsEventName.BridgeLinkClicked,
          category: MetaMetricsEventCategory.Navigation,
          properties: {
            token_symbol: token.symbol,
            location,
            text: 'Bridge',
            chain_id: providerConfig.chainId,
          },
        });
        history.push(
          `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}?token=${token.address.toLowerCase()}`,
        );
      } else {
        const portfolioUrl = getPortfolioUrl(
          'bridge',
          'ext_bridge_button',
          metaMetricsId,
          isMetaMetricsEnabled,
          isMarketingEnabled,
        );
        global.platform.openTab({
          url: `${portfolioUrl}${
            portfolioUrlSuffix ?? `&token=${token.address}`
          }`,
        });
        trackEvent({
          category: MetaMetricsEventCategory.Navigation,
          event: MetaMetricsEventName.BridgeLinkClicked,
          properties: {
            location,
            text: 'Bridge',
            url: portfolioUrl,
            chain_id: providerConfig.chainId,
            token_symbol: token.symbol,
          },
        });
      }
    },
    [
      isBridgeSupported,
      isBridgeChain,
      dispatch,
      usingHardwareWallet,
      history,
      metaMetricsId,
      trackEvent,
      trackCrossChainSwapsEvent,
      isMetaMetricsEnabled,
      isMarketingEnabled,
      providerConfig,
    ],
  );

  return { openBridgeExperience };
};

export default useBridging;
