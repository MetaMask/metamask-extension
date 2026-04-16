import { Interface } from '@ethersproject/abi';
import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionStatus } from '@metamask/transaction-controller';
import {
  AGLAMERKL_ADDRESS_LINEA,
  DISTRIBUTOR_CLAIM_ABI,
  MERKL_CLAIM_CHAIN_ID,
  MERKL_DISTRIBUTOR_ADDRESS,
  MUSD_TOKEN_ADDRESS,
} from '../../components/app/musd/constants';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { useMerklClaimStatus } from './useMerklClaimStatus';

const MOCK_USER = '0x1234567890abcdef1234567890abcdef12345678';

const mockResolveClaimAmount = jest.fn();
jest.mock('./transaction-amount-utils', () => {
  const actual = jest.requireActual<
    typeof import('./transaction-amount-utils')
  >('./transaction-amount-utils');
  return {
    ...actual,
    resolveClaimAmount: (...args: unknown[]) => mockResolveClaimAmount(...args),
  };
});

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
  [MERKL_CLAIM_CHAIN_ID]: { name: 'Linea' },
};

function encodeClaimData(tokenAddress: string, amount = '5000000'): string {
  const iface = new Interface(DISTRIBUTOR_CLAIM_ABI);
  return iface.encodeFunctionData('claim', [
    [MOCK_USER],
    [tokenAddress],
    [amount],
    [['0x0000000000000000000000000000000000000000000000000000000000000001']],
  ]);
}

const createMerklClaimTx = (
  id: string,
  status: string,
  overrides: Record<string, unknown> = {},
) => {
  const data = encodeClaimData(MUSD_TOKEN_ADDRESS);
  return {
    id,
    status,
    chainId: MERKL_CLAIM_CHAIN_ID,
    txParams: {
      to: MERKL_DISTRIBUTOR_ADDRESS,
      data,
    },
    ...overrides,
  };
};

const createNonMerklTx = (id: string, status: string) => ({
  id,
  status,
  chainId: MERKL_CLAIM_CHAIN_ID,
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

  it('returns null when to is distributor but calldata is not claim', () => {
    setupSelectorMock([
      {
        id: 'tx-1',
        status: TransactionStatus.submitted,
        chainId: MERKL_CLAIM_CHAIN_ID,
        txParams: {
          to: MERKL_DISTRIBUTOR_ADDRESS,
          data: '0xdeadbeef',
        },
      },
    ]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBeNull();
  });

  it('returns null when chain is not Linea', () => {
    setupSelectorMock([
      createMerklClaimTx('tx-1', TransactionStatus.submitted, {
        chainId: CHAIN_IDS.MAINNET,
      }),
    ]);

    const { result } = renderHook(() => useMerklClaimStatus());

    expect(result.current.toastState).toBeNull();
  });

  it('returns null when reward token is not mUSD', () => {
    const data = encodeClaimData(AGLAMERKL_ADDRESS_LINEA);
    setupSelectorMock([
      {
        id: 'tx-1',
        status: TransactionStatus.submitted,
        chainId: MERKL_CLAIM_CHAIN_ID,
        txParams: {
          to: MERKL_DISTRIBUTOR_ADDRESS,
          data,
        },
      },
    ]);

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
    const data = encodeClaimData(MUSD_TOKEN_ADDRESS);
    setupSelectorMock([
      {
        id: 'tx-1',
        status: TransactionStatus.submitted,
        chainId: MERKL_CLAIM_CHAIN_ID,
        txParams: {
          to: MERKL_DISTRIBUTOR_ADDRESS.toLowerCase(),
          data,
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
        createMerklClaimTx('tx-1', TransactionStatus.submitted),
      ]);

      const { rerender } = renderHook(() => useMerklClaimStatus());

      mockTrackEvent.mockClear();

      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.confirmed),
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
      expect(confirmedProps?.amount_claimed_decimal).toBe('5000000');
      expect(confirmedProps?.network_chain_id).toBe(MERKL_CLAIM_CHAIN_ID);
    });

    it('includes zero mUSD raw amount when resolve returns 0', async () => {
      mockResolveClaimAmount.mockResolvedValue('0');

      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.submitted),
      ]);

      const { rerender } = renderHook(() => useMerklClaimStatus());

      mockTrackEvent.mockClear();

      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.confirmed),
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

      const confirmedProps = (
        confirmedCall?.[0] as Record<string, Record<string, string>>
      )?.properties;
      expect(confirmedProps?.amount_claimed_decimal).toBe('0');
    });

    it('proceeds without amount when resolveClaimAmount throws', async () => {
      mockResolveClaimAmount.mockRejectedValue(new Error('RPC failure'));

      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.submitted),
      ]);

      const { rerender } = renderHook(() => useMerklClaimStatus());

      mockTrackEvent.mockClear();

      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.confirmed),
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
        createMerklClaimTx('tx-1', TransactionStatus.submitted),
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
      expect(approvedProps?.network_chain_id).toBe(MERKL_CLAIM_CHAIN_ID);
      expect(mockResolveClaimAmount).toHaveBeenCalled();
    });

    it('fires the approved analytics event when tx is first seen as submitted', async () => {
      setupSelectorMock([
        createMerklClaimTx('tx-1', TransactionStatus.submitted),
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
            // eslint-disable-next-line @typescript-eslint/naming-convention
            network_chain_id: MERKL_CLAIM_CHAIN_ID,
          }),
        }),
      );
    });

    it('fires the approved analytics event when tx is first seen as signed', async () => {
      setupSelectorMock([createMerklClaimTx('tx-1', TransactionStatus.signed)]);

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

    it('does not fire analytics for distributor + Linea without claim calldata', async () => {
      setupSelectorMock([
        {
          id: 'tx-1',
          status: TransactionStatus.submitted,
          chainId: MERKL_CLAIM_CHAIN_ID,
          txParams: { to: MERKL_DISTRIBUTOR_ADDRESS },
        },
      ]);

      renderHook(() => useMerklClaimStatus());

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockTrackEvent).not.toHaveBeenCalled();
    });
  });
});
