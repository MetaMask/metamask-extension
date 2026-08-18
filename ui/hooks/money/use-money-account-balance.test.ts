import { renderHook } from '@testing-library/react';
import { useQuery } from '@metamask/react-data-query';
import type { Hex } from '@metamask/utils';
import { useMoneyAccountBalance } from './use-money-account-balance';

jest.mock('@metamask/react-data-query', () => ({
  useQuery: jest.fn(),
}));
jest.mock('../useFiatFormatter', () => ({
  useFiatFormatter: () => (value: number) => `$${value.toFixed(2)}`,
}));

const mockUseQuery = jest.mocked(useQuery);
const address =
  '0x0000000000000000000000000000000000000001' as const satisfies Hex;

describe('useMoneyAccountBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the financial value unavailable while loading', () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMoneyAccountBalance(address));

    expect(result.current.balance).toBeUndefined();
    expect(result.current.formattedBalance).toBeUndefined();
  });

  it('converts canonical base units to a formatted USD balance', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { totalBalance: '123450000' },
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMoneyAccountBalance(address));

    expect(result.current.balance?.toString()).toBe('123.45');
    expect(result.current.formattedBalance).toBe('$123.45');
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        queryKey: [
          'MoneyAccountBalanceService:fetchBalanceWithFallback',
          address,
        ],
      }),
    );
  });

  it('represents a settled missing balance as zero', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMoneyAccountBalance(address));

    expect(result.current.formattedBalance).toBe('$0.00');
  });

  it('does not substitute a value when the query fails', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    } as ReturnType<typeof useQuery>);

    const { result } = renderHook(() => useMoneyAccountBalance(address));

    expect(result.current.formattedBalance).toBeUndefined();
  });

  it('disables the service query without an address', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useQuery>);

    renderHook(() => useMoneyAccountBalance());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });
});
