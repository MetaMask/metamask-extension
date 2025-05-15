import { AssetType } from '@metamask/bridge-controller';

export enum TokenSymbol {
  SEPOLIA_ETH = 'SepoliaETH',
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
  image: string;
  address: string;
  type: AssetType;
};

export enum REMOTE_MODES {
  SWAP = 'swap',
  DAILY_ALLOWANCE = 'daily-allowance',
}

export type DailyAllowance = TokenInfo & {
  amount: number;
};

export type DailyAllowanceMetadata = {
  allowances: DailyAllowance[];
};
