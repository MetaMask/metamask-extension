import { renderHook } from '@testing-library/react';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import type { TransactionPayTotals } from '@metamask/transaction-pay-controller';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import { useTransactionPayToken } from './useTransactionPayToken';
import {
  useTransactionPayFiatPayment,
  useTransactionPayQuotes,
  useTransactionPaySourceAmounts,
  useTransactionPayTotals,
} from './useTransactionPayData';
import {
  useIsNetworkFeePaidByMetaMask,
  useIsPaidByMetaMask,
  useSponsoredNetworkFeeFlags,
} from './useIsPaidByMetaMask';

jest.mock('../transactions/useTransactionMetadataRequest');
jest.mock('./useTransactionPayData');
jest.mock('./useTransactionPayToken');

const useTransactionMetadataRequestOptionalMock = jest.mocked(
  useTransactionMetadataRequestOptional,
);
const useTransactionPayTotalsMock = jest.mocked(useTransactionPayTotals);
const useTransactionPayQuotesMock = jest.mocked(useTransactionPayQuotes);
const useTransactionPaySourceAmountsMock = jest.mocked(
  useTransactionPaySourceAmounts,
);
const useTransactionPayFiatPaymentMock = jest.mocked(
  useTransactionPayFiatPayment,
);
const useTransactionPayTokenMock = jest.mocked(useTransactionPayToken);

function mockConfirmation(
  type: TransactionType,
  extras: Partial<TransactionMeta> = {},
) {
  useTransactionMetadataRequestOptionalMock.mockReturnValue({
    type,
    ...extras,
  } as TransactionMeta);
}

function mockTotals(overrides?: Partial<TransactionPayTotals['fees']>) {
  useTransactionPayTotalsMock.mockReturnValue({
    fees: {
      sourceNetwork: { estimate: { usd: '0' } },
      targetNetwork: { usd: '0' },
      provider: { usd: '0' },
      metaMask: { usd: '0' },
      ...overrides,
    },
  } as TransactionPayTotals);
}

describe('useIsPaidByMetaMask', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockConfirmation(TransactionType.musdConversion);
    mockTotals();
    useTransactionPayQuotesMock.mockReturnValue([{}] as never);
    useTransactionPaySourceAmountsMock.mockReturnValue(undefined);
    useTransactionPayFiatPaymentMock.mockReturnValue(undefined);
    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        assetId: 'eip155:1/erc20:0x0000000000000000000000000000000000000abc',
      },
      setPayToken: jest.fn(),
    } as never);
  });

  it('returns true when all fees are zero for musdConversion', () => {
    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('returns false when sourceNetwork fee is non-zero', () => {
    mockTotals({
      sourceNetwork: { estimate: { usd: '0.01' } },
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when targetNetwork fee is non-zero', () => {
    mockTotals({
      targetNetwork: { usd: '0.05' },
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when provider fee is non-zero', () => {
    mockTotals({
      provider: { usd: '1.00' },
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when metaMask fee is non-zero', () => {
    mockTotals({
      metaMask: { usd: '0.50' },
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns true for any transaction type when all fees are zero', () => {
    mockConfirmation(TransactionType.simpleSend);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('returns true when all fees are zero for moneyAccountDeposit', () => {
    mockConfirmation(TransactionType.moneyAccountDeposit);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('returns true when all fees are zero for moneyAccountWithdraw', () => {
    mockConfirmation(TransactionType.moneyAccountWithdraw);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('returns true for a perps deposit when every fee is zero', () => {
    mockConfirmation(TransactionType.perpsDeposit);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('returns true for a perps withdraw when every fee is zero', () => {
    mockConfirmation(TransactionType.perpsWithdraw);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('returns false for a perps deposit with a provider fee', () => {
    mockConfirmation(TransactionType.perpsDeposit);
    mockTotals({
      provider: { usd: '0.10' },
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false for a perps withdraw with a network fee', () => {
    mockConfirmation(TransactionType.perpsWithdraw);
    mockTotals({
      targetNetwork: { usd: '0.05' },
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns true for a sponsored transaction with no quotes and no source amounts', () => {
    mockConfirmation(TransactionType.perpsDeposit, {
      isGasFeeSponsored: true,
    });
    useTransactionPayQuotesMock.mockReturnValue([]);
    useTransactionPayTotalsMock.mockReturnValue(undefined);
    useTransactionPaySourceAmountsMock.mockReturnValue([]);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('returns false when sponsored source amounts exist and a network fee is non-zero', () => {
    mockConfirmation(TransactionType.moneyAccountWithdraw, {
      isGasFeeSponsored: true,
    });
    useTransactionPaySourceAmountsMock.mockReturnValue([
      {},
    ] as unknown as ReturnType<typeof useTransactionPaySourceAmounts>);
    mockTotals({
      sourceNetwork: { estimate: { usd: '0.15' } },
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when a fiat payment method is selected', () => {
    useTransactionPayFiatPaymentMock.mockReturnValue({
      selectedPaymentMethodId: 'apple-pay',
    });

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when totals are undefined', () => {
    useTransactionPayTotalsMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when fees are undefined', () => {
    useTransactionPayTotalsMock.mockReturnValue({} as TransactionPayTotals);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when there are no quotes', () => {
    useTransactionPayQuotesMock.mockReturnValue([]);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns true when transaction metadata is undefined and every fee is zero', () => {
    useTransactionMetadataRequestOptionalMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('handles missing metaMask fee gracefully (undefined)', () => {
    mockTotals({
      metaMask: undefined,
    } as unknown as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('handles missing sourceNetwork.estimate gracefully', () => {
    mockTotals({
      sourceNetwork: {} as TransactionPayTotals['fees']['sourceNetwork'],
    } as TransactionPayTotals['fees']);

    const { result } = renderHook(() => useIsPaidByMetaMask());
    expect(result.current).toBe(true);
  });
});

describe('useIsNetworkFeePaidByMetaMask', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockConfirmation(TransactionType.moneyAccountDeposit, {
      isGasFeeSponsored: true,
    });
    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        assetId: 'eip155:1/erc20:0x0000000000000000000000000000000000000abc',
      },
      setPayToken: jest.fn(),
    } as never);
  });

  it('returns true for a sponsored moneyAccountDeposit', () => {
    const { result } = renderHook(() => useIsNetworkFeePaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('returns true for a sponsored moneyAccountWithdraw', () => {
    mockConfirmation(TransactionType.moneyAccountWithdraw, {
      isGasFeeSponsored: true,
    });

    const { result } = renderHook(() => useIsNetworkFeePaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('returns true for a sponsored musdConversion', () => {
    mockConfirmation(TransactionType.musdConversion, {
      isGasFeeSponsored: true,
    });

    const { result } = renderHook(() => useIsNetworkFeePaidByMetaMask());
    expect(result.current).toBe(true);
  });

  it('returns false when gas is not sponsored', () => {
    mockConfirmation(TransactionType.moneyAccountDeposit, {
      isGasFeeSponsored: false,
    });

    const { result } = renderHook(() => useIsNetworkFeePaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false for unsupported transaction types even when sponsored', () => {
    mockConfirmation(TransactionType.simpleSend, {
      isGasFeeSponsored: true,
    });

    const { result } = renderHook(() => useIsNetworkFeePaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false for perps even when gas is sponsored', () => {
    mockConfirmation(TransactionType.perpsDeposit, {
      isGasFeeSponsored: true,
    });

    const { result } = renderHook(() => useIsNetworkFeePaidByMetaMask());
    expect(result.current).toBe(false);
  });

  it('returns false when transaction metadata is undefined', () => {
    useTransactionMetadataRequestOptionalMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useIsNetworkFeePaidByMetaMask());
    expect(result.current).toBe(false);
  });
});

describe('useSponsoredNetworkFeeFlags', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockConfirmation(TransactionType.moneyAccountDeposit, {
      isGasFeeSponsored: true,
      chainId: '0x1',
    });
    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        assetId: 'eip155:1/erc20:0x0000000000000000000000000000000000000abc',
      },
      setPayToken: jest.fn(),
    } as never);
  });

  it('marks source and target as sponsored on same-chain routes', () => {
    const { result } = renderHook(() => useSponsoredNetworkFeeFlags());
    expect(result.current).toEqual({
      isSourceNetworkSponsored: true,
      isTargetNetworkSponsored: true,
    });
  });

  it('keeps source unsponsored on cross-chain routes', () => {
    useTransactionPayTokenMock.mockReturnValue({
      payToken: {
        assetId:
          'eip155:59144/erc20:0x0000000000000000000000000000000000000abc',
      },
      setPayToken: jest.fn(),
    } as never);

    const { result } = renderHook(() => useSponsoredNetworkFeeFlags());
    expect(result.current).toEqual({
      isSourceNetworkSponsored: false,
      isTargetNetworkSponsored: true,
    });
  });
});
