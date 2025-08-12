import { Hex } from '@metamask/utils';
import {
  ChainAddressMarketData,
  SymbolCurrencyRateMapping,
  Token,
} from '../types';

type CalculateTokenFiatAmountParams = {
  token: Token;
  chainId: Hex;
  balance: string | undefined;
  marketData: ChainAddressMarketData;
  currencyRates: SymbolCurrencyRateMapping;
};

export function calculateTokenFiatAmount({
  token,
  chainId,
  balance,
  marketData,
  currencyRates,
}: CalculateTokenFiatAmountParams): number | null {
  const { address, isNative, symbol } = token;

  // Market and conversion rate data
  const baseCurrency = marketData[chainId as Hex]?.[address as Hex]?.currency;
  const tokenMarketPrice =
    Number(marketData[chainId as Hex]?.[address as Hex]?.price) || 0;
  const tokenExchangeRate = currencyRates[baseCurrency]?.conversionRate || 0;
  const parsedBalance = parseFloat(String(balance));

  if (isNative && currencyRates) {
    return (currencyRates[symbol]?.conversionRate || 0) * parsedBalance;
  }
  if (!tokenMarketPrice) {
    return null; // when no market price is available, we don't want to render the fiat amount
  }
  return tokenMarketPrice * tokenExchangeRate * parsedBalance;
}
