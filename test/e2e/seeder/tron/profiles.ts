import { TronLocalNodeOptions } from './assets';

export const TRON_PORTFOLIO_TRX_BALANCE_IN_SUN = 6_072_392;
export const STAKED_TRX_BALANCE_IN_SUN = 20_000_000;

export function createEmptyTronNodeOptions(
  address: string,
): TronLocalNodeOptions {
  return {
    initialBalances: {
      [address]: 0,
    },
  };
}

export function createTronPortfolioNodeOptions(
  address: string,
): TronLocalNodeOptions {
  return {
    initialBalances: {
      [address]: TRON_PORTFOLIO_TRX_BALANCE_IN_SUN,
    },
    trc10Balances: {
      [address]: {
        GAS_FREE: '33333333',
      },
    },
    trc20Balances: {
      [address]: {
        HTX: '3156454956836360132407885',
        SEED: '89851311',
        USDD: '289757448699320931',
        USDT: '2804595',
      },
    },
  };
}

export function createTronStakedAccountOptions(
  address: string,
): TronLocalNodeOptions {
  const portfolio = createTronPortfolioNodeOptions(address);
  return {
    ...portfolio,
    initialBalances: {
      [address]:
        TRON_PORTFOLIO_TRX_BALANCE_IN_SUN + STAKED_TRX_BALANCE_IN_SUN,
    },
    stakedTrxBalances: {
      [address]: String(STAKED_TRX_BALANCE_IN_SUN),
    },
  };
}

export function createTronDappUsdtNodeOptions(
  address: string,
): TronLocalNodeOptions {
  return {
    initialBalances: {
      [address]: 45_811_016,
    },
    trc20Balances: {
      [address]: {
        USDT: '70270000',
      },
    },
  };
}

export function createTronLowTrxOptions(address: string): TronLocalNodeOptions {
  return {
    initialBalances: {
      [address]: 1, // 1 sun = 1e-6 TRX
    },
    trc20Balances: {
      [address]: {
        USDT: '2000000', // 2 USDT (6 decimals)
      },
    },
  };
}
