import { Asset } from '../../../../pages/asset/components/asset-page';
import { ChainAddressMarketData, Token } from '../token-list/token-list';
import { Hex } from '@metamask/utils';

type CalculateTokenFiatAmountParams = {
  token: Token;
  chainId: Hex;
  balance: string | undefined;
  marketData: ChainAddressMarketData;
  currencyRates: any;
};

export function calculateTokenFiatAmount({
  token,
  chainId,
  balance,
  marketData,
  currencyRates,
}: CalculateTokenFiatAmountParams): number {
  const { address, isNative, symbol } = token;

  // Market and conversion rate data
  const baseCurrency = marketData[chainId]?.[address]?.currency;
  const tokenMarketPrice = Number(marketData[chainId]?.[address]?.price) || 0;
  const tokenExchangeRate = currencyRates[baseCurrency]?.conversionRate || 0;
  const parsedBalance = parseFloat(String(balance));

  if (isNative && currencyRates) {
    return (currencyRates[symbol]?.conversionRate || 0) * parsedBalance;
  } else {
    return tokenMarketPrice * tokenExchangeRate * parsedBalance;
  }
}
