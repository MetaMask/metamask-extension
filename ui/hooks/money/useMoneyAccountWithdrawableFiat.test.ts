import { renderHook } from '@testing-library/react';
import { BigNumber } from 'bignumber.js';
import { useQuery } from '@metamask/react-data-query';
import type { CanonicalMoneyAccountBalanceResponse } from '@metamask/money-account-balance-service';
import { DATA_SERVICES } from '../../../shared/constants/data-services';
import { MoneyAccountBalanceServiceQueryKeys } from '../../../shared/lib/money/query-keys';
import { selectPrimaryMoneyAccount } from '../../selectors/money-account';
import { useMoneyAccountWithdrawableFiat } from './useMoneyAccountWithdrawableFiat';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));
jest.mock('@metamask/react-data-query', () => ({
  useQuery: jest.fn(),
}));
jest.mock('../../selectors/money-account', () => ({
  selectPrimaryMoneyAccount: jest.fn(),
}));

const useQueryMock = jest.mocked(useQuery);
const selectPrimaryMoneyAccountMock = jest.mocked(selectPrimaryMoneyAccount);

const MONEY_ACCOUNT_ADDRESS = '0xabc0000000000000000000000000000000000001';

function musdUnits(human: string): string {
  return new BigNumber(human).times(1e6).toFixed(0);
}

function mockBalance({
  vmusdHuman,
  isLoading = false,
  isError = false,
}: {
  vmusdHuman?: string;
  isLoading?: boolean;
  isError?: boolean;
} = {}) {
  useQueryMock.mockReturnValue({
    data:
      vmusdHuman === undefined
        ? undefined
        : ({
            vmusdValueInMusd: musdUnits(vmusdHuman),
          } as CanonicalMoneyAccountBalanceResponse),
    isLoading,
    isError,
  } as ReturnType<typeof useQuery>);
}

describe('useMoneyAccountWithdrawableFiat', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockBalance({ vmusdHuman: '12.34' });
    selectPrimaryMoneyAccountMock.mockReturnValue({
      address: MONEY_ACCOUNT_ADDRESS,
    } as unknown as ReturnType<typeof selectPrimaryMoneyAccount>);
  });

  it('returns withdrawable fiat when active', () => {
    const { result } = renderHook(() => useMoneyAccountWithdrawableFiat(true));

    expect(result.current.withdrawableFiatRaw).toBe('12.34');
    expect(result.current.withdrawableFiatFormatted).toBe('$12.34');
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        queryKey: [
          MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
          MONEY_ACCOUNT_ADDRESS,
        ],
      }),
    );
  });

  it('rounds the displayed balance down so it stays withdrawable', () => {
    // Regression: CONF-2196. 499,999 micro-units formatted as `$0.50` via
    // half-up rounding, but only `0.49` is actually withdrawable. The raw
    // value keeps full precision so Max still drains the vault.
    mockBalance({ vmusdHuman: '0.499999' });

    const { result } = renderHook(() => useMoneyAccountWithdrawableFiat(true));

    expect(result.current.withdrawableFiatFormatted).toBe('$0.49');
    expect(result.current.withdrawableFiatRaw).toBe('0.499999');
  });

  it('returns zero withdrawable fiat when the vault balance is zero', () => {
    mockBalance({ vmusdHuman: '0' });

    const { result } = renderHook(() => useMoneyAccountWithdrawableFiat(true));

    expect(result.current.withdrawableFiatRaw).toBe('0');
    expect(result.current.withdrawableFiatFormatted).toBe('$0.00');
  });

  it('returns undefined while the cached query is loading', () => {
    mockBalance({ isLoading: true });

    const { result } = renderHook(() => useMoneyAccountWithdrawableFiat(true));

    expect(result.current).toStrictEqual({
      withdrawableFiatFormatted: undefined,
      withdrawableFiatRaw: undefined,
    });
  });

  it('returns undefined when the cached query errored', () => {
    mockBalance({ isError: true });

    const { result } = renderHook(() => useMoneyAccountWithdrawableFiat(true));

    expect(result.current).toStrictEqual({
      withdrawableFiatFormatted: undefined,
      withdrawableFiatRaw: undefined,
    });
  });

  it('does not use a data service query key when inactive', () => {
    const { result } = renderHook(() => useMoneyAccountWithdrawableFiat(false));

    expect(result.current).toStrictEqual({
      withdrawableFiatFormatted: undefined,
      withdrawableFiatRaw: undefined,
    });

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryFn: expect.any(Function),
      }),
    );

    const queryKey = useQueryMock.mock.calls[0][0].queryKey ?? [];

    expect(queryKey).not.toContain(
      MoneyAccountBalanceServiceQueryKeys.FETCH_BALANCE_WITH_FALLBACK,
    );
    expect(
      DATA_SERVICES.some((service) =>
        String(queryKey[0]).startsWith(`${service}:`),
      ),
    ).toBe(false);
  });
});
