import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { AssetType } from '@metamask/bridge-controller';
import { CaipAssetType, isCaipChainId } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getCurrencyRates, getMarketData } from '../../../selectors';
import { getAssetsRates } from '../../../selectors/assets';
import { getMultichainConversionRate } from '../../../selectors/multichain';
import { Asset } from '../types/asset';
import { getConversionRateByTicker } from '../../../ducks/metamask/metamask';

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
  const nativeConversionRate = useMultichainSelector(
    getMultichainConversionRate,
  );

  const evmConversion = useSelector((state) =>
    getConversionRateByTicker(state, asset.symbol),
  );

  const { chainId, type } = asset;

  const address = (() => {
    if (type === AssetType.token) {
      return isEvm ? toChecksumHexAddress(asset.address) : asset.address;
    }
    return getNativeTokenAddress(chainId);
  })();

  if (type === AssetType.native) {
    return isEvm
      ? { currentPrice: evmConversion }
      : { currentPrice: Number(nativeConversionRate) };
  }

  if (isEvm) {
    // Market and conversion rate data
    const tokenMarketPrice = evmMarketData[chainId]?.[address]?.price;
    const baseCurrency = evmMarketData[chainId]?.[address]?.currency;
    const tokenExchangeRate = evmCurrencyRates[baseCurrency]?.conversionRate;

    const currentPrice =
      tokenExchangeRate !== undefined && tokenMarketPrice !== undefined
        ? tokenExchangeRate * tokenMarketPrice
        : undefined;

    return { currentPrice };
  }

  const currentPriceAsString =
    nonEvmConversionRates?.[address as CaipAssetType]?.rate;

  const currentPrice = currentPriceAsString
    ? parseFloat(currentPriceAsString)
    : undefined;

  return { currentPrice };
};
