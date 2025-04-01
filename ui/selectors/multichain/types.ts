import { type Hex } from '@metamask/utils';

export type ChainBalance = {
  chainId: string;
  totalNativeFiatBalance: number;
  totalImportedTokenFiatBalance: number;
  totalFiatBalance: number;
};

export type ChainFiatBalances = {
  [address: string]: ChainBalance[];
};

export type AccountBalance = {
  address: string;
  balance: string;
  stakedBalance?: string;
};

export type CurrencyRateEntry = {
  conversionRate: number;
  usdConversionRate?: number;
};

export type CurrencyRates = {
  [currency: string]: CurrencyRateEntry;
};

export type TokenMarketData = {
  price: number;
  contractPercentChange1d?: number;
  priceChange1d?: number;
  marketCap?: number;
  totalVolume?: number;
  circulatingSupply?: number;
};

export type ChainMarketData = {
  [tokenAddress: string]: TokenMarketData;
};

export type MarketData = {
  [chainId: string]: ChainMarketData;
};

export type TokenBalances = {
  [chainId: string]: Record<Hex, Hex>;
};
