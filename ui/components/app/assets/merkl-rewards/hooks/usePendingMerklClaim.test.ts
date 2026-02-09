import { renderHook, act } from '@testing-library/react-hooks';
import { TransactionStatus } from '@metamask/transaction-controller';
import { MERKL_DISTRIBUTOR_ADDRESS } from '../constants';
import { usePendingMerklClaim } from './usePendingMerklClaim';

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

describe('usePendingMerklClaim', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns hasPendingClaim=false when no transactions', () => {
    useSelector.mockReturnValue([]);

    const { result } = renderHook(() => usePendingMerklClaim());

    expect(result.current.hasPendingClaim).toBe(false);
  });

  it('returns hasPendingClaim=true when submitted claim exists', () => {
    useSelector.mockReturnValue([
      createMockTransaction('tx1', TransactionStatus.submitted),
    ]);

    const { result } = renderHook(() => usePendingMerklClaim());

    expect(result.current.hasPendingClaim).toBe(true);
  });

  it('returns hasPendingClaim=true when approved claim exists', () => {
    useSelector.mockReturnValue([
      createMockTransaction('tx1', TransactionStatus.approved),
    ]);

    const { result } = renderHook(() => usePendingMerklClaim());

    expect(result.current.hasPendingClaim).toBe(true);
  });

  it('returns hasPendingClaim=true when signed claim exists', () => {
    useSelector.mockReturnValue([
      createMockTransaction('tx1', TransactionStatus.signed),
    ]);

    const { result } = renderHook(() => usePendingMerklClaim());

    expect(result.current.hasPendingClaim).toBe(true);
  });

  it('returns hasPendingClaim=false when claim is confirmed', () => {
    useSelector.mockReturnValue([
      createMockTransaction('tx1', TransactionStatus.confirmed),
    ]);

    const { result } = renderHook(() => usePendingMerklClaim());

    expect(result.current.hasPendingClaim).toBe(false);
  });

  it('returns hasPendingClaim=false when claim is failed', () => {
    useSelector.mockReturnValue([
      createMockTransaction('tx1', TransactionStatus.failed),
    ]);

    const { result } = renderHook(() => usePendingMerklClaim());

    expect(result.current.hasPendingClaim).toBe(false);
  });

  it('ignores transactions to other addresses', () => {
    useSelector.mockReturnValue([
      createMockTransaction(
        'tx1',
        TransactionStatus.submitted,
        '0xOtherAddress',
      ),
    ]);

    const { result } = renderHook(() => usePendingMerklClaim());

    expect(result.current.hasPendingClaim).toBe(false);
  });

  it('matches distributor address case-insensitively', () => {
    useSelector.mockReturnValue([
      createMockTransaction(
        'tx1',
        TransactionStatus.submitted,
        MERKL_DISTRIBUTOR_ADDRESS.toLowerCase(),
      ),
    ]);

    const { result } = renderHook(() => usePendingMerklClaim());

    expect(result.current.hasPendingClaim).toBe(true);
  });

  it('fires onClaimConfirmed when pending claim becomes confirmed', () => {
    const onClaimConfirmed = jest.fn();

    // Start with a pending transaction
    useSelector.mockReturnValue([
      createMockTransaction('tx1', TransactionStatus.submitted),
    ]);

    const { rerender } = renderHook(() =>
      usePendingMerklClaim({ onClaimConfirmed }),
    );

    // Transaction becomes confirmed
    useSelector.mockReturnValue([
      createMockTransaction('tx1', TransactionStatus.confirmed),
    ]);

    act(() => {
      rerender();
    });

    expect(onClaimConfirmed).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClaimConfirmed for already-confirmed transactions', () => {
    const onClaimConfirmed = jest.fn();

    // Start with already confirmed transaction
    useSelector.mockReturnValue([
      createMockTransaction('tx1', TransactionStatus.confirmed),
    ]);

    renderHook(() => usePendingMerklClaim({ onClaimConfirmed }));

    expect(onClaimConfirmed).not.toHaveBeenCalled();
  });
});
