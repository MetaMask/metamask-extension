// Note: just some initial types (will likely be refactored to pull from contract metadata

import { Delegation } from '../../../shared/lib/delegation';

export enum TokenSymbol {
  ETH = 'ETH',
  USDC = 'USDC',
  WETH = 'WETH',
  WBTC = 'WBTC',
  BNB = 'BNB',
  EURC = 'EURC',
}

export type TokenInfo = {
  symbol: TokenSymbol;
  name: string;
  iconUrl: string;
};

export const TOKEN_DETAILS: Record<TokenSymbol, TokenInfo> = {
  [TokenSymbol.ETH]: {
    symbol: TokenSymbol.ETH,
    name: 'ETH',
    iconUrl: './images/eth_logo.png',
  },
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
  // note: added for testing (finalized list tbd)
  [TokenSymbol.EURC]: {
    symbol: TokenSymbol.EURC,
    name: 'EURC',
    iconUrl: './images/eth_logo.png',
  },
};

export enum BaseToTokenOption {
  AllowedOutcome = 'Select allowed outcome token',
  Any = 'Any token on Ethereum Mainnet',
}

export type ToTokenOption = BaseToTokenOption | TokenSymbol;

export type SwapAllowance = {
  from: TokenSymbol;
  to: ToTokenOption;
  amount: number;
};

export enum DailyAllowanceTokenTypes {
  ETH = 'ETH',
}

export type DailyAllowance = {
  tokenType: TokenSymbol;
  amount: number;
  iconUrl: string;
};

export type RemoteModeConfig = {
  swapAllowance:
    | {
        allowances: SwapAllowance[];
        delegation: Delegation;
      }
    | null
    | undefined;
  dailyAllowance:
    | {
        allowances: DailyAllowance[];
        delegation: Delegation;
      }
    | null
    | undefined;
};

export enum REMOTE_MODES {
  SWAP = 'swap',
  DAILY_ALLOWANCE = 'daily-allowance',
}
