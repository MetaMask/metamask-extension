// Note: just some initial types (will likely be refactored to pull from contract metadata

export enum TokenSymbol {
  USDC = 'USDC',
  WETH = 'WETH',
}
export type TokenInfo = {
  symbol: TokenSymbol;
  name: string;
  iconUrl: string;
};

export const TOKEN_DETAILS: Record<TokenSymbol, TokenInfo> = {
  [TokenSymbol.USDC]: {
    symbol: TokenSymbol.USDC,
    name: 'USDC',
    iconUrl: './images/icon-usdc.png',
  },
  [TokenSymbol.WETH]: {
    symbol: TokenSymbol.WETH,
    name: 'WETH',
    iconUrl: './images/eth_logo.png',
  },
};

export type SwapAllowance = {
  from: TokenSymbol;
  to: string;
  amount: number;
};

export enum ToTokenOption {
  Any = 'Any available token',
  HighLiquidity = 'High liquidity tokens',
}

export enum DailyAllowanceTokenTypes {
  ETH = 'ETH',
}

export type DailyAllowance = {
  tokenType: DailyAllowanceTokenTypes;
  amount: number;
};
