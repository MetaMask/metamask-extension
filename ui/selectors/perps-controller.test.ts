import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  selectPerpsIsEligible,
  selectPerpsInitializationState,
  selectPerpsInitializationError,
  selectPerpsIsTestnet,
  selectPerpsActiveProvider,
  selectPerpsDepositPending,
  selectPerpsLastDepositTransactionId,
  selectPerpsLastDepositResult,
  selectPerpsWithdrawInProgress,
  selectPerpsLastWithdrawResult,
  selectPerpsWithdrawalRequests,
  selectPerpsDepositRequests,
  selectPerpsWithdrawalProgress,
  selectPerpsIsFirstTimeUser,
  selectPerpsHasPlacedFirstOrder,
  selectPerpsWatchlistMarkets,
  selectPerpsIsWatchlistMarket,
  selectPerpsLastError,
  selectPerpsSelectedPaymentToken,
  selectPerpsCachedMarketData,
  selectPerpsCachedPositions,
  selectPerpsCachedOrders,
  selectPerpsCachedAccountState,
  selectPerpsPerpsBalances,
  selectPerpsMarketFilterPreferences,
  selectPerpsShouldShowDepositToast,
} from './perps-controller';

function buildState(overrides: Record<string, unknown> = {}) {
  return { metamask: { ...overrides } };
}

describe('perps-controller selectors', () => {
  describe('selectPerpsIsEligible', () => {
    it('returns value from state', () => {
      expect(selectPerpsIsEligible(buildState({ isEligible: true }))).toBe(
        true,
      );
    });

    it('defaults to false', () => {
      expect(selectPerpsIsEligible(buildState())).toBe(false);
    });
  });

  describe('selectPerpsInitializationState', () => {
    it('returns value from state', () => {
      expect(
        selectPerpsInitializationState(
          buildState({ initializationState: 'initialized' }),
        ),
      ).toBe('initialized');
    });

    it('defaults to uninitialized', () => {
      expect(selectPerpsInitializationState(buildState())).toBe(
        'uninitialized',
      );
    });
  });

  describe('selectPerpsInitializationError', () => {
    it('returns value from state', () => {
      expect(
        selectPerpsInitializationError(
          buildState({ initializationError: 'some error' }),
        ),
      ).toBe('some error');
    });

    it('defaults to null', () => {
      expect(selectPerpsInitializationError(buildState())).toBeNull();
    });
  });

  describe('selectPerpsIsTestnet', () => {
    it('returns value from state', () => {
      expect(selectPerpsIsTestnet(buildState({ isTestnet: true }))).toBe(true);
    });

    it('defaults to false', () => {
      expect(selectPerpsIsTestnet(buildState())).toBe(false);
    });
  });

  describe('selectPerpsActiveProvider', () => {
    it('returns value from state', () => {
      expect(
        selectPerpsActiveProvider(buildState({ activeProvider: 'myx' })),
      ).toBe('myx');
    });

    it('defaults to hyperliquid', () => {
      expect(selectPerpsActiveProvider(buildState())).toBe('hyperliquid');
    });
  });

  describe('selectPerpsDepositPending', () => {
    const activeDepositId = 'tx-1';

    function buildTx(
      overrides: Partial<{
        id: string;
        type: TransactionType | string;
        status: TransactionStatus | string;
      }> = {},
    ) {
      return {
        id: overrides.id ?? activeDepositId,
        type: overrides.type ?? TransactionType.perpsDeposit,
        status: overrides.status ?? TransactionStatus.approved,
      };
    }

    function buildStateWithActiveDeposit(
      overrides: Record<string, unknown> = {},
    ) {
      return buildState({
        lastDepositTransactionId: activeDepositId,
        ...overrides,
      });
    }

    it('returns true when a perpsDeposit transaction is approved', () => {
      expect(
        selectPerpsDepositPending(
          buildStateWithActiveDeposit({ transactions: [buildTx()] }),
        ),
      ).toBe(true);
    });

    it('returns true when a perpsDepositAndOrder transaction is approved', () => {
      expect(
        selectPerpsDepositPending(
          buildStateWithActiveDeposit({
            transactions: [
              buildTx({ type: TransactionType.perpsDepositAndOrder }),
            ],
          }),
        ),
      ).toBe(true);
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      TransactionStatus.approved,
      TransactionStatus.signed,
      TransactionStatus.submitted,
    ])('returns true when status is %s', (status: TransactionStatus) => {
      expect(
        selectPerpsDepositPending(
          buildStateWithActiveDeposit({
            transactions: [buildTx({ status })],
          }),
        ),
      ).toBe(true);
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      TransactionStatus.unapproved,
      TransactionStatus.confirmed,
      TransactionStatus.failed,
      TransactionStatus.dropped,
      TransactionStatus.rejected,
    ])('returns false when status is %s', (status: TransactionStatus) => {
      expect(
        selectPerpsDepositPending(
          buildStateWithActiveDeposit({
            transactions: [buildTx({ status })],
          }),
        ),
      ).toBe(false);
    });

    it('returns false for unrelated transaction types in a pending status', () => {
      expect(
        selectPerpsDepositPending(
          buildStateWithActiveDeposit({
            transactions: [buildTx({ type: TransactionType.bridge })],
          }),
        ),
      ).toBe(false);
    });

    it('returns false when there are no transactions', () => {
      expect(
        selectPerpsDepositPending(
          buildStateWithActiveDeposit({ transactions: [] }),
        ),
      ).toBe(false);
    });

    it('returns false when the transactions slice is missing', () => {
      expect(
        selectPerpsDepositPending(
          buildState({ lastDepositTransactionId: activeDepositId }),
        ),
      ).toBe(false);
    });

    it('returns false when lastDepositTransactionId is null despite a pending perps tx', () => {
      expect(
        selectPerpsDepositPending(
          buildState({
            transactions: [
              buildTx({ id: 'orphan', status: TransactionStatus.submitted }),
            ],
            lastDepositTransactionId: null,
          }),
        ),
      ).toBe(false);
    });

    it('returns false when lastDepositTransactionId is absent despite a pending perps tx', () => {
      expect(
        selectPerpsDepositPending(
          buildState({
            transactions: [
              buildTx({ id: 'orphan', status: TransactionStatus.submitted }),
            ],
          }),
        ),
      ).toBe(false);
    });

    it('returns false when active id points to a confirmed tx while another perps tx is stuck submitted', () => {
      expect(
        selectPerpsDepositPending(
          buildState({
            lastDepositTransactionId: 'current-deposit',
            transactions: [
              buildTx({
                id: 'stale-deposit',
                status: TransactionStatus.submitted,
              }),
              buildTx({
                id: 'current-deposit',
                status: TransactionStatus.confirmed,
              }),
            ],
          }),
        ),
      ).toBe(false);
    });

    it('returns true only for the transaction matching lastDepositTransactionId', () => {
      expect(
        selectPerpsDepositPending(
          buildState({
            lastDepositTransactionId: 'tx-b',
            transactions: [
              buildTx({
                id: 'tx-a',
                type: TransactionType.simpleSend,
                status: TransactionStatus.submitted,
              }),
              buildTx({
                id: 'tx-b',
                type: TransactionType.perpsDeposit,
                status: TransactionStatus.submitted,
              }),
            ],
          }),
        ),
      ).toBe(true);
    });

    it('returns false when lastDepositTransactionId does not match any transaction', () => {
      expect(
        selectPerpsDepositPending(
          buildStateWithActiveDeposit({
            transactions: [
              buildTx({
                id: 'other-id',
                status: TransactionStatus.approved,
              }),
            ],
          }),
        ),
      ).toBe(false);
    });

    it('returns false for token-funded deposits with a non-native pay token', () => {
      expect(
        selectPerpsDepositPending(
          buildStateWithActiveDeposit({
            transactions: [buildTx()],
            transactionData: {
              [activeDepositId]: {
                paymentToken: {
                  address: '0x00000000000000000000000000000000000000dA',
                  chainId: '0xa4b1',
                },
              },
            },
          }),
        ),
      ).toBe(false);
    });

    it('returns true for native-token-funded deposits', () => {
      expect(
        selectPerpsDepositPending(
          buildStateWithActiveDeposit({
            transactions: [buildTx()],
            transactionData: {
              [activeDepositId]: {
                paymentToken: {
                  address: '0x0000000000000000000000000000000000000000',
                  chainId: '0xa4b1',
                },
              },
            },
          }),
        ),
      ).toBe(true);
    });
  });

  describe('selectPerpsShouldShowDepositToast', () => {
    it('returns true for a direct deposit transaction', () => {
      expect(
        selectPerpsShouldShowDepositToast(
          buildState({
            lastDepositTransactionId: 'tx-1',
            transactions: [
              {
                id: 'tx-1',
                type: TransactionType.perpsDeposit,
                status: TransactionStatus.approved,
              },
            ],
          }),
        ),
      ).toBe(true);
    });

    it('returns false for a token-funded deposit transaction', () => {
      expect(
        selectPerpsShouldShowDepositToast(
          buildState({
            lastDepositTransactionId: 'tx-1',
            transactions: [
              {
                id: 'tx-1',
                type: TransactionType.perpsDeposit,
                status: TransactionStatus.approved,
              },
            ],
            transactionData: {
              'tx-1': {
                paymentToken: {
                  address: '0x00000000000000000000000000000000000000dA',
                  chainId: '0xa4b1',
                },
              },
            },
          }),
        ),
      ).toBe(false);
    });
  });

  describe('selectPerpsLastDepositTransactionId', () => {
    it('returns value from state', () => {
      expect(
        selectPerpsLastDepositTransactionId(
          buildState({ lastDepositTransactionId: 'tx-abc' }),
        ),
      ).toBe('tx-abc');
    });

    it('defaults to null', () => {
      expect(selectPerpsLastDepositTransactionId(buildState())).toBeNull();
    });
  });

  describe('selectPerpsLastDepositResult', () => {
    it('returns value from state', () => {
      const result = { success: true };
      expect(
        selectPerpsLastDepositResult(buildState({ lastDepositResult: result })),
      ).toBe(result);
    });

    it('defaults to null', () => {
      expect(selectPerpsLastDepositResult(buildState())).toBeNull();
    });
  });

  describe('selectPerpsWithdrawInProgress', () => {
    it('returns value from state', () => {
      expect(
        selectPerpsWithdrawInProgress(buildState({ withdrawInProgress: true })),
      ).toBe(true);
    });

    it('defaults to false', () => {
      expect(selectPerpsWithdrawInProgress(buildState())).toBe(false);
    });
  });

  describe('selectPerpsLastWithdrawResult', () => {
    it('returns value from state', () => {
      const result = { success: true };
      expect(
        selectPerpsLastWithdrawResult(
          buildState({ lastWithdrawResult: result }),
        ),
      ).toBe(result);
    });

    it('defaults to null', () => {
      expect(selectPerpsLastWithdrawResult(buildState())).toBeNull();
    });
  });

  describe('selectPerpsWithdrawalRequests', () => {
    it('returns value from state', () => {
      const requests = [{ id: '1' }];
      expect(
        selectPerpsWithdrawalRequests(
          buildState({ withdrawalRequests: requests }),
        ),
      ).toBe(requests);
    });

    it('defaults to empty array', () => {
      expect(selectPerpsWithdrawalRequests(buildState())).toEqual([]);
    });

    it('returns same reference for default', () => {
      const a = selectPerpsWithdrawalRequests(buildState());
      const b = selectPerpsWithdrawalRequests(buildState());
      expect(a).toBe(b);
    });
  });

  describe('selectPerpsDepositRequests', () => {
    it('returns value from state', () => {
      const requests = [{ id: '1' }];
      expect(
        selectPerpsDepositRequests(buildState({ depositRequests: requests })),
      ).toBe(requests);
    });

    it('defaults to empty array', () => {
      expect(selectPerpsDepositRequests(buildState())).toEqual([]);
    });

    it('returns same reference for default', () => {
      const a = selectPerpsDepositRequests(buildState());
      const b = selectPerpsDepositRequests(buildState());
      expect(a).toBe(b);
    });
  });

  describe('selectPerpsWithdrawalProgress', () => {
    it('returns value from state', () => {
      const progress = {
        progress: 50,
        lastUpdated: 123,
        activeWithdrawalId: 'w1',
      };
      expect(
        selectPerpsWithdrawalProgress(
          buildState({ withdrawalProgress: progress }),
        ),
      ).toBe(progress);
    });

    it('defaults to null', () => {
      expect(selectPerpsWithdrawalProgress(buildState())).toBeNull();
    });
  });

  describe('selectPerpsIsFirstTimeUser', () => {
    it('returns value from state', () => {
      const value = { testnet: false, mainnet: false };
      expect(
        selectPerpsIsFirstTimeUser(buildState({ isFirstTimeUser: value })),
      ).toBe(value);
    });

    it('returns undefined when absent', () => {
      expect(selectPerpsIsFirstTimeUser(buildState())).toBeUndefined();
    });
  });

  describe('selectPerpsHasPlacedFirstOrder', () => {
    it('returns value from state', () => {
      const value = { testnet: true, mainnet: true };
      expect(
        selectPerpsHasPlacedFirstOrder(
          buildState({ hasPlacedFirstOrder: value }),
        ),
      ).toBe(value);
    });

    it('defaults to both false', () => {
      expect(selectPerpsHasPlacedFirstOrder(buildState())).toEqual({
        testnet: false,
        mainnet: false,
      });
    });
  });

  describe('selectPerpsWatchlistMarkets', () => {
    it('returns value from state', () => {
      const value = { testnet: ['ETH'], mainnet: ['BTC'] };
      expect(
        selectPerpsWatchlistMarkets(buildState({ watchlistMarkets: value })),
      ).toBe(value);
    });

    it('defaults to empty arrays', () => {
      expect(selectPerpsWatchlistMarkets(buildState())).toEqual({
        testnet: [],
        mainnet: [],
      });
    });
  });

  describe('selectPerpsIsWatchlistMarket', () => {
    const watchlistMarkets = {
      testnet: ['SOL'],
      mainnet: ['BTC', 'ETH'],
    };

    it('returns false when symbol is empty', () => {
      expect(selectPerpsIsWatchlistMarket(buildState(), '')).toBe(false);
    });

    it('returns true when symbol is on mainnet list (case-insensitive)', () => {
      expect(
        selectPerpsIsWatchlistMarket(
          buildState({ watchlistMarkets, isTestnet: false }),
          'btc',
        ),
      ).toBe(true);
    });

    it('returns true when symbol is on testnet list when isTestnet', () => {
      expect(
        selectPerpsIsWatchlistMarket(
          buildState({ watchlistMarkets, isTestnet: true }),
          'SOL',
        ),
      ).toBe(true);
    });

    it('returns false when symbol is not on the active list', () => {
      expect(
        selectPerpsIsWatchlistMarket(
          buildState({ watchlistMarkets, isTestnet: false }),
          'SOL',
        ),
      ).toBe(false);
    });
  });

  describe('selectPerpsLastError', () => {
    it('returns value from state', () => {
      expect(selectPerpsLastError(buildState({ lastError: 'oops' }))).toBe(
        'oops',
      );
    });

    it('defaults to null', () => {
      expect(selectPerpsLastError(buildState())).toBeNull();
    });
  });

  describe('selectPerpsSelectedPaymentToken', () => {
    it('returns value from state', () => {
      const token = { address: '0x1' };
      expect(
        selectPerpsSelectedPaymentToken(
          buildState({ selectedPaymentToken: token }),
        ),
      ).toBe(token);
    });

    it('defaults to null', () => {
      expect(selectPerpsSelectedPaymentToken(buildState())).toBeNull();
    });
  });

  describe('selectPerpsCachedMarketData', () => {
    it('returns value from state', () => {
      const data = [{ market: 'ETH' }];
      expect(
        selectPerpsCachedMarketData(
          buildState({
            activeProvider: 'hyperliquid',
            cachedMarketDataByProvider: {
              hyperliquid: { data, timestamp: 0 },
            },
          }),
        ),
      ).toBe(data);
    });

    it('falls back to hyperliquid data when activeProvider is absent', () => {
      const data = [{ market: 'ETH' }];
      expect(
        selectPerpsCachedMarketData(
          buildState({
            cachedMarketDataByProvider: {
              hyperliquid: { data, timestamp: 0 },
            },
          }),
        ),
      ).toBe(data);
    });

    it('defaults to null', () => {
      expect(selectPerpsCachedMarketData(buildState())).toBeNull();
    });
  });

  describe('selectPerpsCachedPositions', () => {
    it('returns value from state', () => {
      const positions = [{ market: 'ETH', size: 1 }];
      expect(
        selectPerpsCachedPositions(
          buildState({
            activeProvider: 'hyperliquid',
            cachedUserDataByProvider: {
              hyperliquid: {
                positions,
                orders: [],
                accountState: null,
                timestamp: 0,
                address: '',
              },
            },
          }),
        ),
      ).toBe(positions);
    });

    it('falls back to hyperliquid positions when activeProvider is absent', () => {
      const positions = [{ market: 'ETH', size: 1 }];
      expect(
        selectPerpsCachedPositions(
          buildState({
            cachedUserDataByProvider: {
              hyperliquid: {
                positions,
                orders: [],
                accountState: null,
                timestamp: 0,
                address: '',
              },
            },
          }),
        ),
      ).toBe(positions);
    });

    it('defaults to null', () => {
      expect(selectPerpsCachedPositions(buildState())).toBeNull();
    });
  });

  describe('selectPerpsCachedOrders', () => {
    it('returns value from state', () => {
      const orders = [{ id: 'o1' }];
      expect(
        selectPerpsCachedOrders(
          buildState({
            activeProvider: 'hyperliquid',
            cachedUserDataByProvider: {
              hyperliquid: {
                positions: [],
                orders,
                accountState: null,
                timestamp: 0,
                address: '',
              },
            },
          }),
        ),
      ).toBe(orders);
    });

    it('falls back to hyperliquid orders when activeProvider is absent', () => {
      const orders = [{ id: 'o1' }];
      expect(
        selectPerpsCachedOrders(
          buildState({
            cachedUserDataByProvider: {
              hyperliquid: {
                positions: [],
                orders,
                accountState: null,
                timestamp: 0,
                address: '',
              },
            },
          }),
        ),
      ).toBe(orders);
    });

    it('defaults to null', () => {
      expect(selectPerpsCachedOrders(buildState())).toBeNull();
    });
  });

  describe('selectPerpsCachedAccountState', () => {
    it('returns value from state', () => {
      const account = { balance: '100' };
      expect(
        selectPerpsCachedAccountState(
          buildState({
            activeProvider: 'hyperliquid',
            cachedUserDataByProvider: {
              hyperliquid: {
                positions: [],
                orders: [],
                accountState: account,
                timestamp: 0,
                address: '',
              },
            },
          }),
        ),
      ).toBe(account);
    });

    it('falls back to hyperliquid account state when activeProvider is absent', () => {
      const account = { balance: '100' };
      expect(
        selectPerpsCachedAccountState(
          buildState({
            cachedUserDataByProvider: {
              hyperliquid: {
                positions: [],
                orders: [],
                accountState: account,
                timestamp: 0,
                address: '',
              },
            },
          }),
        ),
      ).toBe(account);
    });

    it('defaults to null', () => {
      expect(selectPerpsCachedAccountState(buildState())).toBeNull();
    });
  });

  describe('selectPerpsPerpsBalances', () => {
    it('returns value from state', () => {
      const balances = { ETH: '100' };
      expect(
        selectPerpsPerpsBalances(buildState({ perpsBalances: balances })),
      ).toBe(balances);
    });

    it('defaults to empty object', () => {
      expect(selectPerpsPerpsBalances(buildState())).toEqual({});
    });
  });

  describe('selectPerpsMarketFilterPreferences', () => {
    it('returns value from state', () => {
      const prefs = { optionId: 'volume', direction: 'asc' };
      expect(
        selectPerpsMarketFilterPreferences(
          buildState({ marketFilterPreferences: prefs }),
        ),
      ).toBe(prefs);
    });

    it('defaults to null', () => {
      expect(selectPerpsMarketFilterPreferences(buildState())).toBeNull();
    });
  });
});
