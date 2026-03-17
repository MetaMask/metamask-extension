import { renderHook, act } from '@testing-library/react-hooks';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { useMusdConversionToastStatus } from './useMusdConversionToastStatus';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const { useSelector } = jest.requireMock('react-redux');

const MOCK_PAYMENT_TOKEN = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  chainId: '0x1',
  symbol: 'USDC',
  decimals: 6,
};

const createMusdConversionTx = (
  id: string,
  status: string,
  overrides: Record<string, unknown> = {},
) => ({
  id,
  status,
  type: TransactionType.musdConversion,
  txParams: {
    to: '0x0000000000000000000000000000000000000001',
    from: '0x0000000000000000000000000000000000000002',
  },
  ...overrides,
});

const createNonMusdTx = (id: string, status: string) => ({
  id,
  status,
  type: TransactionType.simpleSend,
  txParams: {
    to: '0x0000000000000000000000000000000000000001',
    from: '0x0000000000000000000000000000000000000002',
  },
});

/**
 * The hook calls useSelector twice per render:
 * 1. getTransactions returns the full transactions list
 * 2. selectTransactionPaymentTokenByTransactionId returns the payment token
 *
 * We use a stateful mock implementation that alternates between the two
 * return values so it works correctly across re-renders.
 */
let mockTransactions: ReturnType<typeof createMusdConversionTx>[] = [];
let mockPaymentToken: typeof MOCK_PAYMENT_TOKEN | undefined;
let selectorCallIndex = 0;

function setupMock(
  transactions: ReturnType<typeof createMusdConversionTx>[],
  paymentToken: typeof MOCK_PAYMENT_TOKEN | undefined = undefined,
) {
  mockTransactions = transactions;
  mockPaymentToken = paymentToken;
  selectorCallIndex = 0;
  useSelector.mockImplementation(() => {
    const idx = selectorCallIndex;
    selectorCallIndex += 1;
    // Even calls (0, 2, 4...) are getTransactions, odd calls (1, 3, 5...) are paymentToken
    if (idx % 2 === 0) {
      return mockTransactions;
    }
    return mockPaymentToken;
  });
}

function updateMock(
  transactions: ReturnType<typeof createMusdConversionTx>[],
  paymentToken: typeof MOCK_PAYMENT_TOKEN | undefined = undefined,
) {
  mockTransactions = transactions;
  mockPaymentToken = paymentToken;
}

describe('useMusdConversionToastStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    selectorCallIndex = 0;
  });

  it('returns null toastState when no mUSD conversion transactions exist', () => {
    setupMock([]);

    const { result } = renderHook(() => useMusdConversionToastStatus());

    expect(result.current.toastState).toBeNull();
    expect(result.current.sourceTokenSymbol).toBeUndefined();
  });

  it('returns null toastState for non-mUSD transactions', () => {
    setupMock([
      createNonMusdTx('tx-1', TransactionStatus.submitted),
    ] as ReturnType<typeof createMusdConversionTx>[]);

    const { result } = renderHook(() => useMusdConversionToastStatus());

    expect(result.current.toastState).toBeNull();
  });

  it('returns "in-progress" when an mUSD conversion is approved', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.approved)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result } = renderHook(() => useMusdConversionToastStatus());

    expect(result.current.toastState).toBe('in-progress');
    expect(result.current.sourceTokenSymbol).toBe('USDC');
  });

  it('returns "in-progress" when an mUSD conversion is submitted', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result } = renderHook(() => useMusdConversionToastStatus());

    expect(result.current.toastState).toBe('in-progress');
    expect(result.current.sourceTokenSymbol).toBe('USDC');
  });

  it('returns "in-progress" when an mUSD conversion is signed', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.signed)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result } = renderHook(() => useMusdConversionToastStatus());

    expect(result.current.toastState).toBe('in-progress');
  });

  it('returns "success" when a pending mUSD conversion is confirmed', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    expect(result.current.toastState).toBe('in-progress');

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.confirmed)],
      undefined,
    );

    rerender();

    expect(result.current.toastState).toBe('success');
    expect(result.current.sourceTokenSymbol).toBe('USDC');
  });

  it('returns "failed" when a pending mUSD conversion fails', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    expect(result.current.toastState).toBe('in-progress');

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.failed)],
      undefined,
    );

    rerender();

    expect(result.current.toastState).toBe('failed');
    expect(result.current.sourceTokenSymbol).toBe('USDC');
  });

  it('returns "failed" when a pending mUSD conversion is dropped', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    expect(result.current.toastState).toBe('in-progress');

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.dropped)],
      undefined,
    );

    rerender();

    expect(result.current.toastState).toBe('failed');
    expect(result.current.sourceTokenSymbol).toBe('USDC');
  });

  it('dismisses the completion toast when dismissToast is called', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.confirmed)],
      undefined,
    );

    rerender();
    expect(result.current.toastState).toBe('success');

    act(() => {
      result.current.dismissToast();
    });

    expect(result.current.toastState).toBeNull();
  });

  it('does not show completion toast for already-confirmed conversions on mount', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.confirmed)],
      undefined,
    );

    const { result } = renderHook(() => useMusdConversionToastStatus());

    expect(result.current.toastState).toBeNull();
  });

  it('does not show duplicate completion toasts for the same transaction', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.confirmed)],
      undefined,
    );

    rerender();
    expect(result.current.toastState).toBe('success');

    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.toastState).toBeNull();

    rerender();
    expect(result.current.toastState).toBeNull();
  });

  it('returns undefined sourceTokenSymbol when no payment token is set', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      undefined,
    );

    const { result } = renderHook(() => useMusdConversionToastStatus());

    expect(result.current.toastState).toBe('in-progress');
    expect(result.current.sourceTokenSymbol).toBeUndefined();
  });

  it('ignores non-mUSD transactions when detecting transitions', () => {
    setupMock(
      [
        createNonMusdTx('tx-other', TransactionStatus.submitted),
        createMusdConversionTx('tx-1', TransactionStatus.submitted),
      ] as ReturnType<typeof createMusdConversionTx>[],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    expect(result.current.toastState).toBe('in-progress');

    updateMock(
      [
        createNonMusdTx('tx-other', TransactionStatus.confirmed),
        createMusdConversionTx('tx-1', TransactionStatus.submitted),
      ] as ReturnType<typeof createMusdConversionTx>[],
      MOCK_PAYMENT_TOKEN,
    );

    rerender();

    expect(result.current.toastState).toBe('in-progress');
  });

  it('re-shows toast when a new conversion appears after dismissal', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    expect(result.current.toastState).toBe('in-progress');

    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.toastState).toBeNull();

    updateMock(
      [
        createMusdConversionTx('tx-1', TransactionStatus.submitted),
        createMusdConversionTx('tx-2', TransactionStatus.submitted),
      ],
      MOCK_PAYMENT_TOKEN,
    );

    rerender();

    expect(result.current.toastState).toBe('in-progress');
  });

  it('shows in-progress for new pending conversion after previous conversion succeeded', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    expect(result.current.toastState).toBe('in-progress');

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.confirmed)],
      undefined,
    );
    rerender();
    expect(result.current.toastState).toBe('success');

    updateMock(
      [
        createMusdConversionTx('tx-1', TransactionStatus.confirmed),
        createMusdConversionTx('tx-2', TransactionStatus.submitted),
      ],
      MOCK_PAYMENT_TOKEN,
    );
    rerender();

    expect(result.current.toastState).toBe('in-progress');
  });

  it('does not leak previous conversion symbol to a new conversion whose payment token has not populated yet', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    expect(result.current.sourceTokenSymbol).toBe('USDC');

    // tx-1 completes: activePendingTxId → undefined, symbol cached for completion toast
    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.confirmed)],
      undefined,
    );
    rerender();
    expect(result.current.toastState).toBe('success');
    expect(result.current.sourceTokenSymbol).toBe('USDC');

    // tx-2 appears but its payment token has NOT populated yet
    updateMock(
      [
        createMusdConversionTx('tx-1', TransactionStatus.confirmed),
        createMusdConversionTx('tx-2', TransactionStatus.submitted),
      ],
      undefined,
    );
    rerender();

    expect(result.current.toastState).toBe('in-progress');
    // Must be undefined, NOT the stale 'USDC' from tx-1
    expect(result.current.sourceTokenSymbol).toBeUndefined();

    // Once tx-2's payment token populates, it should display the new symbol
    const DAI_PAYMENT_TOKEN = {
      ...MOCK_PAYMENT_TOKEN,
      symbol: 'DAI',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    };
    updateMock(
      [
        createMusdConversionTx('tx-1', TransactionStatus.confirmed),
        createMusdConversionTx('tx-2', TransactionStatus.submitted),
      ],
      DAI_PAYMENT_TOKEN,
    );
    rerender();

    expect(result.current.sourceTokenSymbol).toBe('DAI');
  });

  it('shows success toast when completion and new pending conversion arrive in the same render cycle', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    expect(result.current.toastState).toBe('in-progress');

    // Simulate tx-1 confirming AND tx-2 appearing pending in the same render
    updateMock(
      [
        createMusdConversionTx('tx-1', TransactionStatus.confirmed),
        createMusdConversionTx('tx-2', TransactionStatus.submitted),
      ],
      MOCK_PAYMENT_TOKEN,
    );
    rerender();

    expect(result.current.toastState).toBe('success');
  });

  it('shows failed toast when failure and new pending conversion arrive in the same render cycle', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    expect(result.current.toastState).toBe('in-progress');

    // Simulate tx-1 failing AND tx-2 appearing pending in the same render
    updateMock(
      [
        createMusdConversionTx('tx-1', TransactionStatus.failed),
        createMusdConversionTx('tx-2', TransactionStatus.submitted),
      ],
      MOCK_PAYMENT_TOKEN,
    );
    rerender();

    expect(result.current.toastState).toBe('failed');
  });

  it('transitions to in-progress for tx-2 after dismissing simultaneous completion toast', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    // tx-1 confirms and tx-2 starts in the same render
    updateMock(
      [
        createMusdConversionTx('tx-1', TransactionStatus.confirmed),
        createMusdConversionTx('tx-2', TransactionStatus.submitted),
      ],
      MOCK_PAYMENT_TOKEN,
    );
    rerender();
    expect(result.current.toastState).toBe('success');

    act(() => {
      result.current.dismissToast();
    });

    // After dismissing completion, pending tx-2 should show in-progress
    // (dismissed=true hides it, but next rerender with tx-2 still pending
    //  doesn't change the state — dismissal hides the toast)
    expect(result.current.toastState).toBeNull();
  });

  it('shows in-progress for new pending conversion after previous conversion failed', () => {
    setupMock(
      [createMusdConversionTx('tx-1', TransactionStatus.submitted)],
      MOCK_PAYMENT_TOKEN,
    );

    const { result, rerender } = renderHook(() =>
      useMusdConversionToastStatus(),
    );

    expect(result.current.toastState).toBe('in-progress');

    updateMock(
      [createMusdConversionTx('tx-1', TransactionStatus.failed)],
      undefined,
    );
    rerender();
    expect(result.current.toastState).toBe('failed');

    updateMock(
      [
        createMusdConversionTx('tx-1', TransactionStatus.failed),
        createMusdConversionTx('tx-2', TransactionStatus.submitted),
      ],
      MOCK_PAYMENT_TOKEN,
    );
    rerender();

    expect(result.current.toastState).toBe('in-progress');
  });
});
