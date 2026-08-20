import type { Hex } from '@metamask/utils';
import { useQuery } from '@metamask/react-data-query';
import type {
  CanonicalMoneyAccountBalanceResponse,
  NormalizedVaultApyResponse,
} from '@metamask/money-account-balance-service';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import { invalidateMoneyAccountBalanceCaches } from '../../helpers/money/invalidate-balance-caches';
import type { PersistedMoneyBalance } from '../../ducks/money-balance';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';
import { useMoneyAccountBalance } from './useMoneyAccountBalance';

jest.mock('@metamask/react-data-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../../helpers/money/invalidate-balance-caches', () => ({
  invalidateMoneyAccountBalanceCaches: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./useMoneyAccountInfo', () => ({
  useMoneyAccountInfo: jest.fn(),
}));

const mockUseQuery = jest.mocked(useQuery);
const mockUseMoneyAccountInfo = jest.mocked(useMoneyAccountInfo);
const mockInvalidateCaches = jest.mocked(invalidateMoneyAccountBalanceCaches);

const MONEY_ADDRESS: Hex = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
const OTHER_ADDRESS: Hex = '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117';

/**
 * The subset of a `UseQueryResult` this hook reads. Written as a partial rather
 * than the full result type so a test states only the fields it cares about.
 */
type QueryStub<Data> = {
  data: Data | undefined;
  isLoading: boolean;
  isError?: boolean;
  isFetching?: boolean;
};

const LOADED_BALANCE: CanonicalMoneyAccountBalanceResponse = {
  // 6-decimal minimal units: 1 mUSD held bare, 2 mUSD of vault shares.
  musdBalance: '1000000',
  vmusdValueInMusd: '2000000',
  totalBalance: '3000000',
  source: 'api',
  usedFallback: false,
};

const BALANCE_LOADED: QueryStub<CanonicalMoneyAccountBalanceResponse> = {
  data: LOADED_BALANCE,
  isLoading: false,
  isError: false,
  isFetching: false,
};

const BALANCE_LOADING: QueryStub<CanonicalMoneyAccountBalanceResponse> = {
  data: undefined,
  isLoading: true,
  isError: false,
  isFetching: true,
};

const BALANCE_ERROR: QueryStub<CanonicalMoneyAccountBalanceResponse> = {
  data: undefined,
  isLoading: false,
  isError: true,
  isFetching: false,
};

const apyResponse = (apy: number): NormalizedVaultApyResponse => ({
  apy,
  timestamp: '2026-01-01T00:00:00Z',
});

const APY_LOADED: QueryStub<NormalizedVaultApyResponse> = {
  data: apyResponse(0.05),
  isLoading: false,
  isError: false,
};

const APY_LOADING: QueryStub<NormalizedVaultApyResponse> = {
  data: undefined,
  isLoading: true,
  isError: false,
};

const APY_SETTLED_EMPTY: QueryStub<NormalizedVaultApyResponse> = {
  data: undefined,
  isLoading: false,
  isError: false,
};

const APY_ERROR: QueryStub<NormalizedVaultApyResponse> = {
  data: undefined,
  isLoading: false,
  isError: true,
};

/**
 * Answers both `useQuery` calls the hook makes, dispatching on the query key so
 * a test does not depend on call order.
 *
 * @param balance - State of the canonical balance query.
 * @param apy - State of the vault APY query.
 */
function stubQueries(
  balance: QueryStub<CanonicalMoneyAccountBalanceResponse> = BALANCE_LOADED,
  apy: QueryStub<NormalizedVaultApyResponse> = APY_LOADED,
) {
  mockUseQuery.mockImplementation((options) => {
    const key = (options.queryKey as unknown[])[0];
    return (
      key === MoneyAccountBalanceServiceQueryKeys.GET_VAULT_APY ? apy : balance
    ) as never;
  });
}

/**
 * The `useQuery` options passed for one of the hook's two queries.
 *
 * @param key - First element of the query key identifying the query.
 * @returns The options that query was called with, if it was called at all.
 */
function queryOptionsFor(key: string) {
  const call = mockUseQuery.mock.calls.find(
    ([options]) => (options.queryKey as unknown[])[0] === key,
  );
  return call?.[0] as { queryKey: unknown[]; enabled?: boolean } | undefined;
}

const balanceQueryOptions = () =>
  queryOptionsFor(
    MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
  );

const apyQueryOptions = () =>
  queryOptionsFor(MoneyAccountBalanceServiceQueryKeys.GET_VAULT_APY);

type StateOptions = {
  lastKnownBalance?: PersistedMoneyBalance | null;
  vaultApyFallback?: number;
  vaultApyOverride?: number;
};

const buildState = ({
  lastKnownBalance = null,
  vaultApyFallback,
  vaultApyOverride,
}: StateOptions = {}) => ({
  metamask: {
    remoteFeatureFlags: {
      earnMoneyVaultApyControl: {
        ...(vaultApyFallback === undefined ? {} : { vaultApyFallback }),
        ...(vaultApyOverride === undefined ? {} : { vaultApyOverride }),
      },
    },
  },
  moneyBalance: { lastKnownBalance },
});

const renderBalanceHook = (
  options?: Parameters<typeof useMoneyAccountBalance>[0],
  state?: StateOptions,
) =>
  renderHookWithProvider(
    () => useMoneyAccountBalance(options),
    buildState(state),
  );

describe('useMoneyAccountBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvalidateCaches.mockResolvedValue(undefined);
    mockUseMoneyAccountInfo.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: true,
      primaryMoneyAccount: { address: MONEY_ADDRESS },
    });
    stubQueries();
  });

  describe('while the balance is loading', () => {
    beforeEach(() => {
      stubQueries(BALANCE_LOADING);
    });

    it('reports loading rather than an error', () => {
      const { result } = renderBalanceHook();

      expect(result.current.isBalanceLoading).toBe(true);
      expect(result.current.isBalanceFetchError).toBe(false);
      expect(result.current.isBalanceUnavailable).toBe(true);
    });

    it('leaves the amounts undefined, not zero', () => {
      const { result } = renderBalanceHook();

      expect(result.current.tokenTotal).toBeUndefined();
      expect(result.current.withdrawableMusd).toBeUndefined();
      expect(result.current.totalFiatFormatted).toBeUndefined();
      expect(result.current.totalFiatRaw).toBeUndefined();
      expect(result.current.withdrawableFiatFormatted).toBeUndefined();
      expect(result.current.withdrawableFiatRaw).toBeUndefined();
    });

    it('reports no provenance yet', () => {
      const { result } = renderBalanceHook();

      expect(result.current.balanceSource).toBeUndefined();
      expect(result.current.usedFallback).toBe(false);
      expect(result.current.isBalanceDegraded).toBe(false);
    });
  });

  describe('when the balance has loaded', () => {
    it('totals the bare mUSD and the vault position, scaled by the mUSD decimals', () => {
      const { result } = renderBalanceHook();

      expect(result.current.tokenTotal?.toString()).toBe('3');
      expect(result.current.totalFiatFormatted).toBe('$3.00');
      expect(result.current.totalFiatRaw).toBe('3');
      expect(result.current.isBalanceUnavailable).toBe(false);
    });

    it('reports only the vault position as withdrawable', () => {
      const { result } = renderBalanceHook();

      expect(result.current.withdrawableMusd?.toString()).toBe('2');
      expect(result.current.withdrawableFiatFormatted).toBe('$2.00');
      expect(result.current.withdrawableFiatRaw).toBe('2');
    });

    it('distinguishes a genuine zero from an unknown balance', () => {
      stubQueries({
        ...BALANCE_LOADED,
        data: {
          ...LOADED_BALANCE,
          musdBalance: '0',
          vmusdValueInMusd: '0',
          totalBalance: '0',
        },
      });

      const { result } = renderBalanceHook();

      // Defined and zero, where the loading and error cases are undefined.
      expect(result.current.tokenTotal?.toString()).toBe('0');
      expect(result.current.withdrawableMusd?.toString()).toBe('0');
      expect(result.current.totalFiatFormatted).toBe('$0.00');
      expect(result.current.totalFiatRaw).toBe('0');
      expect(result.current.isBalanceUnavailable).toBe(false);
    });

    it('collapses a sub-cent balance to $0.00', () => {
      stubQueries({
        ...BALANCE_LOADED,
        data: {
          ...LOADED_BALANCE,
          musdBalance: '1',
          vmusdValueInMusd: '1',
          totalBalance: '2',
        },
      });

      const { result } = renderBalanceHook();

      expect(result.current.totalFiatFormatted).toBe('$0.00');
      // The unrounded amount is still available to a caller that needs it.
      expect(result.current.totalFiatRaw).toBe('0.000002');
    });

    it('surfaces the query object so a caller can read isFetching directly', () => {
      const { result } = renderBalanceHook();

      expect(result.current.moneyBalanceQuery.data).toStrictEqual(
        LOADED_BALANCE,
      );
      expect(result.current.vaultApyQuery.data?.apy).toBe(0.05);
    });
  });

  describe('when the balance fetch fails', () => {
    beforeEach(() => {
      stubQueries(BALANCE_ERROR);
    });

    it('reports the error and withholds every amount', () => {
      const { result } = renderBalanceHook();

      expect(result.current.isBalanceFetchError).toBe(true);
      expect(result.current.isBalanceLoading).toBe(false);
      expect(result.current.isBalanceUnavailable).toBe(true);
      expect(result.current.tokenTotal).toBeUndefined();
      expect(result.current.withdrawableMusd).toBeUndefined();
      expect(result.current.totalFiatFormatted).toBeUndefined();
      expect(result.current.totalFiatRaw).toBeUndefined();
      expect(result.current.withdrawableFiatFormatted).toBeUndefined();
      expect(result.current.withdrawableFiatRaw).toBeUndefined();
    });

    it('offers the last known balance instead', () => {
      const { result } = renderBalanceHook(undefined, {
        lastKnownBalance: {
          address: MONEY_ADDRESS,
          value: '$2,384.34',
          updatedAt: 1,
        },
      });

      expect(result.current.lastKnownTotalFiatFormatted).toBe('$2,384.34');
    });
  });

  describe('provenance and degradation', () => {
    it('reports the API as the source when no failover was needed', () => {
      const { result } = renderBalanceHook();

      expect(result.current.balanceSource).toBe('api');
      expect(result.current.usedFallback).toBe(false);
      expect(result.current.isBalanceDegraded).toBe(false);
    });

    it('reports a degraded RPC balance, still with its amounts', () => {
      stubQueries({
        ...BALANCE_LOADED,
        data: { ...LOADED_BALANCE, source: 'rpc', usedFallback: true },
      });

      const { result } = renderBalanceHook();

      expect(result.current.balanceSource).toBe('rpc');
      expect(result.current.usedFallback).toBe(true);
      expect(result.current.isBalanceDegraded).toBe(true);
      // Degraded is not unavailable: the figure is real, just second-source.
      expect(result.current.totalFiatFormatted).toBe('$3.00');
    });
  });

  describe('APY precedence', () => {
    it('uses the live APY when the service answers', () => {
      const { result } = renderBalanceHook(undefined, {
        vaultApyFallback: 0.04,
      });

      expect(result.current.apyDecimal).toBe(0.05);
      expect(result.current.apyPercent).toBe(5);
      expect(result.current.apyPercentFormatted).toBe('5%');
    });

    it('prefers the override over the live APY', () => {
      stubQueries(BALANCE_LOADED, APY_LOADED);

      const { result } = renderBalanceHook(undefined, {
        vaultApyFallback: 0.04,
        vaultApyOverride: 0.08,
      });

      expect(result.current.apyDecimal).toBe(0.08);
      expect(result.current.apyPercentFormatted).toBe('8%');
    });

    it('honours an override of zero over a live APY', () => {
      const { result } = renderBalanceHook(undefined, {
        vaultApyFallback: 0.04,
        vaultApyOverride: 0,
      });

      expect(result.current.apyDecimal).toBe(0);
      expect(result.current.apyPercentFormatted).toBe('0%');
    });

    it('shows a genuine live 0% rather than falling back', () => {
      stubQueries(BALANCE_LOADED, { ...APY_LOADED, data: apyResponse(0) });

      const { result } = renderBalanceHook(undefined, {
        vaultApyFallback: 0.04,
      });

      expect(result.current.apyDecimal).toBe(0);
      expect(result.current.apyPercentFormatted).toBe('0%');
    });

    it('falls back when the APY query has settled with no value', () => {
      stubQueries(BALANCE_LOADED, APY_SETTLED_EMPTY);

      const { result } = renderBalanceHook(undefined, {
        vaultApyFallback: 0.04,
      });

      expect(result.current.apyDecimal).toBe(0.04);
      expect(result.current.apyPercentFormatted).toBe('4%');
    });

    it('falls back when the APY query errors', () => {
      stubQueries(BALANCE_LOADED, APY_ERROR);

      const { result } = renderBalanceHook(undefined, {
        vaultApyFallback: 0.04,
      });

      expect(result.current.apyDecimal).toBe(0.04);
      expect(result.current.apyPercentFormatted).toBe('4%');
    });

    it('uses the fallback during the first load', () => {
      stubQueries(BALANCE_LOADED, APY_LOADING);

      const { result } = renderBalanceHook(undefined, {
        vaultApyFallback: 0.04,
      });

      expect(result.current.apyDecimal).toBe(0.04);
      expect(result.current.apyPercent).toBe(4);
      expect(result.current.apyPercentFormatted).toBe('4%');
    });

    it('reports no APY at all when the service is empty and no fallback is served', () => {
      stubQueries(BALANCE_LOADED, APY_SETTLED_EMPTY);

      const { result } = renderBalanceHook();

      expect(result.current.apyDecimal).toBeUndefined();
      expect(result.current.apyPercent).toBeUndefined();
      expect(result.current.apyPercentFormatted).toBeUndefined();
    });

    it('rounds the percentage half up to one decimal place', () => {
      stubQueries(BALANCE_LOADED, {
        ...APY_LOADED,
        data: apyResponse(0.0377356238130822),
      });

      const { result } = renderBalanceHook();

      expect(result.current.apyDecimal).toBe(0.0377356238130822);
      expect(result.current.apyPercent).toBe(3.8);
      expect(result.current.apyPercentFormatted).toBe('3.8%');
    });

    it('formats a service APY with more than 15 significant digits', () => {
      stubQueries(BALANCE_LOADED, {
        ...APY_LOADED,
        data: apyResponse(0.06917567309149253),
      });

      const { result } = renderBalanceHook();

      expect(result.current.apyDecimal).toBe(0.06917567309149253);
      expect(result.current.apyPercent).toBe(6.9);
      expect(result.current.apyPercentFormatted).toBe('6.9%');
    });

    it('rounds the percentage down when the next digit is below half', () => {
      stubQueries(BALANCE_LOADED, {
        ...APY_LOADED,
        data: apyResponse(0.03341),
      });

      const { result } = renderBalanceHook();

      expect(result.current.apyPercent).toBe(3.3);
      expect(result.current.apyPercentFormatted).toBe('3.3%');
    });

    it('reports no APY when the configured value is not a number', () => {
      stubQueries(BALANCE_LOADED, APY_SETTLED_EMPTY);

      const { result } = renderBalanceHook(undefined, {
        // Produced arithmetically: `new BigNumber('nope')` throws in the
        // bignumber.js this repo pins, so a NaN cannot come from a string.
        vaultApyFallback: 0 / 0,
      });

      // The flag selector rejects a non-finite value, so nothing is shown
      // rather than a `NaN%` label.
      expect(result.current.apyDecimal).toBeUndefined();
      expect(result.current.apyPercentFormatted).toBeUndefined();
    });
  });

  describe('the last known balance', () => {
    const persisted: PersistedMoneyBalance = {
      address: MONEY_ADDRESS,
      value: '$2,384.34',
      updatedAt: 1,
    };

    // The last known figure only matters while the live one is unavailable —
    // and a successful fetch immediately overwrites it with the fresh value.
    beforeEach(() => {
      stubQueries(BALANCE_LOADING);
    });

    it('is offered when the account still matches', () => {
      const { result } = renderBalanceHook(undefined, {
        lastKnownBalance: persisted,
      });

      expect(result.current.lastKnownTotalFiatFormatted).toBe('$2,384.34');
    });

    it('is withheld when it belongs to a different account', () => {
      const { result } = renderBalanceHook(undefined, {
        lastKnownBalance: { ...persisted, address: OTHER_ADDRESS },
      });

      expect(result.current.lastKnownTotalFiatFormatted).toBeUndefined();
    });

    it('is persisted on every successful fetch', () => {
      stubQueries(BALANCE_LOADED);

      const { store } = renderBalanceHook();

      expect(store.getState().moneyBalance.lastKnownBalance).toStrictEqual(
        expect.objectContaining({
          address: MONEY_ADDRESS,
          value: '$3.00',
        }),
      );
    });

    it('is not written while the balance is loading', () => {
      stubQueries(BALANCE_LOADING);

      const { store } = renderBalanceHook();

      expect(store.getState().moneyBalance.lastKnownBalance).toBeNull();
    });

    it('is not written on a fetch error', () => {
      stubQueries(BALANCE_ERROR);

      const { store } = renderBalanceHook();

      expect(store.getState().moneyBalance.lastKnownBalance).toBeNull();
    });
  });

  describe('what it costs when there is nothing to show', () => {
    it('fetches neither the balance nor the APY when there is no money account', () => {
      mockUseMoneyAccountInfo.mockReturnValue({
        isMoneyAccountFeatureEnabled: false,
        hasMoneyAccount: false,
        primaryMoneyAccount: undefined,
      });

      renderBalanceHook();

      expect(balanceQueryOptions()?.enabled).toBe(false);
      expect(apyQueryOptions()?.enabled).toBe(false);
    });

    it('fetches nothing when the caller disables the hook', () => {
      renderBalanceHook({ enabled: false });

      expect(balanceQueryOptions()?.enabled).toBe(false);
      expect(apyQueryOptions()?.enabled).toBe(false);
    });

    it('keys the balance query by the money account address', () => {
      renderBalanceHook();

      expect(balanceQueryOptions()?.enabled).toBe(true);
      expect(balanceQueryOptions()?.queryKey).toStrictEqual([
        MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
        MONEY_ADDRESS,
      ]);
    });
  });

  describe('refetchBalance', () => {
    it('busts both source caches and the UI facade for the account', async () => {
      const { result } = renderBalanceHook();

      await result.current.refetchBalance();

      expect(mockInvalidateCaches).toHaveBeenCalledTimes(1);
      expect(mockInvalidateCaches).toHaveBeenCalledWith(MONEY_ADDRESS);
    });

    it('is a no-op when there is no money account', async () => {
      mockUseMoneyAccountInfo.mockReturnValue({
        isMoneyAccountFeatureEnabled: true,
        hasMoneyAccount: false,
        primaryMoneyAccount: undefined,
      });

      const { result } = renderBalanceHook();

      await expect(result.current.refetchBalance()).resolves.toBeUndefined();
      expect(mockInvalidateCaches).not.toHaveBeenCalled();
    });

    it('is a no-op when the hook is disabled', async () => {
      const { result } = renderBalanceHook({ enabled: false });

      await expect(result.current.refetchBalance()).resolves.toBeUndefined();
      expect(mockInvalidateCaches).not.toHaveBeenCalled();
    });
  });
});
