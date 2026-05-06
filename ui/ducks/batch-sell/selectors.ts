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
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
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
import { isEvmChainId } from '../../../shared/lib/asset-utils';
import { BatchSellAsset } from './types';

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

export const getAvailableBatchSellNetworksSelector = createSelector(
  getNetworksWithPositiveBalanceForSelectedAccount,
  (networksWithBalance) =>
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
      })),
);

export const getAvailableBatchSellAssetsForNetworkSelector = createSelector(
  getAssetsBySelectedAccountGroup,
  getMarketData,
  getAssetsRates,
  (_state: unknown, selectedChainId: CaipChainId | null) => selectedChainId,
  (
    assetsByChain,
    marketData,
    assetsRates,
    selectedChainId,
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
    return assets
      .filter((asset) => hexToBigInt(asset.rawBalance) > 0n)
      .map((asset) => {
        let tokenFiatPrice: number | undefined;
        let percentageChange: number | undefined;

        if (isEvm) {
          const hexChainId = convertCaipToHexChainId(selectedChainId);

          let tokenAddress: `0x${string}` | undefined;

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

        return {
          assetId: asset.assetId,
          name: asset.name,
          symbol: asset.symbol,
          image: asset.image,
          balance: asset.balance,
          fiatBalance: asset.fiat?.balance,
          tokenFiatPrice,
          percentageChange,
          isNative: asset.isNative,
          chainId: selectedChainId,
        };
      });
  },
);
