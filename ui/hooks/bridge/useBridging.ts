import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  formatChainIdToCaip,
  type GenericQuoteRequest,
  getNativeAssetForChainId,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { parseCaipChainId } from '@metamask/utils';
import { MetaMetricsSwapsEventSource } from '../../../shared/constants/metametrics';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { trace, TraceName } from '../../../shared/lib/trace';
import { toAssetId } from '../../../shared/lib/asset-utils';
import { ALL_ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
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
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../helpers/constants/routes';
import {
  type MinimalAsset,
  validateMinimalAssetObject,
} from '../../pages/bridge/utils/tokens';

const useBridging = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
      srcToken?: {
        symbol: string;
        address: string;
        decimals?: number;
        name?: string;
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
      const navigationState: Partial<Record<'srcToken', MinimalAsset>> = {};

      const assetId =
        srcToken?.chainId && isChainIdEnabledForBridging(srcToken.chainId)
          ? toAssetId(srcToken.address, formatChainIdToCaip(srcToken.chainId))
          : undefined;
      if (srcToken && assetId) {
        // If srcToken is a bridge token, propagate it to the bridge experience
        const tokenToUse = {
          ...srcToken,
          assetId,
          name: srcToken.name ?? srcToken.symbol,
        };
        if (validateMinimalAssetObject(tokenToUse)) {
          navigationState.srcToken = tokenToUse;
        } else {
          // Otherwise, set the from param to use the bridge page's deep linking logic
          queryParams.push(`${BridgeQueryParams.FROM}=${assetId}`);
        }
      } else if (lastSelectedChainId !== fromChain.chainId) {
        // If an unsupported network is selected in the network filter, use bridge page's default fromChain
        const fallbackChainId = lastSelectedChainId ?? fromChain.chainId;
        const { namespace } = parseCaipChainId(fallbackChainId);
        // Use the bip44 default asset for the fallback chain if it is defined
        const bip44AssetId = Object.keys(
          bip44DefaultPairsConfig?.[namespace]?.standard ?? {},
        )[0];
        // Otherwise, use the native assetId
        const defaultAssetId =
          bip44AssetId ?? getNativeAssetForChainId(fallbackChainId)?.assetId;
        queryParams.push(`${BridgeQueryParams.FROM}=${defaultAssetId}`);
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
      lastSelectedChainId,
      fromChain?.chainId,
      isChainIdEnabledForBridging,
      bip44DefaultPairsConfig,
    ],
  );

  return { openBridgeExperience };
};

export default useBridging;
