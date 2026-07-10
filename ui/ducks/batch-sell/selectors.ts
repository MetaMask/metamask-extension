import { createSelector } from 'reselect';
import {
  Hex,
  hexToBigInt,
  KnownCaipNamespace,
  parseCaipAssetType,
  type CaipAssetType,
  type CaipChainId,
} from '@metamask/utils';
import {
  MultichainNetworkConfiguration,
  toEvmCaipChainId,
} from '@metamask/multichain-network-controller';
import { isEvmAccountType } from '@metamask/keyring-api';
import {
  formatChainIdToCaip,
  formatChainIdToHex,
  getNativeAssetForChainId,
  selectBatchSellQuotes,
  selectBatchSellTrades,
  selectMinimumBalanceForRentExemptionInSOL,
} from '@metamask/bridge-controller';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../shared/constants/network';
import { convertCaipToHexChainId } from '../../../shared/lib/network.utils';
import {
  getAssetsBySelectedAccountGroup,
  getAssetsRates,
} from '../../selectors/assets';
import {
  getAllMultichainNetworkConfigurations,
  getMarketData,
} from '../../selectors';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import {
  getAssetImageUrl,
  isEvmChainId,
  toAssetId,
} from '../../../shared/lib/asset-utils';
import {
  computeQuoteValidationErrors,
  getBridgeFeatureFlags,
  getPriceImpactThresholds,
  type BridgeAppState,
} from '../bridge/selectors';
import { getBridgeAssetsByAssetId } from '../bridge/asset-selectors';
import { getSelectedAccountGroup } from '../../selectors/multichain-accounts/account-tree';
import { QuoteValidationErrors, type BridgeToken } from '../bridge/types';
import { createDeepEqualSelector } from '../../../shared/lib/selectors/selector-creators';
import { isHardwareWallet } from '../../../shared/lib/selectors/keyring';
import {
  BATCH_SELL_DEST_STABLECOIN_METADATA,
  BATCH_SELL_SUPPORTED_CHAIN_IDS,
  ONDO_TOKENIZED_TOKEN_NAME,
} from '../../../shared/constants/batch-sell';
import { isStockRWAToken } from '../../pages/bridge/hooks/useRWAToken';
import { BatchSellAsset } from './types';

/**
 * Returns all available multichain network configurations for the currently
 * selected account. EVM accounts support all EVM networks; non-EVM accounts
 * only support the networks listed in their declared CAIP-2 scopes.
 */
const getNetworksForSelectedAccount = createSelector(
  getAllMultichainNetworkConfigurations,
  getSelectedInternalAccount,
  (
    allNetworks,
    selectedAccount,
  ): Record<CaipChainId, MultichainNetworkConfiguration> => {
    if (!selectedAccount) {
      return {};
    }
    if (isEvmAccountType(selectedAccount.type)) {
      // EVM accounts support all EVM (eip155:*) networks
      return Object.fromEntries(
        Object.entries(allNetworks).filter(([chainId]) =>
          chainId.startsWith(`${KnownCaipNamespace.Eip155}:`),
        ),
      ) as Record<CaipChainId, MultichainNetworkConfiguration>;
    }
    // Non-EVM accounts: filter to only their declared scopes
    const accountScopes = new Set(selectedAccount.scopes ?? []);
    return Object.fromEntries(
      Object.entries(allNetworks).filter(([chainId]) =>
        accountScopes.has(chainId as CaipChainId),
      ),
    ) as Record<CaipChainId, MultichainNetworkConfiguration>;
  },
);

const getChainsWithPositiveBalanceForSelectedAccount = createSelector(
  getAssetsBySelectedAccountGroup,
  (assetsByChain): Set<CaipChainId> => {
    return new Set(
      Object.entries(assetsByChain)
        .filter(([, assets]) =>
          assets.some((asset) => hexToBigInt(asset.rawBalance) > 0n),
        )
        .map(([chainId]) => {
          // EVM assets use hex keys (e.g. "0x1"), convert to CAIP (e.g. "eip155:1")
          if (isEvmChainId(chainId as Hex)) {
            return toEvmCaipChainId(chainId as Hex);
          }
          return chainId as CaipChainId;
        }),
    );
  },
);

const getNetworksWithPositiveBalanceForSelectedAccount = createSelector(
  getNetworksForSelectedAccount,
  getChainsWithPositiveBalanceForSelectedAccount,
  (networksForAccount, chainsWithBalance) =>
    Object.fromEntries(
      Object.entries(networksForAccount).filter(([chainId]) =>
        chainsWithBalance.has(chainId as CaipChainId),
      ),
    ) as Record<CaipChainId, MultichainNetworkConfiguration>,
);

const selectFiatBalanceByChain = createSelector(
  getAssetsBySelectedAccountGroup,
  (assetsByChain): Record<string, number> => {
    const result: Record<string, number> = {};
    for (const [hexChainId, assets] of Object.entries(assetsByChain)) {
      const caipChainId = isEvmChainId(hexChainId as Hex)
        ? toEvmCaipChainId(hexChainId as Hex)
        : hexChainId;
      result[caipChainId] = assets.reduce(
        (sum, asset) => sum + (Number(asset.fiat?.balance) || 0),
        0,
      );
    }
    return result;
  },
);

export const getAvailableBatchSellNetworks = createSelector(
  getNetworksWithPositiveBalanceForSelectedAccount,
  selectFiatBalanceByChain,
  getBridgeFeatureFlags,
  (networksWithBalance, fiatBalanceByChain, bridgeFeatureFlags) =>
    Object.entries(networksWithBalance)
      .filter(([chainId]) => {
        if (!BATCH_SELL_SUPPORTED_CHAIN_IDS.has(chainId as CaipChainId)) {
          return false;
        }
        const caipChainId = formatChainIdToCaip(chainId as CaipChainId);
        const stablecoins =
          bridgeFeatureFlags?.chains?.[caipChainId]?.batchSellDestStablecoins ??
          [];
        return stablecoins.length > 0;
      })
      .map(([chainId, network]) => ({
        chainId: chainId as CaipChainId,
        name: network.name,
        imageUrl:
          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
            convertCaipToHexChainId(chainId as CaipChainId)
          ] ?? '',
      }))
      .toSorted(
        (a, b) =>
          (fiatBalanceByChain[b.chainId] ?? 0) -
          (fiatBalanceByChain[a.chainId] ?? 0),
      ),
);

export const getBatchSellDestStablecoinsForNetwork = createSelector(
  [
    getBridgeFeatureFlags,
    (_state: BridgeAppState, chainId?: CaipChainId) => chainId,
  ],
  (bridgeFeatureFlags, chainId): CaipAssetType[] => {
    if (!chainId) {
      return [];
    }
    const caipChainId = formatChainIdToCaip(chainId);
    const batchSellDestStablecoins =
      bridgeFeatureFlags?.chains?.[caipChainId]?.batchSellDestStablecoins ?? [];

    return batchSellDestStablecoins.map(
      (assetId) => toAssetId(assetId) ?? assetId,
    );
  },
);

const resolveTokenFiatPriceAndChange = (
  asset: BridgeToken,
  marketData: ReturnType<typeof getMarketData>,
  assetsRates: ReturnType<typeof getAssetsRates>,
): { tokenFiatPrice?: number; percentageChange?: number } => {
  const { chainId, assetReference } = parseCaipAssetType(asset.assetId);

  if (isEvmChainId(chainId as Hex | CaipChainId)) {
    const hexChainId = formatChainIdToHex(chainId);
    const isNative =
      getNativeAssetForChainId(chainId)?.assetId.toLowerCase() ===
      asset.assetId.toLowerCase();
    // EVM native price lives under the zero-address key.
    const evmTokenAddress = (
      isNative ? '0x0000000000000000000000000000000000000000' : assetReference
    ) as Hex;
    const tokenMarketData =
      marketData?.[hexChainId]?.[evmTokenAddress] ??
      marketData?.[hexChainId]?.[evmTokenAddress.toLowerCase() as Hex];
    return {
      tokenFiatPrice: tokenMarketData?.price,
      percentageChange: tokenMarketData?.pricePercentChange1d,
    };
  }

  const assetRateData = assetsRates?.[asset.assetId];
  return {
    tokenFiatPrice:
      assetRateData?.rate === undefined
        ? undefined
        : Number(assetRateData.rate),
    percentageChange: assetRateData?.marketData?.pricePercentChange?.P1D,
  };
};

export const getAvailableBatchSellSwapAssetsForNetwork = createSelector(
  (state: BridgeAppState) =>
    getBridgeAssetsByAssetId(state, getSelectedAccountGroup(state)),
  getMarketData,
  getAssetsRates,
  (_state: unknown, selectedChainId: CaipChainId | null) => selectedChainId,
  (state: BridgeAppState, selectedChainId: CaipChainId | null) =>
    getBatchSellDestStablecoinsForNetwork(state, selectedChainId ?? undefined),
  (
    assetsByAssetId,
    marketData,
    assetsRates,
    selectedChainId,
    stablecoins,
  ): BatchSellAsset[] => {
    if (!selectedChainId) {
      return [];
    }

    const stablecoinSet = new Set(stablecoins.map((id) => id.toLowerCase()));

    return Object.values(assetsByAssetId)
      .filter((asset) => {
        if (asset.chainId !== selectedChainId) {
          return false;
        }
        if (
          !asset.balance ||
          Number.isNaN(Number(asset.balance)) ||
          Number(asset.balance) <= 0
        ) {
          return false;
        }
        if (stablecoinSet.has(asset.assetId.toLowerCase())) {
          return false;
        }
        if (
          isStockRWAToken(asset) ||
          asset.name?.includes(ONDO_TOKENIZED_TOKEN_NAME)
        ) {
          return false;
        }
        return true;
      })
      .map((asset): BatchSellAsset => {
        const { tokenFiatPrice, percentageChange } =
          resolveTokenFiatPriceAndChange(asset, marketData, assetsRates);
        return {
          ...asset,
          // The bridge selector leaves `iconUrl` empty for some tokens; fall
          // back to the asset image registry so the picker always renders one.
          iconUrl:
            asset.iconUrl ?? getAssetImageUrl(asset.assetId, asset.chainId),
          tokenFiatPrice,
          percentageChange,
        };
      });
  },
);

export const getNativeAssetForChain = createSelector(
  (state: BridgeAppState) =>
    getBridgeAssetsByAssetId(state, getSelectedAccountGroup(state)),
  (_state: unknown, chainId: CaipChainId | null | undefined) => chainId,
  (assetsByAssetId, chainId): BridgeToken | undefined => {
    if (!chainId) {
      return undefined;
    }
    const nativeAssetId = getNativeAssetForChainId(chainId)?.assetId;
    if (!nativeAssetId) {
      return undefined;
    }
    return assetsByAssetId[nativeAssetId.toLowerCase() as CaipAssetType];
  },
);

export const getAvailableBatchSellReceiveAssetsForNetwork = createSelector(
  [
    (state: BridgeAppState, chainId?: CaipChainId) =>
      getBatchSellDestStablecoinsForNetwork(state, chainId),
    (state: BridgeAppState) =>
      getBridgeAssetsByAssetId(state, getSelectedAccountGroup(state)),
    (state: BridgeAppState) =>
      (
        state.metamask as {
          tokensChainsCache?: Record<
            string,
            {
              data?: Record<
                string,
                {
                  symbol?: string;
                  name?: string;
                  decimals?: number;
                  iconUrl?: string;
                }
              >;
            }
          >;
        }
      ).tokensChainsCache ?? {},
  ],
  (stablecoinAssetIds, assetsByAssetId, tokensChainsCache): BridgeToken[] =>
    stablecoinAssetIds
      .map((assetId): BridgeToken | undefined => {
        const lowercasedAssetId = assetId.toLowerCase() as CaipAssetType;
        const heldAsset = assetsByAssetId[lowercasedAssetId];
        if (heldAsset) {
          return heldAsset;
        }
        // Stablecoin not held by user, build a minimal BridgeToken from token list cache
        const { chainId, assetReference: address } =
          parseCaipAssetType(assetId);

        const staticMetadata =
          BATCH_SELL_DEST_STABLECOIN_METADATA[lowercasedAssetId];
        if (staticMetadata) {
          return {
            assetId: lowercasedAssetId,
            chainId,
            symbol: staticMetadata.symbol,
            name: staticMetadata.name,
            decimals: staticMetadata.decimals,
            balance: '0',
            iconUrl: staticMetadata.iconUrl,
          };
        }

        // Last resort: build a minimal BridgeToken from the token list cache.
        const hexChainId = formatChainIdToHex(chainId);
        const tokenData =
          tokensChainsCache[hexChainId]?.data?.[address.toLowerCase()] ??
          tokensChainsCache[hexChainId]?.data?.[address];
        if (!tokenData) {
          return undefined;
        }
        return {
          assetId: lowercasedAssetId,
          chainId,
          symbol: tokenData.symbol ?? '',
          name: tokenData.name ?? tokenData.symbol ?? '',
          decimals: tokenData.decimals ?? 18,
          balance: '0',
          iconUrl: tokenData.iconUrl,
        };
      })
      .filter((asset): asset is BridgeToken => Boolean(asset))
      .map((asset) => ({
        ...asset,
        iconUrl:
          asset.iconUrl ?? getAssetImageUrl(asset.assetId, asset.chainId),
      })),
);

export const getBatchSellQuotes = createSelector(
  [
    ({ metamask }: BridgeAppState) => metamask,
    ({ bridge: { sortOrder } }: BridgeAppState) => sortOrder,
    ({ bridge: { selectedQuote } }: BridgeAppState) => selectedQuote,
    (_, { requestCount }: { requestCount: number }) => requestCount,
  ],
  (controllerStates, sortOrder, selectedQuote, requestCount) => {
    return selectBatchSellQuotes(controllerStates, {
      sortOrder,
      requestCount,
      selectedQuote,
    });
  },
);

export const getBatchSellTrades = createSelector(
  ({ metamask }: BridgeAppState) => metamask,
  (controllerStates) => selectBatchSellTrades(controllerStates),
);

// Per-quote validation errors for batch-sell. Returns an array of length
// `requestCount`, one entry per slot in `recommendedQuotes`. Slots without a
// quote get the default (all flags `false`).
export const getBatchSellQuotesValidationErrors = createDeepEqualSelector(
  [
    (state: BridgeAppState, params: { requestCount: number }) =>
      getBatchSellQuotes(state, params),
    getPriceImpactThresholds,
    (state: BridgeAppState) => isHardwareWallet(state),
    ({ metamask }: BridgeAppState) =>
      selectMinimumBalanceForRentExemptionInSOL(metamask),
  ],
  (
    { recommendedQuotes },
    priceImpactThresholds,
    isHardwareWalletAccount,
    minimumBalanceForRentExemptionInSOL,
  ): QuoteValidationErrors[] =>
    recommendedQuotes.map((quote) =>
      computeQuoteValidationErrors(quote, {
        priceImpactThresholds,
        isHardwareWalletAccount,
        minimumBalanceForRentExemptionInSOL,
      }),
    ),
);
