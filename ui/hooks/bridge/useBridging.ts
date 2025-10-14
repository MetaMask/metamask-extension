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
    ) => {
      // If srcToken is a bridge token, use its assetId
      let srcAssetIdToUse =
        srcToken?.chainId &&
        ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(srcToken.chainId)
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
      const targetChainId = ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(
        lastSelectedChainId,
      )
        ? lastSelectedChainId
        : CHAIN_IDS.MAINNET;
      if (!srcAssetIdToUse && targetChainId !== providerConfig?.chainId) {
        srcAssetIdToUse = getNativeAssetForChainId(targetChainId)?.assetId;
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
          chain_id: srcToken?.chainId ?? lastSelectedChainId,
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
