import {
  AssetType,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { CaipAssetType, isCaipChainId } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { getCurrencyRates, getMarketData } from '../../../selectors';
import { getAssetsRates } from '../../../selectors/assets';
import { Asset } from '../types/asset';

/**
 * Get the current price of an asset.
 *
 * @param asset - The asset to get the current price of
 * @returns The current price of the asset. If the asset is not found, or the price is not found, returns null.
 */
export const useCurrentPrice = (asset: Asset): { currentPrice?: number } => {
  const isEvm = !isCaipChainId(asset.chainId);
  const evmMarketData = useSelector(getMarketData);
  const evmCurrencyRates = useSelector(getCurrencyRates);
  const nonEvmConversionRates = useSelector(getAssetsRates);

  const { chainId, type } = asset;

  if (isEvm) {
    if (type === AssetType.native) {
      return { currentPrice: evmCurrencyRates[asset.symbol]?.conversionRate };
    }

    // Market and conversion rate data
    const address = toChecksumHexAddress(asset.address);
    const tokenMarketPrice = evmMarketData[chainId]?.[address]?.price;
    const baseCurrency = evmMarketData[chainId]?.[address]?.currency;
    const tokenExchangeRate = evmCurrencyRates[baseCurrency]?.conversionRate;

    const currentPrice =
      tokenExchangeRate !== undefined && tokenMarketPrice !== undefined
        ? tokenExchangeRate * tokenMarketPrice
        : undefined;

    return { currentPrice };
  }

  const assetId =
    type === AssetType.token
      ? asset.address
      : getNativeAssetForChainId(chainId).assetId;
  const currentPriceAsString =
    nonEvmConversionRates?.[assetId as CaipAssetType]?.rate;

  const currentPrice = currentPriceAsString
    ? parseFloat(currentPriceAsString)
    : undefined;

  return { currentPrice };
};
