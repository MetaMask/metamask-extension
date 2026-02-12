import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionStatus } from '@metamask/transaction-controller';
import {
  useMerklClaimStatus,
  MERKL_DISTRIBUTOR_ADDRESS,
} from './useMerklClaimStatus';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const { useSelector } = jest.requireMock('react-redux');

const createMerklClaimTx = (
  id: string,
  status: string,
  overrides: Record<string, unknown> = {},
) => ({
  id,
  status,
  txParams: {
    to: MERKL_DISTRIBUTOR_ADDRESS,
  },
  ...overrides,
});

const createNonMerklTx = (id: string, status: string) => ({
  id,
  status,
  txParams: {
    to: '0x0000000000000000000000000000000000000001',
  },
});

describe('useMerklClaimStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSelector.mockReturnValue([]);
  });

  it('returns null toastState when no Merkl claim transactions exist', () => {
    useSelector.mockReturnValue([]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBeNull();
  });

  it('returns null toastState for non-Merkl transactions', () => {
    useSelector.mockReturnValue([
      createNonMerklTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBeNull();
  });

  it('returns "in-progress" when a Merkl claim is approved', () => {
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.approved),
    ]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');
  });

  it('returns "in-progress" when a Merkl claim is submitted', () => {
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');
  });

  it('returns "in-progress" when a Merkl claim is signed', () => {
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.signed),
    ]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');
  });

  it('returns "success" when a pending Merkl claim is confirmed', () => {
    // Start with a submitted claim
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    // Transition to confirmed
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.confirmed),
    ]);

    rerender();

    expect(result.current.toastState).toBe('success');
  });

  it('returns "failed" when a pending Merkl claim fails', () => {
    // Start with a submitted claim
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    // Transition to failed
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.failed),
    ]);

    rerender();

    expect(result.current.toastState).toBe('failed');
  });

  it('returns "failed" when a pending Merkl claim is dropped', () => {
    // Start with a submitted claim
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    // Transition to dropped
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.dropped),
    ]);

    rerender();

    expect(result.current.toastState).toBe('failed');
  });

  it('dismisses the completion toast when dismissToast is called', () => {
    // Start with a submitted claim
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    // Transition to confirmed
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.confirmed),
    ]);

    rerender();

    expect(result.current.toastState).toBe('success');

    // Dismiss the toast
    act(() => {
      result.current.dismissToast();
    });

    expect(result.current.toastState).toBeNull();
  });

  it('does not show completion toast for already-confirmed claims on mount', () => {
    // Claim that was confirmed before the hook mounted
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.confirmed),
    ]);

    const { result } = renderHook(() => useMerklClaimStatus());

    // Should not show success since we didn't track it as pending
    expect(result.current.toastState).toBeNull();
  });

  it('does not show duplicate completion toasts for the same transaction', () => {
    // Start pending
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    // Confirm
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.confirmed),
    ]);
    rerender();
    expect(result.current.toastState).toBe('success');

    // Dismiss
    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.toastState).toBeNull();

    // Rerender with same confirmed tx - should not re-show
    rerender();
    expect(result.current.toastState).toBeNull();
  });

  it('handles multiple Merkl claims independently', () => {
    // First claim is submitted
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    // First claim confirmed, second claim submitted
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.confirmed),
      createMerklClaimTx('tx-2', TransactionStatus.submitted),
    ]);

    rerender();

    // Completion state takes priority
    expect(result.current.toastState).toBe('success');
  });

  it('ignores non-Merkl transactions when detecting transitions', () => {
    useSelector.mockReturnValue([
      createNonMerklTx('tx-other', TransactionStatus.submitted),
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    // Non-Merkl tx confirms, Merkl claim still pending
    useSelector.mockReturnValue([
      createNonMerklTx('tx-other', TransactionStatus.confirmed),
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    rerender();

    expect(result.current.toastState).toBe('in-progress');
  });

  it('dismisses the in-progress toast when dismissToast is called', () => {
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    // Dismiss while in-progress
    act(() => {
      result.current.dismissToast();
    });

    expect(result.current.toastState).toBeNull();

    // Rerender with same pending tx - should stay dismissed
    rerender();
    expect(result.current.toastState).toBeNull();
  });

  it('re-shows toast when a new claim appears after dismissal', () => {
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    // Dismiss
    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.toastState).toBeNull();

    // New claim appears
    useSelector.mockReturnValue([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
      createMerklClaimTx('tx-2', TransactionStatus.submitted),
    ]);

    rerender();

    expect(result.current.toastState).toBe('in-progress');
  });

  it('is case-insensitive for distributor address matching', () => {
    useSelector.mockReturnValue([
      {
        id: 'tx-1',
        status: TransactionStatus.submitted,
        txParams: {
          to: MERKL_DISTRIBUTOR_ADDRESS.toLowerCase(),
        },
      },
    ]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');
  });
});
