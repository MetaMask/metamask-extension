import { TRON_ACCOUNT_ADDRESS, TRX_TO_USD_RATE } from '../mocks/common-tron';
import { TronFixtureAccount } from './with-tron-fixtures';
import { GAS_FREE, HTX, SEED, TRX, USDD, USDT } from './tokens';

export const TRON_PORTFOLIO_TRX_BALANCE_IN_SUN = 6_072_392;

export const EMPTY_TRON_ACCOUNT: TronFixtureAccount = {
  address: TRON_ACCOUNT_ADDRESS,
  assets: [{ ...TRX, balance: 0, priceUsd: TRX_TO_USD_RATE }],
};

export const TRON_PORTFOLIO_ACCOUNT: TronFixtureAccount = {
  address: TRON_ACCOUNT_ADDRESS,
  assets: [
    {
      ...TRX,
      balance: TRON_PORTFOLIO_TRX_BALANCE_IN_SUN,
      priceUsd: TRX_TO_USD_RATE,
    },
    { ...GAS_FREE, balance: '33333333', priceUsd: 0.000_000_001 },
    { ...HTX, balance: '3156454956836360132407885', priceUsd: 0.00000168 },
    { ...SEED, balance: '89851311', priceUsd: 0.000_000_001 },
    { ...USDD, balance: '289757448699320931', priceUsd: 0.999959 },
    { ...USDT, balance: '2804595', priceUsd: 0.999176 },
  ],
};

export const TRON_STAKED_PORTFOLIO_ACCOUNT: TronFixtureAccount = {
  ...TRON_PORTFOLIO_ACCOUNT,
  assets: TRON_PORTFOLIO_ACCOUNT.assets?.map((asset) =>
    asset.type === 'native'
      ? {
          ...asset,
          balance: TRON_PORTFOLIO_TRX_BALANCE_IN_SUN + 20_000_000,
        }
      : asset,
  ),
  stakedTrxBalance: '20000000',
};

export const TRON_LOW_TRX_WITH_USDT_ACCOUNT: TronFixtureAccount = {
  address: TRON_ACCOUNT_ADDRESS,
  assets: [
    { ...TRX, balance: 1, priceUsd: TRX_TO_USD_RATE },
    { ...USDT, balance: '2000000', priceUsd: 0.999176 },
  ],
};
