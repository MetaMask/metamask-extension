import { createSelector } from 'reselect';
import {
  Hex,
  hexToBigInt,
  KnownCaipNamespace,
  type CaipAssetType,
  type CaipChainId,
} from '@metamask/utils';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import {
  MultichainNetworkConfiguration,
  toEvmCaipChainId,
} from '@metamask/multichain-network-controller';
import { isEvmAccountType } from '@metamask/keyring-api';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
  CHAIN_IDS,
} from '../../../shared/constants/network';
import { convertCaipToHexChainId } from '../../../shared/lib/network.utils';
import {
  getAssetsBySelectedAccountGroup,
  getAssetsRates,
} from '../../selectors/assets';
import {
  getAllMultichainNetworkConfigurations,
  getMarketData,
  getSelectedInternalAccount,
} from '../../selectors';
import { isEvmChainId, toAssetId } from '../../../shared/lib/asset-utils';
import {
  getBridgeFeatureFlags,
  type BridgeAppState,
} from '../bridge/selectors';
import { BatchSellAsset } from './types';
import { getChecksummedEvmAssetId } from './utils';

/**
 * V1 of batch sell functionality relies on a hardcoded list
 * of supported networks.
 */
const BATCH_SELL_SUPPORTED_CHAIN_IDS = new Set([
  toEvmCaipChainId(CHAIN_IDS.MAINNET),
  toEvmCaipChainId(CHAIN_IDS.BSC),
  toEvmCaipChainId(CHAIN_IDS.BASE),
  toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET),
  toEvmCaipChainId(CHAIN_IDS.ARBITRUM),
  toEvmCaipChainId(CHAIN_IDS.POLYGON),
]);

/**
 * Returns all available multichain network configurations for the currently
 * selected account. EVM accounts support all EVM networks; non-EVM accounts
 * only support the networks listed in their declared CAIP-2 scopes.
 */
export const getNetworksForSelectedAccount = createSelector(
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

const selectChainsWithPositiveBalanceForSelectedAccount = createSelector(
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

export const getNetworksWithPositiveBalanceForSelectedAccount = createSelector(
  getNetworksForSelectedAccount,
  selectChainsWithPositiveBalanceForSelectedAccount,
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

export const getAvailableBatchSellNetworksSelector = createSelector(
  getNetworksWithPositiveBalanceForSelectedAccount,
  selectFiatBalanceByChain,
  (networksWithBalance, fiatBalanceByChain) =>
    Object.entries(networksWithBalance)
      .filter(([chainId]) =>
        BATCH_SELL_SUPPORTED_CHAIN_IDS.has(chainId as CaipChainId),
      )
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

export const selectBatchSellDestStablecoins = createSelector(
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
      (
        bridgeFeatureFlags?.chains?.[caipChainId] as unknown as {
          batchSellDestStablecoins?: CaipAssetType[];
        }
      )?.batchSellDestStablecoins ?? [];


     // Note: this seletor works for EVM asset ids at the time of this
     // writing. If we need to support non-evm assets in the future
     // inside the `batchSellDestStablecoins` feature flag, then we
     // will have to revise it as conversion to getChecksummedEvmAssetId
     // will fail.
    const checksummedStablecoinAssetIds = batchSellDestStablecoins.map(
      getChecksummedEvmAssetId,
    );

    return checksummedStablecoinAssetIds;
  },
);

export const getAvailableBatchSellAssetsForNetworkSelector = createSelector(
  getAssetsBySelectedAccountGroup,
  getMarketData,
  getAssetsRates,
  (_state: unknown, selectedChainId: CaipChainId | null) => selectedChainId,
  (state: BridgeAppState, selectedChainId: CaipChainId | null) =>
    selectBatchSellDestStablecoins(state, selectedChainId ?? undefined),
  (
    assetsByChain,
    marketData,
    assetsRates,
    selectedChainId,
    stablecoins,
  ): BatchSellAsset[] => {
    if (!selectedChainId) {
      return [];
    }
    const isEvm = isEvmChainId(selectedChainId as Hex | CaipChainId);
    // getAssetsBySelectedAccountGroup keys EVM chains by hex (e.g. "0x1")
    // but the toolbar passes CAIP (e.g. "eip155:1"), so convert
    const lookupKey = isEvm
      ? convertCaipToHexChainId(selectedChainId)
      : selectedChainId;
    const assets = assetsByChain[lookupKey] ?? [];

    const isStablecoin = (asset: (typeof assets)[number]): boolean => {
      if (!stablecoins.length || asset.isNative) {
        return false;
      }
      const address = 'address' in asset ? asset.address : asset.assetId;
      const caipAssetId = toAssetId(address, selectedChainId);
      return caipAssetId !== undefined && stablecoins.includes(caipAssetId);
    };

    return assets
      .filter(
        (asset) => hexToBigInt(asset.rawBalance) > 0n && !isStablecoin(asset),
      )
      .map((asset) => {
        let tokenFiatPrice: number | undefined;
        let percentageChange: number | undefined;
        let tokenAddress: Hex | undefined;

        if (isEvm) {
          const hexChainId = convertCaipToHexChainId(selectedChainId);

          if (asset.isNative) {
            tokenAddress = getNativeTokenAddress(hexChainId);
          } else {
            tokenAddress = 'address' in asset ? asset.address : undefined;
          }

          const tokenMarketData = tokenAddress
            ? marketData?.[hexChainId]?.[tokenAddress as Hex]
            : undefined;
          if (tokenMarketData) {
            tokenFiatPrice = tokenMarketData.price;
            percentageChange = tokenMarketData.pricePercentChange1d;
          }
        } else {
          const assetRateData = assetsRates?.[asset.assetId as CaipAssetType];
          tokenFiatPrice =
            assetRateData?.rate === undefined
              ? undefined
              : Number(assetRateData.rate);
          percentageChange = assetRateData?.marketData?.pricePercentChange?.P1D;
        }

        // For EVM native tokens use CHAIN_ID_TOKEN_IMAGE_MAP (same source as
        // the dashboard asset list via getNativeCurrencyForChain), which returns
        // the token logo (e.g. ETH) consistently across all EVM chains.
        // For non-EVM native tokens fall back to the chain network image.
        // For ERC-20/non-native tokens use the asset's own image.
        let assetImage: string | undefined;
        if (asset.isNative && isEvm) {
          const hexChainId = convertCaipToHexChainId(selectedChainId);
          assetImage =
            CHAIN_ID_TOKEN_IMAGE_MAP[
              hexChainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
            ];
        } else if (asset.isNative) {
          assetImage = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[selectedChainId];
        } else {
          assetImage = asset.image;
        }

        // For EVM, tokenAddress is already resolved above (native or contract).
        // For non-EVM, there is no address concept so we leave it undefined.
        const address = isEvm ? tokenAddress : undefined;

        return {
          assetId: asset.assetId,
          name: asset.name,
          symbol: asset.symbol,
          image: assetImage,
          balance: asset.balance,
          fiatBalance: asset.fiat?.balance,
          tokenFiatPrice,
          percentageChange,
          isNative: asset.isNative,
          chainId: selectedChainId,
          address,
        };
      });
  },
);
