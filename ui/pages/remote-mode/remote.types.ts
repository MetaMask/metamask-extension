// Note: just some initial types (will likely be refactored to pull from contract metadata

import { Delegation } from '../../../shared/lib/delegation';

export enum TokenSymbol {
  USDC = 'USDC',
  WETH = 'WETH',
  WBTC = 'WBTC',
  BNB = 'BNB',
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
  [TokenSymbol.WBTC]: {
    symbol: TokenSymbol.WBTC,
    name: 'WBTC',
    iconUrl: './images/icon-btc.png',
  },
  [TokenSymbol.BNB]: {
    symbol: TokenSymbol.BNB,
    name: 'BNB',
    iconUrl: './images/icon-bnb.png',
  },
};

export type SwapAllowance = {
  from: TokenSymbol;
  to: string;
  amount: number;
};

export enum ToTokenOption {
  AllowedOutcome = 'Select allowed outcome token',
  Any = 'Any token on Ethereum Mainnet',
}

export enum DailyAllowanceTokenTypes {
  ETH = 'ETH',
}

export type DailyAllowance = {
  tokenType: DailyAllowanceTokenTypes;
  amount: number;
};

export type RemoteModeConfig = {
  swapAllowance: {
    allowances: SwapAllowance[];
    revokeId?: string;
    delegation?: Delegation;
  } | null;
  dailyAllowance: {
    allowances: DailyAllowance[];
    revokeId?: string;
    delegation?: Delegation;
  } | null;
};

export enum REMOTE_MODES {
  SWAP = 'swap',
  DAILY_ALLOWANCE = 'daily-allowance',
}
