import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  FeatureId,
  formatChainIdToCaip,
  GenericQuoteRequest,
  getNativeAssetForChainId,
  isCrossChain,
  UnifiedSwapBridgeEventName,
  MetaMetricsSwapsEventSource,
} from '@metamask/bridge-controller';
import { parseCaipChainId } from '@metamask/utils';
import { MetaMetricsSwapsEventSource as ExtendedMetaMetricsSwapsEventSource } from '../../../shared/constants/metametrics';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { toAssetId } from '../../../shared/lib/asset-utils';
import {
  getBip44DefaultPairsConfig,
  getFromChain,
  getFromChains,
  getLastSelectedChainId,
} from '../../ducks/bridge/selectors';
import {
  resetInputFields,
  setBridgeLocation,
  trackUnifiedSwapBridgeEvent,
} from '../../ducks/bridge/actions';
import { validateMinimalAssetObject } from '../../pages/bridge/utils/tokens';
import { isSupportedBridgeChain } from '../../ducks/bridge/utils';
import { useDispatch } from '../../store/hooks';

import {
  BridgeNavigationOptions,
  useBridgeNavigation,
} from './useBridgeNavigation';

/**
 * Default source asset for a chain the network filter selected.
 * Namespace bip44 pairs only describe one chain (Ethereum Mainnet for EVM).
 *
 * @param fallbackChainId - Chain selected in the network filter, or the provider chain.
 * @param bip44DefaultPairsConfig - Remote default pairs keyed by CAIP namespace.
 * @returns CAIP-19 asset id, when one can be resolved.
 */
const getDefaultFromAssetId = (
  fallbackChainId: string,
  bip44DefaultPairsConfig: ReturnType<typeof getBip44DefaultPairsConfig>,
): string | undefined => {
  const formattedChainId = formatChainIdToCaip(fallbackChainId);
  const { namespace } = parseCaipChainId(formattedChainId);
  const bip44AssetId = Object.keys(
    bip44DefaultPairsConfig?.[namespace]?.standard ?? {},
  )[0];

  const bip44ChainId = bip44AssetId?.split('/')[0];
  if (bip44ChainId && !isCrossChain(bip44ChainId, formattedChainId)) {
    return bip44AssetId;
  }

  try {
    return getNativeAssetForChainId(formattedChainId)?.assetId;
  } catch {
    return undefined;
  }
};

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

  const isChainIdEnabledForBridging = useCallback(
    (chainId: string | number) =>
      isSupportedBridgeChain(chainId) &&
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
   * @param sourceToken - the token to set as the source token for the bridge experience
   * @param destTokenAssetId - the destination token asset id to set for the bridge experience
   */
  const openBridgeExperience = useCallback(
    (
      location:
        | MetaMetricsSwapsEventSource
        | ExtendedMetaMetricsSwapsEventSource,
      sourceToken?: {
        symbol: string;
        address: string;
        decimals?: number;
        name?: string;
        chainId: GenericQuoteRequest['srcChainId'];
      },
      destTokenAssetId?: string,
    ) => {
      !bridgeState && dispatch(resetInputFields());
      // TODO: pick the correct location type
      dispatch(setBridgeLocation(location as MetaMetricsSwapsEventSource));
      dispatch(
        trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.ButtonClicked, {
          location: location as never,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_source: sourceToken?.symbol ?? 'ETH',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol_destination: '',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: getEnvironmentType(),
        }),
      );

      let tokenToUse: BridgeNavigationOptions['state']['token'] = null;
      const search = new URLSearchParams('');

      /**
       * Defined if the token is a valid src or dest token
       */
      const assetId =
        sourceToken?.chainId && isSupportedBridgeChain(sourceToken.chainId)
          ? toAssetId(
              sourceToken.address,
              formatChainIdToCaip(sourceToken.chainId),
            )
          : undefined;

      if (sourceToken && assetId) {
        // If token is supported for bridging, propagate it to the bridge experience
        const tokenWithAssetId = {
          ...sourceToken,
          assetId,
          name: sourceToken.name ?? sourceToken.symbol,
          chainId: formatChainIdToCaip(sourceToken.chainId),
        };
        if (validateMinimalAssetObject(tokenWithAssetId)) {
          tokenToUse = tokenWithAssetId;
        } else if (
          !bridgeState &&
          isChainIdEnabledForBridging(sourceToken.chainId)
        ) {
          // If bridgeState is defined, it means the user is returning to the bridge page
          // If the token is not in an enabled chain then it can't be used as the source token
          // Otherwise, set the `from` query param to use the bridge page's deep linking logic
          search.set(BridgeQueryParams.From, assetId);
        }
      } else if (
        !lastSelectedChainId ||
        isCrossChain(lastSelectedChainId, fromChain.chainId)
      ) {
        // The network filter is the source chain. bip44DefaultPairs has one
        // pair per namespace, and the EVM pair is Ethereum Mainnet, so other
        // EVM chains use their own native asset.
        const fallbackChainId = lastSelectedChainId ?? fromChain.chainId;
        const defaultAssetId = getDefaultFromAssetId(
          fallbackChainId,
          bip44DefaultPairsConfig,
        );
        if (defaultAssetId) {
          search.set(BridgeQueryParams.From, defaultAssetId);
        }
      }

      if (destTokenAssetId) {
        search.set(BridgeQueryParams.To, destTokenAssetId);
      }

      if (location === MetaMetricsSwapsEventSource.TransactionShield) {
        search.set(BridgeQueryParams.IsFromTransactionShield, 'true');
      }

      navigateToBridgePage({
        token: tokenToUse,
        search,
        isEntrypoint: true,
        entryPoint: location,
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
