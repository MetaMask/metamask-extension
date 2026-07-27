/**
 * Regression tests for the aggregated balance calculation that intentionally
 * do NOT mock `@metamask/assets-controller`, so the real aggregation selector
 * (`getAggregatedBalanceForAccount`) is exercised end-to-end.
 *
 * Covers #44786: tokens whose human-readable balance is >= 10^decimals (e.g.
 * a 54.06B TangYuan balance with 9 decimals) must not be re-scaled as if the
 * amount were raw base units, which made them drop out of the aggregated
 * total while individual token rows displayed the correct fiat value.
 * `aggregateGroupBalance` guards against this by stripping `assetsInfo`
 * (decimals metadata) from the state passed to the package selector, which
 * disables its `scaleToHumanIfRaw` heuristic.
 */
import { calculateBalanceForAllWallets } from './assets.balance-utils';

const TANG_YUAN_ASSET_ID =
  'eip155:56/erc20:0x1111111111111111111111111111111111111111';
const POSI_ASSET_ID =
  'eip155:56/erc20:0x2222222222222222222222222222222222222222';

const TANG_YUAN_BALANCE = 54_060_000_000; // human-readable, > 10^9 (decimals)
const TANG_YUAN_PRICE = 0.00000185;
const POSI_BALANCE = 1806.9; // human-readable, < 10^18 (decimals)
const POSI_PRICE = 0.03;

const assetsControllerState = {
  assetsBalance: {
    'acc-1': {
      [TANG_YUAN_ASSET_ID]: { amount: String(TANG_YUAN_BALANCE), unit: 'TY' },
      [POSI_ASSET_ID]: { amount: String(POSI_BALANCE), unit: 'POSI' },
    },
  },
  assetsInfo: {
    [TANG_YUAN_ASSET_ID]: {
      decimals: 9,
      symbol: 'TY',
      name: 'TangYuan',
    },
    [POSI_ASSET_ID]: {
      decimals: 18,
      symbol: 'POSI',
      name: 'Position Token',
    },
  },
  assetsPrice: {
    [TANG_YUAN_ASSET_ID]: { price: TANG_YUAN_PRICE, pricePercentChange1d: 0 },
    [POSI_ASSET_ID]: { price: POSI_PRICE, pricePercentChange1d: 0 },
  },
  assetPreferences: {},
  customAssets: {},
  selectedCurrency: 'usd',
} as never;

const accountsById = {
  'acc-1': { id: 'acc-1', address: '0x1' },
} as never;

const accountTreeState = {
  accountTree: {
    wallets: {
      w1: {
        groups: {
          'w1/g1': { accounts: ['acc-1'] },
        },
      },
    },
  },
} as never;

describe('calculateBalanceForAllWallets (unmocked aggregation selector)', () => {
  it('includes tokens whose human-readable balance exceeds 10^decimals in the total (#44786)', () => {
    const result = calculateBalanceForAllWallets(
      assetsControllerState,
      accountTreeState,
      accountsById,
      { eip155: { '0x38': true } },
    );

    const expectedTotal =
      TANG_YUAN_BALANCE * TANG_YUAN_PRICE + POSI_BALANCE * POSI_PRICE;

    expect(result.totalBalanceInUserCurrency).toBeCloseTo(expectedTotal, 2);
    expect(
      result.wallets.w1.groups['w1/g1'].totalBalanceInUserCurrency,
    ).toBeCloseTo(expectedTotal, 2);
  });
});
