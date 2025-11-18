import { useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  type BridgeAsset,
  formatChainIdToCaip,
  type GenericQuoteRequest,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { isCaipChainId } from '@metamask/utils';
import {
  resetInputFields,
  setFromToken,
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
import { ALL_ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import {
  getFromChain,
  getFromChains,
  getLastSelectedChain,
} from '../../ducks/bridge/selectors';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { getMultichainProviderConfig } from '../../selectors/multichain';

const useBridging = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const lastSelectedChain = useSelector(getLastSelectedChain);
  const fromChain = useSelector(getFromChain);
  const fromChains = useSelector(getFromChains);
  /**
   * @deprecated
   */
  const providerConfig = useSelector(getMultichainProviderConfig);

  const isChainIdEnabledForBridging = useCallback(
    (chainId: string | number) =>
      ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(chainId) &&
      fromChains.some(
        (chain) =>
          formatChainIdToCaip(chain.chainId) === formatChainIdToCaip(chainId),
      ),
    [fromChains],
  );

  const openBridgeExperience = useCallback(
    (
      location: MetaMetricsSwapsEventSource | 'Carousel',
      srcToken?: Pick<BridgeAsset, 'symbol' | 'address'> & {
        chainId: GenericQuoteRequest['srcChainId'];
      },
    ) => {
      // If srcToken is a bridge token, use its assetId
      const srcAssetIdToUse =
        srcToken?.chainId && isChainIdEnabledForBridging(srcToken.chainId)
          ? toAssetId(srcToken.address, formatChainIdToCaip(srcToken.chainId))
          : undefined;

      /* If srcToken is not in a supported bridge chain, or is not specified
       * and the selected network filter is not active, set the srcAssetId to
       * a supported bridge native asset
       *
       * If an unsupported network is selected in the network filter, fall back to MAINNET
       *
       * default fromChain: srctoken.chainId > lastSelectedId > MAINNET
       */
      const targetChainIdInCaip =
        lastSelectedChain?.chainId &&
        isChainIdEnabledForBridging(lastSelectedChain.chainId)
          ? formatChainIdToCaip(lastSelectedChain.chainId)
          : 'eip155:1';

      const providerChainIdInCaip = isCaipChainId(providerConfig?.chainId)
        ? providerConfig?.chainId
        : toEvmCaipChainId(providerConfig?.chainId);
      if (!srcAssetIdToUse && targetChainIdInCaip !== providerChainIdInCaip) {
        // If the selectedNetwork is not supported or if the network filter is not the active network, set this so the bridge-api sets the network on load
        // TODO should this just set fromChain directly?
        dispatch(setFromToken({ chainId: targetChainIdInCaip }));
        // srcAssetIdToUse = getNativeAssetForChainId(targetChainIdInCaip)?.assetId;
      }

      trace({
        name: TraceName.SwapViewLoaded,
        startTime: Date.now(),
      });
      trackEvent({
        event: MetaMetricsEventName.SwapLinkClicked,
        category: MetaMetricsEventCategory.Navigation,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: srcToken?.symbol ?? '',
          location,
          text: 'Swap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id:
            srcToken?.chainId ??
            lastSelectedChain?.chainId ??
            CHAIN_IDS.MAINNET,
        },
      });
      dispatch(
        trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.ButtonClicked, {
          location: location as never,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_source: srcToken?.symbol ?? 'ETH',
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

      if (location === MetaMetricsSwapsEventSource.TransactionShield) {
        url += `${srcAssetIdToUse ? '&' : ''}isFromTransactionShield=true`;
      }

      navigate(url);
    },
    [
      navigate,
      metaMetricsId,
      trackEvent,
      isMetaMetricsEnabled,
      isMarketingEnabled,
      fromChain?.chainId,
      lastSelectedChain?.chainId,
      providerConfig?.chainId,
      isChainIdEnabledForBridging,
    ],
  );

  return { openBridgeExperience };
};

export default useBridging;
