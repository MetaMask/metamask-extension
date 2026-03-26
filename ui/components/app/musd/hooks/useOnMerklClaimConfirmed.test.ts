import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionStatus } from '@metamask/transaction-controller';
import { MERKL_DISTRIBUTOR_ADDRESS } from '../constants';
import { useOnMerklClaimConfirmed } from './useOnMerklClaimConfirmed';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const { useSelector } = jest.requireMock('react-redux');

const createMockTransaction = (
  id: string,
  status: string,
  to: string = MERKL_DISTRIBUTOR_ADDRESS,
  time: number = Date.now(),
) => ({
  id,
  status,
  time,
  txParams: { to },
});

describe('useOnMerklClaimConfirmed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fires callback when pending claim becomes confirmed', () => {
    const onConfirmed = jest.fn();

    // Start with a pending transaction
    useSelector.mockReturnValue([
      createMockTransaction('tx1', TransactionStatus.submitted),
    ]);

    const { rerender } = renderHook(() =>
      useOnMerklClaimConfirmed(onConfirmed),
    );

    // Transaction becomes confirmed
    useSelector.mockReturnValue([
      createMockTransaction('tx1', TransactionStatus.confirmed),
    ]);

    act(() => {
      rerender();
    });

    expect(onConfirmed).toHaveBeenCalledTimes(1);
  });

  it('does not fire callback for already-confirmed transactions with no time field', () => {
    const onConfirmed = jest.fn();

    // Start with already confirmed transaction but no time field (old tx, no time data)
    useSelector.mockReturnValue([
      {
        id: 'tx1',
        status: TransactionStatus.confirmed,
        txParams: { to: MERKL_DISTRIBUTOR_ADDRESS },
      },
    ]);

    renderHook(() => useOnMerklClaimConfirmed(onConfirmed));

    expect(onConfirmed).not.toHaveBeenCalled();
  });

  it('does not fire callback for non-Merkl transactions', () => {
    const onConfirmed = jest.fn();

    // Start with a pending non-Merkl transaction
    useSelector.mockReturnValue([
      createMockTransaction(
        'tx1',
        TransactionStatus.submitted,
        '0xOtherAddress',
      ),
    ]);

    const { rerender } = renderHook(() =>
      useOnMerklClaimConfirmed(onConfirmed),
    );

    // Transaction becomes confirmed
    useSelector.mockReturnValue([
      createMockTransaction(
        'tx1',
        TransactionStatus.confirmed,
        '0xOtherAddress',
      ),
    ]);

    act(() => {
      rerender();
    });

    expect(onConfirmed).not.toHaveBeenCalled();
  });

  describe('remount after confirmation flow', () => {
    it('fires callback on mount when a recent confirmed claim exists', () => {
      const onConfirmed = jest.fn();

      // Component mounts with an already-confirmed tx that happened recently
      useSelector.mockReturnValue([
        createMockTransaction(
          'tx1',
          TransactionStatus.confirmed,
          MERKL_DISTRIBUTOR_ADDRESS,
          Date.now() - 30_000,
        ),
      ]);

      renderHook(() => useOnMerklClaimConfirmed(onConfirmed));

      expect(onConfirmed).toHaveBeenCalledTimes(1);
    });

    it('does not fire callback on mount for an old confirmed claim (beyond 5-minute window)', () => {
      const onConfirmed = jest.fn();

      // Confirmed tx is 10 minutes old — should not trigger
      const TEN_MINUTES_AGO = Date.now() - 10 * 60 * 1000;
      useSelector.mockReturnValue([
        createMockTransaction(
          'tx1',
          TransactionStatus.confirmed,
          MERKL_DISTRIBUTOR_ADDRESS,
          TEN_MINUTES_AGO,
        ),
      ]);

      renderHook(() => useOnMerklClaimConfirmed(onConfirmed));

      expect(onConfirmed).not.toHaveBeenCalled();
    });

    it('does not fire the on-mount callback again on subsequent renders', () => {
      const onConfirmed = jest.fn();

      useSelector.mockReturnValue([
        createMockTransaction(
          'tx1',
          TransactionStatus.confirmed,
          MERKL_DISTRIBUTOR_ADDRESS,
          Date.now() - 30_000,
        ),
      ]);

      const { rerender } = renderHook(() =>
        useOnMerklClaimConfirmed(onConfirmed),
      );

      // Subsequent re-renders with same data should not re-fire
      act(() => {
        rerender();
      });
      act(() => {
        rerender();
      });

      expect(onConfirmed).toHaveBeenCalledTimes(1);
    });

    it('does not fire on-mount callback for a recently confirmed non-Merkl tx', () => {
      const onConfirmed = jest.fn();

      useSelector.mockReturnValue([
        createMockTransaction(
          'tx1',
          TransactionStatus.confirmed,
          '0xOtherAddress',
          Date.now() - 30_000,
        ),
      ]);

      renderHook(() => useOnMerklClaimConfirmed(onConfirmed));

      expect(onConfirmed).not.toHaveBeenCalled();
    });
  });
});
