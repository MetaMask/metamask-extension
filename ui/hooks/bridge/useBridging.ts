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
import { CHAIN_IDS } from '../../../shared/constants/network';
import { ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP } from '../../../shared/constants/bridge';
import { getMultichainProviderConfig } from '../../selectors/multichain';
import { getDefaultTokenPair } from '../../ducks/bridge/selectors';
import { getDefaultToToken, toBridgeToken } from '../../ducks/bridge/utils';

const useBridging = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const providerConfig = useSelector(getMultichainProviderConfig);

  const isBridgeChain = useSelector((state) =>
    getIsBridgeChain(state, providerConfig?.chainId),
  );

  const defaultTokenPair = useSelector(getDefaultTokenPair);

  const openBridgeExperience = useCallback(
    (
      location: MetaMetricsSwapsEventSource | 'Carousel',
      srcToken?: Pick<BridgeAsset, 'symbol' | 'address'> & {
        chainId: GenericQuoteRequest['srcChainId'];
      },
      isSwap = false,
    ) => {
      const [defaultBip44SrcAssetId, defaultBip44DestAssetId] =
        defaultTokenPair ?? [];

      const srcAssetIdToUse =
        (srcToken
          ? toAssetId(
              srcToken.address,
              formatChainIdToCaip(srcToken.chainId ?? providerConfig.chainId),
            )
          : defaultBip44SrcAssetId) ??
        // If neither the srcAsset or default BIP44 default pair are present
        // use the native asset for Ethereum mainnet
        // This should only happen if the feature flags are unavailable and the
        // user clicks on Swap from the home page
        getNativeAssetForChainId(CHAIN_IDS.MAINNET)?.assetId;

      // If srcToken is present, use the default dest token for that chain
      const destAssetIdToUse = srcToken?.chainId
        ? toBridgeToken(
            getDefaultToToken(formatChainIdToCaip(srcToken.chainId), srcToken),
          )?.assetId
        : defaultBip44DestAssetId;

      const isBridgeToken =
        srcToken?.chainId &&
        ALLOWED_BRIDGE_CHAIN_IDS_IN_CAIP.includes(
          formatChainIdToCaip(srcToken.chainId),
        );

      const isChainOrTokenSupported =
        isBridgeChain || isBridgeToken || srcAssetIdToUse;

      if (!isChainOrTokenSupported || !providerConfig) {
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
          token_symbol: srcToken?.symbol ?? defaultBip44SrcAssetId ?? '',
          location,
          text: isSwap ? 'Swap' : 'Bridge',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: providerConfig.chainId,
        },
      });
      dispatch(
        trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.ButtonClicked, {
          location: location as never,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_source: srcToken?.symbol ?? defaultBip44SrcAssetId ?? '',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_destination: destAssetIdToUse ?? '',
        }),
      );
      dispatch(resetInputFields());
      let url = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;
      if (srcAssetIdToUse) {
        url += `?${BridgeQueryParams.FROM}=${srcAssetIdToUse}`;
      }
      if (destAssetIdToUse) {
        url += `&${BridgeQueryParams.TO}=${destAssetIdToUse}`;
      }
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
      isMetaMetricsEnabled,
      isMarketingEnabled,
      providerConfig,
      defaultTokenPair,
    ],
  );

  return { openBridgeExperience };
};

export default useBridging;
