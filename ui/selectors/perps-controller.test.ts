import {
  selectPerpsIsEligible,
  selectPerpsInitializationState,
  selectPerpsInitializationError,
  selectPerpsIsTestnet,
  selectPerpsActiveProvider,
  selectPerpsDepositInProgress,
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
  selectPerpsLastError,
  selectPerpsSelectedPaymentToken,
  selectPerpsCachedMarketData,
  selectPerpsCachedPositions,
  selectPerpsCachedOrders,
  selectPerpsCachedAccountState,
  selectPerpsPerpsBalances,
  selectPerpsMarketFilterPreferences,
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

  describe('selectPerpsDepositInProgress', () => {
    it('returns value from state', () => {
      expect(
        selectPerpsDepositInProgress(buildState({ depositInProgress: true })),
      ).toBe(true);
    });

    it('defaults to false', () => {
      expect(selectPerpsDepositInProgress(buildState())).toBe(false);
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

    it('defaults to both true', () => {
      expect(selectPerpsIsFirstTimeUser(buildState())).toEqual({
        testnet: true,
        mainnet: true,
      });
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
        selectPerpsCachedMarketData(buildState({ cachedMarketData: data })),
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
        selectPerpsCachedPositions(buildState({ cachedPositions: positions })),
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
        selectPerpsCachedOrders(buildState({ cachedOrders: orders })),
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
          buildState({ cachedAccountState: account }),
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
