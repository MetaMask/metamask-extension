import {
  calculateBalanceForAllWallets,
  calculateBalanceChangeForAccountGroup,
} from './assets.balance-utils';

const mockGetAggregatedBalanceForAccount = jest.fn();
jest.mock('@metamask/assets-controller', () => ({
  getAggregatedBalanceForAccount: (...args: unknown[]) =>
    mockGetAggregatedBalanceForAccount(...args),
}));

// The functions accept the unified AssetsController/account-tree state shapes.
// Tests use minimal stand-ins cast to `never` to avoid restating full types.
const assetsControllerState = {
  assetsInfo: {},
  assetsBalance: {},
  assetsPrice: {},
  assetPreferences: {},
  customAssets: {},
  selectedCurrency: 'usd',
} as never;

const accountsById = {
  'acc-1': { id: 'acc-1', address: '0x1' },
  'acc-2': { id: 'acc-2', address: '0x2' },
} as never;

const accountTreeState = {
  accountTree: {
    wallets: {
      w1: {
        groups: {
          'w1/g1': { accounts: ['acc-1'] },
          'w1/g2': { accounts: ['acc-2'] },
        },
      },
    },
  },
} as never;

describe('calculateBalanceForAllWallets', () => {
  beforeEach(() => {
    mockGetAggregatedBalanceForAccount.mockReset();
  });

  it('aggregates each group total and sums wallet/all-wallet totals', () => {
    mockGetAggregatedBalanceForAccount
      .mockReturnValueOnce({
        entries: [],
        totalBalanceInFiat: 40,
        pricePercentChange1d: 0,
      })
      .mockReturnValueOnce({
        entries: [],
        totalBalanceInFiat: 60,
        pricePercentChange1d: 0,
      });

    const result = calculateBalanceForAllWallets(
      assetsControllerState,
      accountTreeState,
      accountsById,
      { eip155: { '0x1': true } },
    );

    expect(result.userCurrency).toBe('usd');
    expect(result.totalBalanceInUserCurrency).toBe(100);
    expect(result.wallets.w1.totalBalanceInUserCurrency).toBe(100);
    expect(result.wallets.w1.groups['w1/g1'].totalBalanceInUserCurrency).toBe(
      40,
    );
    expect(result.wallets.w1.groups['w1/g2'].totalBalanceInUserCurrency).toBe(
      60,
    );
    expect(mockGetAggregatedBalanceForAccount).toHaveBeenCalledTimes(2);
  });

  it('zeroes groups with no accounts and skips the aggregator', () => {
    const treeWithEmptyGroup = {
      accountTree: {
        wallets: { w1: { groups: { 'w1/g1': { accounts: [] } } } },
      },
    } as never;

    const result = calculateBalanceForAllWallets(
      assetsControllerState,
      treeWithEmptyGroup,
      accountsById,
      undefined,
    );

    expect(result.totalBalanceInUserCurrency).toBe(0);
    expect(result.wallets.w1.groups['w1/g1'].totalBalanceInUserCurrency).toBe(
      0,
    );
    expect(mockGetAggregatedBalanceForAccount).not.toHaveBeenCalled();
  });

  it('strips assetsInfo from the state passed to the aggregation selector', () => {
    mockGetAggregatedBalanceForAccount.mockReturnValue({
      entries: [],
      totalBalanceInFiat: 1,
      pricePercentChange1d: 0,
    });

    const assetsBalance = {};
    const assetsPrice = {};
    const assetPreferences = {};
    const stateWithMetadata = {
      assetsInfo: { 'eip155:56/erc20:0x1': { decimals: 9, symbol: 'TY' } },
      assetsBalance,
      assetsPrice,
      assetPreferences,
      customAssets: {},
      selectedCurrency: 'usd',
    } as never;

    calculateBalanceForAllWallets(
      stateWithMetadata,
      accountTreeState,
      accountsById,
      undefined,
    );

    // Balance amounts in state are human-readable, but when decimals metadata
    // is present the aggregation selector re-scales amounts >= 10^decimals as
    // if they were raw base units, dropping large balances from the total
    // (#44786). Passing empty assetsInfo disables that heuristic.
    const passedState = mockGetAggregatedBalanceForAccount.mock.calls[0][0];
    expect(passedState.assetsInfo).toEqual({});
    expect(passedState.assetsBalance).toBe(assetsBalance);
    expect(passedState.assetsPrice).toBe(assetsPrice);
    expect(passedState.assetPreferences).toBe(assetPreferences);
  });

  it('does not pass a trace callback to the aggregation selector', () => {
    mockGetAggregatedBalanceForAccount.mockReturnValue({
      entries: [],
      totalBalanceInFiat: 1,
      pricePercentChange1d: 0,
    });

    calculateBalanceForAllWallets(
      assetsControllerState,
      accountTreeState,
      accountsById,
      undefined,
    );

    // This runs inside a Redux selector that recomputes per account group on
    // every state change, so tracing it emits an unbounded number of
    // transaction roots (#44447). The 7th positional argument of
    // `getAggregatedBalanceForAccount` is the trace.
    expect(mockGetAggregatedBalanceForAccount.mock.calls[0][6]).toBeUndefined();
  });
});

describe('calculateBalanceChangeForAccountGroup', () => {
  beforeEach(() => {
    mockGetAggregatedBalanceForAccount.mockReset();
  });

  const singleGroupTree = {
    accountTree: {
      wallets: { w1: { groups: { 'w1/g1': { accounts: ['acc-1'] } } } },
    },
  } as never;

  it('derives current/previous/amount/percent from the 1d price change', () => {
    mockGetAggregatedBalanceForAccount.mockReturnValue({
      entries: [],
      totalBalanceInFiat: 110,
      pricePercentChange1d: 10,
    });

    const result = calculateBalanceChangeForAccountGroup(
      assetsControllerState,
      singleGroupTree,
      accountsById,
      undefined,
      'w1/g1',
      '1d',
    );

    expect(result.period).toBe('1d');
    expect(result.currentTotalInUserCurrency).toBe(110);
    expect(result.previousTotalInUserCurrency).toBe(100);
    expect(result.amountChangeInUserCurrency).toBe(10);
    expect(result.percentChange).toBe(10);
    expect(result.userCurrency).toBe('usd');
  });

  it('returns a zeroed change for non-1d periods', () => {
    mockGetAggregatedBalanceForAccount.mockReturnValue({
      entries: [],
      totalBalanceInFiat: 110,
      pricePercentChange1d: 10,
    });

    const result = calculateBalanceChangeForAccountGroup(
      assetsControllerState,
      singleGroupTree,
      accountsById,
      undefined,
      'w1/g1',
      '30d',
    );

    expect(result.period).toBe('30d');
    expect(result.currentTotalInUserCurrency).toBe(110);
    expect(result.previousTotalInUserCurrency).toBe(110);
    expect(result.amountChangeInUserCurrency).toBe(0);
    expect(result.percentChange).toBe(0);
  });
});
