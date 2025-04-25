import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { AssetType } from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { useMultichainSelector } from '../../hooks/useMultichainSelector';
import { getCurrencyRates, getMarketData } from '../../selectors';
import { getMultichainIsEvm } from '../../selectors/multichain';
import { Asset } from './types/asset';

export const useCurrentPrice = (asset: Asset) => {
  const isEvm = useMultichainSelector(getMultichainIsEvm);

  const { chainId, type, symbol } = asset;

  const address = (() => {
    if (type === AssetType.token) {
      return isEvm ? toChecksumHexAddress(asset.address) : asset.address;
    }
    return getNativeTokenAddress(chainId);
  })();

  const marketData = useSelector(getMarketData);
  const currencyRates = useSelector(getCurrencyRates);

  // Market and conversion rate data
  const baseCurrency = marketData[chainId]?.[address]?.currency;
  const tokenMarketPrice = marketData[chainId]?.[address]?.price || undefined;
  const tokenExchangeRate =
    type === AssetType.native
      ? currencyRates[symbol]?.conversionRate
      : currencyRates[baseCurrency]?.conversionRate || 0;

  const currentPrice =
    tokenExchangeRate !== undefined && tokenMarketPrice !== undefined
      ? tokenExchangeRate * tokenMarketPrice
      : undefined;

  if (!isEvm) {
    return { currentPrice: 1 };
  }

  return { currentPrice };
};
