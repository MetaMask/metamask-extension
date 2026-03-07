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
) => ({
  id,
  status,
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

  it('does not fire callback for already-confirmed transactions', () => {
    const onConfirmed = jest.fn();

    // Start with already confirmed transaction
    useSelector.mockReturnValue([
      createMockTransaction('tx1', TransactionStatus.confirmed),
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
});
