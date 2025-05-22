import { CaipAssetType, CaipChainId, Hex } from '@metamask/utils';

// Common mixin for primary and secondary display values
export type TokenDisplayValues = {
  primary: string;
  secondary: number | null;
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

// type created for non-evm tokens
export type NonEvmBaseToken = {
  address: CaipAssetType;
  symbol: string;
  image: string;
  decimals: number;
  chainId: CaipChainId;
  isNative?: boolean;
};

// Token type with optional aggregators
export type Token = (BaseToken | NonEvmBaseToken) & {
  aggregators?: string[];
  name?: string;
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
    title: string;
  };

export type TokenFiatDisplayInfo = TokenWithFiatAmount & TokenDisplayInfo;

export type AddressBalanceMapping = Record<Hex, Record<Hex, Hex>>;
export type ChainAddressMarketData = Record<
  Hex,
  Record<Hex, Record<string, string | number>>
>;

export type SymbolCurrencyRateMapping = Record<string, Record<string, number>>;

export type DeFiProtocolPosition = {
  chainId: Hex;
  tokenImage: string;
  underlyingSymbols: string[];
  marketValue: string;
  title: string;
  protocolId: string;
  iconGroup: { avatarValue: string; symbol: string }[];
};
