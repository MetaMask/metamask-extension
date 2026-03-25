import { renderHook } from '@testing-library/react-hooks';
import {
  useTransactionPaySourceAmounts,
  useTransactionPayRequiredTokens,
} from './useTransactionPayData';
import { useTransactionPayHasSourceAmount } from './useTransactionPayHasSourceAmount';

jest.mock('./useTransactionPayData');

const useTransactionPaySourceAmountsMock = jest.mocked(
  useTransactionPaySourceAmounts,
);
const useTransactionPayRequiredTokensMock = jest.mocked(
  useTransactionPayRequiredTokens,
);

describe('useTransactionPayHasSourceAmount', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useTransactionPaySourceAmountsMock.mockReturnValue(undefined);
    useTransactionPayRequiredTokensMock.mockReturnValue([]);
  });

  it('returns false when sourceAmounts is undefined', () => {
    const { result } = renderHook(() => useTransactionPayHasSourceAmount());
    expect(result.current).toBe(false);
  });

  it('returns false when sourceAmounts is empty', () => {
    useTransactionPaySourceAmountsMock.mockReturnValue([] as never);

    const { result } = renderHook(() => useTransactionPayHasSourceAmount());
    expect(result.current).toBe(false);
  });

  it('returns true when sourceAmount matches a required token', () => {
    useTransactionPaySourceAmountsMock.mockReturnValue([
      { targetTokenAddress: '0xABC' },
    ] as never);
    useTransactionPayRequiredTokensMock.mockReturnValue([
      { address: '0xabc', skipIfBalance: false },
    ] as never);

    const { result } = renderHook(() => useTransactionPayHasSourceAmount());
    expect(result.current).toBe(true);
  });

  it('returns false when sourceAmount matches a required token with skipIfBalance', () => {
    useTransactionPaySourceAmountsMock.mockReturnValue([
      { targetTokenAddress: '0xABC' },
    ] as never);
    useTransactionPayRequiredTokensMock.mockReturnValue([
      { address: '0xabc', skipIfBalance: true },
    ] as never);

    const { result } = renderHook(() => useTransactionPayHasSourceAmount());
    expect(result.current).toBe(false);
  });

  it('returns false when sourceAmount does not match any required token', () => {
    useTransactionPaySourceAmountsMock.mockReturnValue([
      { targetTokenAddress: '0xDEF' },
    ] as never);
    useTransactionPayRequiredTokensMock.mockReturnValue([
      { address: '0xabc', skipIfBalance: false },
    ] as never);

    const { result } = renderHook(() => useTransactionPayHasSourceAmount());
    expect(result.current).toBe(false);
  });
});
