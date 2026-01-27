import { renderHook } from '@testing-library/react-hooks';
import * as reactRedux from 'react-redux';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { useRefreshSmartTransactionsLiveness } from './useRefreshSmartTransactionsLiveness';

const mockInnerFn = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  fetchSmartTransactionsLiveness: jest.fn(() => mockInnerFn),
}));

const mockFetchSmartTransactionsLiveness = jest.requireMock(
  '../../../store/actions',
).fetchSmartTransactionsLiveness;

describe('useRefreshSmartTransactionsLiveness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (reactRedux.useSelector as jest.Mock).mockReturnValue(true); // opted in by default
  });

  it('does not fetch when chainId is null', () => {
    renderHook(() => useRefreshSmartTransactionsLiveness(null));
    expect(mockFetchSmartTransactionsLiveness).not.toHaveBeenCalled();
  });

  it('does not fetch when chainId is undefined', () => {
    renderHook(() => useRefreshSmartTransactionsLiveness(undefined));
    expect(mockFetchSmartTransactionsLiveness).not.toHaveBeenCalled();
  });

  it('does not fetch for non-EVM chains', () => {
    renderHook(() => useRefreshSmartTransactionsLiveness('solana:mainnet'));
    expect(mockFetchSmartTransactionsLiveness).not.toHaveBeenCalled();
  });

  it('does not fetch for unsupported EVM chains', () => {
    renderHook(() => useRefreshSmartTransactionsLiveness('0x999'));
    expect(mockFetchSmartTransactionsLiveness).not.toHaveBeenCalled();
  });

  it('does not fetch when user has not opted in', () => {
    (reactRedux.useSelector as jest.Mock).mockReturnValue(false);
    renderHook(() => useRefreshSmartTransactionsLiveness(CHAIN_IDS.MAINNET));
    expect(mockFetchSmartTransactionsLiveness).not.toHaveBeenCalled();
  });

  it('fetches smart transactions liveness for mainnet', () => {
    renderHook(() => useRefreshSmartTransactionsLiveness(CHAIN_IDS.MAINNET));
    expect(mockFetchSmartTransactionsLiveness).toHaveBeenCalledTimes(1);
    expect(mockFetchSmartTransactionsLiveness).toHaveBeenCalledWith({
      chainId: CHAIN_IDS.MAINNET,
    });
    expect(mockInnerFn).toHaveBeenCalledTimes(1);
  });

  it('re-fetches when chainId changes to another supported chain', () => {
    const { rerender } = renderHook<{ chainId: string }, void>(
      ({ chainId }) => useRefreshSmartTransactionsLiveness(chainId),
      { initialProps: { chainId: CHAIN_IDS.MAINNET } },
    );

    expect(mockFetchSmartTransactionsLiveness).toHaveBeenCalledTimes(1);
    expect(mockInnerFn).toHaveBeenCalledTimes(1);

    // BSC is in both production and development allowed lists
    rerender({ chainId: CHAIN_IDS.BSC });
    expect(mockFetchSmartTransactionsLiveness).toHaveBeenCalledTimes(2);
    expect(mockInnerFn).toHaveBeenCalledTimes(2);
  });
});
