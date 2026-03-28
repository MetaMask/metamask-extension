import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionStatus } from '@metamask/transaction-controller';
import {
  useMerklClaimStatus,
  MERKL_DISTRIBUTOR_ADDRESS,
} from './useMerklClaimStatus';

const mockResolveClaimAmount = jest.fn();
jest.mock('./transaction-amount-utils', () => ({
  resolveClaimAmount: (...args: unknown[]) => mockResolveClaimAmount(...args),
}));

jest.mock('../../contexts/metametrics', () => {
  const React = jest.requireActual('react');
  const trackEvent = jest.fn().mockResolvedValue(undefined);
  return {
    MetaMetricsContext: React.createContext({
      trackEvent,
      bufferedTrace: jest.fn().mockResolvedValue(undefined),
      bufferedEndTrace: jest.fn(),
      onboardingParentContext: { current: null },
    }),
    mockTrackEvent: trackEvent,
  };
});

const { mockTrackEvent } = jest.requireMock('../../contexts/metametrics');

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const { useSelector } = jest.requireMock('react-redux');

const mockNetworkConfig: Record<string, { name: string }> = {
  '0x1': { name: 'Ethereum Mainnet' },
};

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

let selectorCallIndex = 0;

function setupSelectorMock(transactions: unknown[]) {
  selectorCallIndex = 0;
  useSelector.mockImplementation(() => {
    const idx = selectorCallIndex;
    selectorCallIndex += 1;
    const position = idx % 2;
    if (position === 0) {
      return transactions;
    }
    return mockNetworkConfig;
  });
}

describe('useMerklClaimStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTrackEvent.mockResolvedValue(undefined);
    mockResolveClaimAmount.mockResolvedValue(undefined);
    selectorCallIndex = 0;
    setupSelectorMock([]);
  });

  it('returns null toastState when no Merkl claim transactions exist', () => {
    setupSelectorMock([]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBeNull();
  });

  it('returns null toastState for non-Merkl transactions', () => {
    setupSelectorMock([createNonMerklTx('tx-1', TransactionStatus.submitted)]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBeNull();
  });

  it('returns "in-progress" when a Merkl claim is approved', () => {
    setupSelectorMock([createMerklClaimTx('tx-1', TransactionStatus.approved)]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');
  });

  it('returns "in-progress" when a Merkl claim is submitted', () => {
    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');
  });

  it('returns "in-progress" when a Merkl claim is signed', () => {
    setupSelectorMock([createMerklClaimTx('tx-1', TransactionStatus.signed)]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');
  });

  it('returns "success" when a pending Merkl claim is confirmed', () => {
    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.confirmed),
    ]);

    rerender();

    expect(result.current.toastState).toBe('success');
  });

  it('returns "failed" when a pending Merkl claim fails', () => {
    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    setupSelectorMock([createMerklClaimTx('tx-1', TransactionStatus.failed)]);

    rerender();

    expect(result.current.toastState).toBe('failed');
  });

  it('returns "failed" when a pending Merkl claim is dropped', () => {
    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    setupSelectorMock([createMerklClaimTx('tx-1', TransactionStatus.dropped)]);

    rerender();

    expect(result.current.toastState).toBe('failed');
  });

  it('dismisses the completion toast when dismissToast is called', () => {
    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.confirmed),
    ]);

    rerender();

    expect(result.current.toastState).toBe('success');

    act(() => {
      result.current.dismissToast();
    });

    expect(result.current.toastState).toBeNull();
  });

  it('does not show completion toast for already-confirmed claims on mount', () => {
    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.confirmed),
    ]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBeNull();
  });

  it('does not show duplicate completion toasts for the same transaction', () => {
    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.confirmed),
    ]);
    rerender();
    expect(result.current.toastState).toBe('success');

    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.toastState).toBeNull();

    rerender();
    expect(result.current.toastState).toBeNull();
  });

  it('handles multiple Merkl claims independently', () => {
    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.confirmed),
      createMerklClaimTx('tx-2', TransactionStatus.submitted),
    ]);

    rerender();

    expect(result.current.toastState).toBe('success');
  });

  it('ignores non-Merkl transactions when detecting transitions', () => {
    setupSelectorMock([
      createNonMerklTx('tx-other', TransactionStatus.submitted),
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    setupSelectorMock([
      createNonMerklTx('tx-other', TransactionStatus.confirmed),
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    rerender();

    expect(result.current.toastState).toBe('in-progress');
  });

  it('dismisses the in-progress toast when dismissToast is called', () => {
    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    act(() => {
      result.current.dismissToast();
    });

    expect(result.current.toastState).toBeNull();

    rerender();
    expect(result.current.toastState).toBeNull();
  });

  it('re-shows toast when a new claim appears after dismissal', () => {
    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
    ]);

    const { result, rerender } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBe('in-progress');

    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.toastState).toBeNull();

    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.submitted),
      createMerklClaimTx('tx-2', TransactionStatus.submitted),
    ]);

    rerender();

    expect(result.current.toastState).toBe('in-progress');
  });

  it('is case-insensitive for distributor address matching', () => {
    setupSelectorMock([
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

  describe('claim amount analytics via resolveClaimAmount', () => {
    it('includes resolved claim amount for confirmed status', async () => {
      mockResolveClaimAmount.mockResolvedValue('5000000');

      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.submitted, {
          chainId: '0x1',
          txParams: {
            to: MERKL_DISTRIBUTOR_ADDRESS,
            data: '0xabcdef',
          },
        }),
      ]);

      const { rerender } = renderHook(() => useMerklClaimStatus());

      mockTrackEvent.mockClear();

      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.confirmed, {
          chainId: '0x1',
          txParams: {
            to: MERKL_DISTRIBUTOR_ADDRESS,
            data: '0xabcdef',
          },
        }),
      ]);

      rerender();

      // Wait for the async resolveClaimAmount to settle
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const confirmedCall = mockTrackEvent.mock.calls.find(
        (call: unknown[]) =>
          (call[0] as Record<string, Record<string, string>>)?.properties
            ?.transaction_status === 'confirmed',
      );

      expect(confirmedCall).toBeDefined();
      const confirmedProps = (
        confirmedCall?.[0] as Record<string, Record<string, string>>
      )?.properties;
      expect(confirmedProps?.amount_claimed_decimal).toBe('5000000');
    });

    it('proceeds without amount when resolveClaimAmount throws', async () => {
      mockResolveClaimAmount.mockRejectedValue(new Error('RPC failure'));

      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.submitted, {
          chainId: '0x1',
          txParams: {
            to: MERKL_DISTRIBUTOR_ADDRESS,
            data: '0xbaddata',
          },
        }),
      ]);

      const { rerender } = renderHook(() => useMerklClaimStatus());

      mockTrackEvent.mockClear();

      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.confirmed, {
          chainId: '0x1',
          txParams: {
            to: MERKL_DISTRIBUTOR_ADDRESS,
            data: '0xbaddata',
          },
        }),
      ]);

      rerender();

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const confirmedCall = mockTrackEvent.mock.calls.find(
        (call: unknown[]) =>
          (call[0] as Record<string, Record<string, string>>)?.properties
            ?.transaction_status === 'confirmed',
      );

      expect(confirmedCall).toBeDefined();
      const confirmedProps = (
        confirmedCall?.[0] as Record<string, Record<string, string>>
      )?.properties;
      expect(confirmedProps?.amount_claimed_decimal).toBeUndefined();
    });

    it('includes amount for approved status', async () => {
      mockResolveClaimAmount.mockResolvedValue('5000000');

      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.submitted, {
          chainId: '0x1',
          txParams: {
            to: MERKL_DISTRIBUTOR_ADDRESS,
            data: '0xabcdef',
          },
        }),
      ]);

      renderHook(() => useMerklClaimStatus());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const approvedCall = mockTrackEvent.mock.calls.find(
        (call: unknown[]) =>
          (call[0] as Record<string, unknown>)?.properties &&
          (call[0] as Record<string, Record<string, string>>).properties
            .transaction_status === 'approved',
      );

      expect(approvedCall).toBeDefined();
      const approvedProps = (
        approvedCall?.[0] as Record<string, Record<string, string>>
      )?.properties;
      expect(approvedProps?.amount_claimed_decimal).toBe('5000000');
      expect(mockResolveClaimAmount).toHaveBeenCalled();
    });

    it('fires the approved analytics event when tx is first seen as submitted', async () => {
      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.submitted, {
          chainId: '0x1',
          txParams: {
            to: MERKL_DISTRIBUTOR_ADDRESS,
          },
        }),
      ]);

      renderHook(() => useMerklClaimStatus());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            transaction_status: 'approved',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            transaction_id: 'tx-1',
          }),
        }),
      );
    });

    it('fires the approved analytics event when tx is first seen as signed', async () => {
      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.signed, {
          chainId: '0x1',
          txParams: {
            to: MERKL_DISTRIBUTOR_ADDRESS,
          },
        }),
      ]);

      renderHook(() => useMerklClaimStatus());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            transaction_status: 'approved',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            transaction_id: 'tx-1',
          }),
        }),
      );
    });
  });
});
