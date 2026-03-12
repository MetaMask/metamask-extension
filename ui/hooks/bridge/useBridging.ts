import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  formatChainIdToCaip,
  GenericQuoteRequest,
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
  resetBridgeControllerAndCache,
  resetInputFields,
  trackUnifiedSwapBridgeEvent,
} from '../../ducks/bridge/actions';
import { validateMinimalAssetObject } from '../../pages/bridge/utils/tokens';
import {
  BridgeNavigationOptions,
  useBridgeNavigation,
} from './useBridgeNavigation';

/**
 * This hook is the entrypoint for the bridge experience
 *
 * @returns a function to navigate to the bridge page
 */
const useBridging = () => {
  const dispatch = useDispatch();

  const { navigateToBridgePage, bridgeState } = useBridgeNavigation();
  const lastSelectedChainId = useSelector(getLastSelectedChainId);
  const fromChain = useSelector(getFromChain);
  const fromChains = useSelector(getFromChains);
  const bip44DefaultPairsConfig = useSelector(getBip44DefaultPairsConfig);

  const isChainIdSupportedForBridging = (chainId: string | number) =>
    ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(chainId);

  const isChainIdEnabledForBridging = useCallback(
    (chainId: string | number) =>
      isChainIdSupportedForBridging(chainId) &&
      fromChains.some(
        (chain) =>
          formatChainIdToCaip(chain.chainId) === formatChainIdToCaip(chainId),
      ),
    [fromChains],
  );

  /**
   * Navigates to the bridge page
   *
   * @param location - the entrypoint from which the bridge experience was triggered
   * @param token - the token to set as the source token for the bridge experience
   */
  const openBridgeExperience = useCallback(
    (
      location: MetaMetricsSwapsEventSource | 'Carousel',
      token?: {
        symbol: string;
        address: string;
        decimals?: number;
        name?: string;
        chainId: GenericQuoteRequest['srcChainId'];
      },
    ) => {
      dispatch(resetInputFields());
      dispatch(resetBridgeControllerAndCache());
      trace({
        name: TraceName.SwapViewLoaded,
        startTime: Date.now(),
      });
      dispatch(
        trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.ButtonClicked, {
          location: location as never,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_source: token?.symbol ?? 'ETH',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_destination: '',
        }),
      );

      let tokenToUse: BridgeNavigationOptions['state']['token'] = null;
      const search = new URLSearchParams('');

      /**
       * Defined if the token is a valid src or dest token
       */
      const assetId =
        token?.chainId && isChainIdSupportedForBridging(token.chainId)
          ? toAssetId(token.address, formatChainIdToCaip(token.chainId))
          : undefined;

      if (token && assetId) {
        // If token is supported for bridging, propagate it to the bridge experience
        const tokenWithAssetId = {
          ...token,
          assetId,
          name: token.name ?? token.symbol,
          chainId: formatChainIdToCaip(token.chainId),
        };
        if (validateMinimalAssetObject(tokenWithAssetId)) {
          tokenToUse = tokenWithAssetId;
        } else if (!bridgeState && isChainIdEnabledForBridging(token.chainId)) {
          // If bridgeState is defined, it means the user is returning to the bridge page
          // If the token is not in an enabled chain then it can't be used as the source token
          // Otherwise, set the `from` query param to use the bridge page's deep linking logic
          search.set(BridgeQueryParams.From, assetId);
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
        search.set(BridgeQueryParams.From, defaultAssetId);
      }

      if (location === MetaMetricsSwapsEventSource.TransactionShield) {
        search.set(BridgeQueryParams.IsFromTransactionShield, 'true');
      }

      navigateToBridgePage({
        token: tokenToUse,
        search,
        isEntrypoint: true,
      });
    },
    [
      navigateToBridgePage,
      lastSelectedChainId,
      fromChain?.chainId,
      isChainIdEnabledForBridging,
      bip44DefaultPairsConfig,
      bridgeState,
      dispatch,
    ],
  );

  return { openBridgeExperience };
};

export default useBridging;
