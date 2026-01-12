import { useCallback, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  type BridgeAsset,
  formatChainIdToCaip,
  type GenericQuoteRequest,
  getNativeAssetForChainId,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { CaipAssetTypeStruct, parseCaipChainId } from '@metamask/utils';
import { MetaMetricsSwapsEventSource } from '../../../shared/constants/metametrics';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { trace, TraceName } from '../../../shared/lib/trace';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { ALL_ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  getBip44DefaultPairsConfig,
  getFromChain,
  getFromChains,
  getLastSelectedChainId,
} from '../../ducks/bridge/selectors';
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
import type { BridgeToken } from '../../ducks/bridge/types';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../helpers/constants/routes';

const useBridging = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const lastSelectedChainId = useSelector(getLastSelectedChainId);
  const fromChain = useSelector(getFromChain);
  const fromChains = useSelector(getFromChains);
  const bip44DefaultPairsConfig = useSelector(getBip44DefaultPairsConfig);

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
      srcToken?: Pick<
        BridgeAsset,
        'symbol' | 'address' | 'decimals' | 'name'
      > & {
        chainId: GenericQuoteRequest['srcChainId'];
      },
    ) => {
      dispatch(resetInputFields());
      trace({
        name: TraceName.SwapViewLoaded,
        startTime: Date.now(),
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

      const queryParams = [];
      const navigationState: Partial<Record<'srcToken', Partial<BridgeToken>>> =
        {};

      // If an unsupported network is selected in the network filter, set a fallback chainId
      const fallbackChainId =
        lastSelectedChainId && isChainIdEnabledForBridging(lastSelectedChainId)
          ? lastSelectedChainId
          : formatChainIdToCaip(CHAIN_IDS.MAINNET);

      // If srcToken is a bridge token, propagate it to the bridge experience
      if (srcToken?.chainId && isChainIdEnabledForBridging(srcToken.chainId)) {
        const assetId = toAssetId(
          srcToken.address,
          formatChainIdToCaip(srcToken.chainId),
        );
        if (assetId) {
          navigationState.srcToken = {
            ...srcToken,
            chainId: formatChainIdToCaip(srcToken.chainId),
            assetId,
          };
        }
      } else if (fallbackChainId !== fromChain.chainId) {
        /* If srcToken is not supported or is not specified
         * and the selected network filter is not active
         * set the srcAssetId to a supported bridge native asset
         *
         * default fromChain: srctoken.chainId > lastSelectedId > MAINNET
         */
        const { namespace } = parseCaipChainId(fallbackChainId);
        const defaultBip44AssetId = Object.keys(
          bip44DefaultPairsConfig?.[namespace]?.standard ?? {},
        )[0];
        queryParams.push(
          `${BridgeQueryParams.FROM}=${
            defaultBip44AssetId
              ? CaipAssetTypeStruct.create(defaultBip44AssetId)
              : getNativeAssetForChainId(fallbackChainId)?.assetId
          }`,
        );
      }

      if (location === MetaMetricsSwapsEventSource.TransactionShield) {
        queryParams.push('isFromTransactionShield=true');
      }

      const url = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;
      navigate([url, queryParams.join('&')].filter(Boolean).join('?'), {
        state: navigationState,
      });
    },
    [
      navigate,
      metaMetricsId,
      trackEvent,
      isMetaMetricsEnabled,
      isMarketingEnabled,
      lastSelectedChainId,
      fromChain?.chainId,
      isChainIdEnabledForBridging,
      bip44DefaultPairsConfig,
    ],
  );

  return { openBridgeExperience };
};

export default useBridging;
