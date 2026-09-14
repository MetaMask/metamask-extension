import { Hex } from '@metamask/utils';
import type { TransactionPaymentToken } from '@metamask/transaction-pay-controller';
import { renderHook } from '@testing-library/react';
import { useSendTokens } from '../send/useSendTokens';
import { useTokenFiatRate } from '../tokens/useTokenFiatRates';
import type { Asset } from '../../types/send';
import { usePayTokenAccountBalance } from './usePayTokenAccountBalance';
import { useTransactionPayToken } from './useTransactionPayToken';

jest.mock('./useTransactionPayToken');
jest.mock('../send/useSendTokens');
jest.mock('../tokens/useTokenFiatRates');

const PAY_TOKEN_MOCK = {
  address: '0xabc' as Hex,
  chainId: '0x1' as Hex,
  balanceUsd: '5.00',
  balanceRaw: '5000000000000000000',
  decimals: 18,
  symbol: 'ETH',
} as TransactionPaymentToken;

const ACCOUNT_TOKEN_MOCK = {
  address: '0xabc',
  chainId: '0x1',
  decimals: 18,
  rawBalance: '0x1bc16d674ec80000' as Hex, // 2e18
  balance: '2',
  symbol: 'ETH',
  fiat: { balance: 3400 },
} as Asset;

describe('usePayTokenAccountBalance', () => {
  const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);
  const useSendTokensMock = jest.mocked(useSendTokens);
  const useTokenFiatRateMock = jest.mocked(useTokenFiatRate);

  beforeEach(() => {
    jest.resetAllMocks();

    useTransactionPayTokenMock.mockReturnValue({
      payToken: PAY_TOKEN_MOCK,
      setPayToken: jest.fn(),
    });
    useSendTokensMock.mockReturnValue([ACCOUNT_TOKEN_MOCK]);
    useTokenFiatRateMock.mockReturnValue(1700);
  });

  it('returns zero balances when no pay token is selected', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: undefined,
      setPayToken: jest.fn(),
    });

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current).toStrictEqual({
      balanceUsd: '0',
      balanceRaw: '0',
    });
  });

  it('computes balance from matching account token and USD rate', () => {
    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current.balanceRaw).toBe('2000000000000000000');
    expect(result.current.balanceUsd).toBe('3400');
  });

  it('falls back to controller snapshot when no matching account token', () => {
    useSendTokensMock.mockReturnValue([]);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current).toStrictEqual({
      balanceUsd: PAY_TOKEN_MOCK.balanceUsd,
      balanceRaw: PAY_TOKEN_MOCK.balanceRaw,
    });
  });

  it('falls back to controller snapshot when matching token has no rawBalance', () => {
    useSendTokensMock.mockReturnValue([
      { ...ACCOUNT_TOKEN_MOCK, rawBalance: undefined },
    ]);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current).toStrictEqual({
      balanceUsd: PAY_TOKEN_MOCK.balanceUsd,
      balanceRaw: PAY_TOKEN_MOCK.balanceRaw,
    });
  });

  it('matches a native account token to the native pay-token address', () => {
    const nativeAddress = '0x0000000000000000000000000000000000000000' as Hex;
    useTransactionPayTokenMock.mockReturnValue({
      payToken: { ...PAY_TOKEN_MOCK, address: nativeAddress },
      setPayToken: jest.fn(),
    });
    useSendTokensMock.mockReturnValue([
      {
        ...ACCOUNT_TOKEN_MOCK,
        address: undefined,
        isNative: true,
      },
    ]);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current.balanceRaw).toBe('2000000000000000000');
  });

  it('matches token by address case-insensitively', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: { ...PAY_TOKEN_MOCK, address: '0xABC' as Hex },
      setPayToken: jest.fn(),
    });

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current.balanceRaw).toBe('2000000000000000000');
  });

  it('matches tokens whose chainId is CAIP-2', () => {
    useSendTokensMock.mockReturnValue([
      { ...ACCOUNT_TOKEN_MOCK, chainId: 'eip155:1' },
    ]);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current.balanceRaw).toBe('2000000000000000000');
  });

  it('does not match token with same address but different chainId', () => {
    useSendTokensMock.mockReturnValue([
      { ...ACCOUNT_TOKEN_MOCK, chainId: '0x89' },
    ]);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current).toStrictEqual({
      balanceUsd: PAY_TOKEN_MOCK.balanceUsd,
      balanceRaw: PAY_TOKEN_MOCK.balanceRaw,
    });
  });

  it('does not throw when the USD rate has more than 15 significant digits', () => {
    useTokenFiatRateMock.mockReturnValue(1.0001734321076745);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current.balanceRaw).toBe('2000000000000000000');
    expect(result.current.balanceUsd).toBe('5');
  });

  it('does not understate USD when the live rate is below the snapshot', () => {
    useTokenFiatRateMock.mockReturnValue(1);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current.balanceRaw).toBe('2000000000000000000');
    expect(result.current.balanceUsd).toBe('5');
  });

  it('falls back to controller balanceUsd when USD rate is unavailable', () => {
    useTokenFiatRateMock.mockReturnValue(undefined);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current.balanceRaw).toBe('2000000000000000000');
    expect(result.current.balanceUsd).toBe('5');
  });

  it('uses account token decimals over payToken decimals', () => {
    useSendTokensMock.mockReturnValue([
      {
        ...ACCOUNT_TOKEN_MOCK,
        decimals: 6,
        rawBalance: '0xf4240' as Hex,
      },
    ]);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current.balanceUsd).toBe('1700');
    expect(result.current.balanceRaw).toBe('1000000');
  });

  it('uses payToken decimals when account token has no decimals', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: { ...PAY_TOKEN_MOCK, decimals: 8 },
      setPayToken: jest.fn(),
    });
    useSendTokensMock.mockReturnValue([
      {
        ...ACCOUNT_TOKEN_MOCK,
        decimals: undefined,
        rawBalance: '0x5f5e100' as Hex,
      },
    ]);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current.balanceUsd).toBe('1700');
  });

  it('handles zero rawBalance', () => {
    useSendTokensMock.mockReturnValue([
      {
        ...ACCOUNT_TOKEN_MOCK,
        rawBalance: '0x0' as Hex,
      },
    ]);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current).toStrictEqual({
      balanceUsd: '0',
      balanceRaw: '0',
    });
  });

  it('falls back to controller defaults when payToken fields are undefined', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        ...PAY_TOKEN_MOCK,
        balanceUsd: undefined,
        balanceRaw: undefined,
      } as unknown as TransactionPaymentToken,
      setPayToken: jest.fn(),
    });
    useSendTokensMock.mockReturnValue([]);

    const { result } = renderHook(() => usePayTokenAccountBalance());

    expect(result.current).toStrictEqual({
      balanceUsd: '0',
      balanceRaw: '0',
    });
  });
});
