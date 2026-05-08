import {
  Hex,
  type CaipAssetType,
  type CaipChainId,
  parseCaipAssetType,
} from '@metamask/utils';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { formatAddressToAssetId } from '@metamask/bridge-controller';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../../shared/constants/network';
import { convertCaipToHexChainId } from '../../../shared/lib/network.utils';
import { getAssetsRates } from '../../selectors/assets';
import { getMarketData } from '../../selectors';
import { ChainAsset } from './types';

export function getChecksummedEvmAssetId(
  assetId: CaipAssetType,
): CaipAssetType {
  try {
    const { assetNamespace, assetReference, chainId } =
      parseCaipAssetType(assetId);

    if (assetNamespace !== 'erc20' || !chainId.startsWith('eip155:')) {
      return assetId;
    }

    return formatAddressToAssetId(assetReference, chainId) ?? assetId;
  } catch {
    return assetId;
  }
}

export function resolveEvmTokenAddress(
  asset: ChainAsset,
  hexChainId: Hex,
): Hex | undefined {
  if (asset.isNative) {
    return getNativeTokenAddress(hexChainId);
  }
  return 'address' in asset ? asset.address : undefined;
}

export function resolvePricingData(
  asset: ChainAsset,
  isEvm: boolean,
  hexChainId: Hex,
  tokenAddress: Hex | undefined,
  marketData: ReturnType<typeof getMarketData>,
  assetsRates: ReturnType<typeof getAssetsRates>,
): {
  tokenFiatPrice: number | undefined;
  percentageChange: number | undefined;
} {
  if (isEvm) {
    const tokenMarketData = tokenAddress
      ? marketData?.[hexChainId]?.[tokenAddress]
      : undefined;
    return {
      tokenFiatPrice: tokenMarketData?.price,
      percentageChange: tokenMarketData?.pricePercentChange1d,
    };
  }

  const assetRateData = assetsRates?.[asset.assetId as CaipAssetType];
  return {
    tokenFiatPrice:
      assetRateData?.rate === undefined
        ? undefined
        : Number(assetRateData.rate),
    percentageChange: assetRateData?.marketData?.pricePercentChange?.P1D,
  };
}

export function resolveAssetImage(
  asset: ChainAsset,
  isEvm: boolean,
  selectedChainId: CaipChainId,
): string | undefined {
  if (asset.isNative && isEvm) {
    const hexChainId = convertCaipToHexChainId(selectedChainId);
    return CHAIN_ID_TOKEN_IMAGE_MAP[
      hexChainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
    ];
  }
  if (asset.isNative) {
    return CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[selectedChainId];
  }
  return asset.image;
}
