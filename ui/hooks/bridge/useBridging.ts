import { useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  type BridgeAsset,
  formatChainIdToCaip,
  type GenericQuoteRequest,
  getNativeAssetForChainId,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import {
  resetInputFields,
  trackUnifiedSwapBridgeEvent,
} from '../../ducks/bridge/actions';
import {
  getDataCollectionForMarketing,
  getIsBridgeChain,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
} from '../../selectors';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../shared/constants/metametrics';

import {
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../helpers/constants/routes';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { trace, TraceName } from '../../../shared/lib/trace';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP } from '../../../shared/constants/bridge';
import { getMultichainProviderConfig } from '../../selectors/multichain';
import { useCrossChainSwapsEventTracker } from './useCrossChainSwapsEventTracker';

const useBridging = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const providerConfig = useSelector(getMultichainProviderConfig);

  const isBridgeChain = useSelector((state) =>
    getIsBridgeChain(state, providerConfig?.chainId),
  );
  const openBridgeExperience = useCallback(
    (
      location: string,
      srcToken?: Pick<BridgeAsset, 'symbol' | 'address'> & {
        chainId: GenericQuoteRequest['srcChainId'];
      },
      isSwap = false,
    ) => {
      const token =
        srcToken ?? getNativeAssetForChainId(providerConfig.chainId);
      const isBridgeToken =
        token?.chainId &&
        ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP.includes(
          formatChainIdToCaip(token.chainId),
        );
      const isChainOrTokenSupported = isBridgeChain || isBridgeToken;

      if (!isChainOrTokenSupported || !providerConfig) {
        return;
      }

      trace({
        name: isSwap ? TraceName.SwapViewLoaded : TraceName.BridgeViewLoaded,
        startTime: Date.now(),
      });
      trackCrossChainSwapsEvent({
        event: MetaMetricsEventName.ActionButtonClicked,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          location:
            location === 'Home'
              ? MetaMetricsSwapsEventSource.MainView
              : MetaMetricsSwapsEventSource.TokenView,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id_source: formatChainIdToCaip(providerConfig.chainId),
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_source: token.symbol,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_address_source: token.address,
        },
      });
      trackEvent({
        event: isSwap
          ? MetaMetricsEventName.SwapLinkClicked
          : MetaMetricsEventName.BridgeLinkClicked,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: token.symbol,
          location,
          text: isSwap ? 'Swap' : 'Bridge',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: providerConfig.chainId,
        },
      });
      dispatch(
        trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.ButtonClicked, {
          location:
            location === 'Home'
              ? MetaMetricsSwapsEventSource.MainView
              : MetaMetricsSwapsEventSource.TokenView,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_source: token.symbol,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_destination: null,
        }),
      );
      dispatch(resetInputFields());
      let url = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;
      const assetId = toAssetId(
        token.address,
        formatChainIdToCaip(token.chainId ?? providerConfig.chainId),
      );
      url += `?${BridgeQueryParams.FROM}=${assetId}`;
      if (isSwap) {
        url += `&${BridgeQueryParams.SWAPS}=true`;
      }
      history.push(url);
    },
    [
      isBridgeChain,
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
