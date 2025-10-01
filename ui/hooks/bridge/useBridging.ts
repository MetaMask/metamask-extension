import { useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  type BridgeAsset,
  ChainId,
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
import {
  ALLOWED_BRIDGE_CHAIN_IDS,
  ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP,
  AllowedBridgeChainIds,
} from '../../../shared/constants/bridge';
import { getLastSelectedChainId } from '../../ducks/bridge/selectors';
import { getMultichainProviderConfig } from '../../selectors/multichain';
import { CHAIN_IDS } from '../../../shared/constants/network';

const useBridging = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const lastSelectedChainId = useSelector(getLastSelectedChainId);
  const providerConfig = useSelector(getMultichainProviderConfig);

  const openBridgeExperience = useCallback(
    (
      location: MetaMetricsSwapsEventSource | 'Carousel',
      srcToken?: Pick<BridgeAsset, 'symbol' | 'address'> & {
        chainId: GenericQuoteRequest['srcChainId'];
      },
      isSwap = false,
    ) => {
      let srcAssetIdToUse = srcToken
        ? toAssetId(srcToken.address, formatChainIdToCaip(srcToken.chainId))
        : undefined;

      const isBridgeToken =
        srcToken?.chainId &&
        ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP.includes(
          formatChainIdToCaip(srcToken.chainId),
        );

      const chainIdToUse = srcToken?.chainId ?? lastSelectedChainId;
      const isBridgeChain = [
        ...ALLOWED_BRIDGE_CHAIN_IDS,
        ...ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP,
        ...Object.values(ChainId),
      ].includes(chainIdToUse as AllowedBridgeChainIds);

      // TODO remove this after fromChain is moved to bridge redux store
      // if lastSelectedChainId is not active and a srcToken is not specified
      // set the srcAssetId to the native asset for the chain so the bridge experience
      // sets correct defaults: srctoken.chainId > lastSelectedId > MAINNET
      if (
        !srcToken &&
        (chainIdToUse !== providerConfig?.chainId || !isBridgeChain)
      ) {
        // When a testnet or any unsupported network is selected in the network filter
        // use MAINNET as a fallback
        srcAssetIdToUse = getNativeAssetForChainId(
          isBridgeChain ? chainIdToUse : CHAIN_IDS.MAINNET,
        )?.assetId;
      }

      if (!(isBridgeChain || isBridgeToken || srcAssetIdToUse)) {
        return;
      }

      trace({
        name: isSwap ? TraceName.SwapViewLoaded : TraceName.BridgeViewLoaded,
        startTime: Date.now(),
      });
      trackEvent({
        event: isSwap
          ? MetaMetricsEventName.SwapLinkClicked
          : MetaMetricsEventName.BridgeLinkClicked,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: srcToken?.symbol ?? '',
          location,
          text: isSwap ? 'Swap' : 'Bridge',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: chainIdToUse,
        },
      });
      dispatch(
        trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.ButtonClicked, {
          location: location as never,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_source: srcToken?.symbol ?? '',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_destination: '',
        }),
      );
      dispatch(resetInputFields());
      let url = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;
      url += '?';
      if (srcAssetIdToUse) {
        url += `${BridgeQueryParams.FROM}=${srcAssetIdToUse}`;
      }
      if (isSwap) {
        url += `&${BridgeQueryParams.SWAPS}=true`;
      }
      history.push(url);
    },
    [
      history,
      metaMetricsId,
      trackEvent,
      isMetaMetricsEnabled,
      isMarketingEnabled,
      lastSelectedChainId,
      providerConfig?.chainId,
    ],
  );

  return { openBridgeExperience };
};

export default useBridging;
