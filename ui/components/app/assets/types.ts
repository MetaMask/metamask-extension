import { Hex } from '@metamask/utils';

// Common mixin for primary and secondary display values
export type TokenDisplayValues = {
  primary?: string;
  secondary?: string;
  string?: string;
};

export type TokenBalanceValues = {
  tokenFiatAmount?: number | null;
  balance?: string;
};

// Base token type with common fields
export type BaseToken = {
  address: Hex;
  symbol: string;
  image: string;
  decimals: number;
  chainId: Hex;
  isNative?: boolean;
};

// Token type with optional aggregators
export type Token = BaseToken & {
  aggregators?: string[];
};

// Token with balance and optional display values
export type TokenWithBalance = Omit<BaseToken, 'chainId' | 'decimals'> &
  TokenDisplayValues &
  Omit<TokenBalanceValues, 'balance'>;

// Token display information (UI-related properties)
export type TokenDisplayInfo = TokenDisplayValues & {
  title: string;
  tokenImage: string;
  isStakeable?: boolean;
  tokenChainImage: string;
};

// Token type that includes fiat amount, balance, and display values
export type TokenWithFiatAmount = Token &
  TokenDisplayValues &
  TokenBalanceValues & {
    isStakeable?: boolean;
  };

export type TokenFiatDisplayInfo = TokenWithFiatAmount & TokenDisplayInfo;

export type AddressBalanceMapping = Record<Hex, Record<Hex, Hex>>;
export type ChainAddressMarketData = Record<
  Hex,
  Record<Hex, Record<string, string | number>>
>;

export type SymbolCurrencyRateMapping = Record<string, Record<string, number>>;
