import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import type { UserHistoryItem } from '@metamask/perps-controller';
import { useUserHistory } from './useUserHistory';

const mockFetchUserHistory = jest.fn();
const mockPeekCachedUserHistory = jest.fn();

jest.mock('../../providers/perps/perps-cache', () => ({
  fetchUserHistory: (...args: unknown[]) => mockFetchUserHistory(...args),
  peekCachedUserHistory: (...args: unknown[]) =>
    mockPeekCachedUserHistory(...args),
}));

describe('useUserHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchUserHistory.mockResolvedValue([]);
    mockPeekCachedUserHistory.mockReturnValue(undefined);
  });

  it('initializes with empty state when no cached data', async () => {
    const { result } = renderHook(() => useUserHistory());

    expect(result.current.userHistory).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('initializes with cached data when available', async () => {
    const cachedHistory: UserHistoryItem[] = [
      {
        id: 'cached-001',
        timestamp: Date.now(),
        type: 'deposit',
        amount: '500.00',
        asset: 'USDC',
        txHash: '0xcached',
        status: 'completed',
        details: { source: '0xaaa' },
      },
    ];
    mockPeekCachedUserHistory.mockReturnValue(cachedHistory);
    mockFetchUserHistory.mockResolvedValue(cachedHistory);

    const { result } = renderHook(() => useUserHistory());

    expect(result.current.userHistory).toEqual(cachedHistory);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('fetches on mount via the keyed cache', async () => {
    const mockHistory: UserHistoryItem[] = [
      {
        id: 'history-001',
        timestamp: Date.now(),
        type: 'deposit',
        amount: '1000.00',
        asset: 'USDC',
        txHash: '0x123',
        status: 'completed',
        details: { source: '0xabc' },
      },
    ];
    mockFetchUserHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useUserHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchUserHistory).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
    );
    expect(result.current.userHistory).toEqual(mockHistory);
    expect(result.current.error).toBeNull();
  });

  it('passes params to fetchUserHistory', async () => {
    mockFetchUserHistory.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useUserHistory({
        startTime: 1000,
        endTime: 2000,
        accountId: 'eip155:1:0xabc' as `${string}:${string}:${string}`,
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchUserHistory).toHaveBeenCalledWith(
      1000,
      2000,
      'eip155:1:0xabc',
    );
  });

  it('refetches when params change', async () => {
    mockFetchUserHistory.mockResolvedValue([]);

    const { result, rerender } = renderHook(
      (props: { startTime?: number }) =>
        useUserHistory({ startTime: props.startTime }),
      { initialProps: { startTime: 1000 } },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetchUserHistory).toHaveBeenCalledWith(1000, undefined, undefined);

    mockFetchUserHistory.mockClear();
    rerender({ startTime: 2000 });

    await waitFor(() => {
      expect(mockFetchUserHistory).toHaveBeenCalledWith(
        2000,
        undefined,
        undefined,
      );
    });
  });

  it('sets loading state during fetch', async () => {
    mockFetchUserHistory.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([]), 100);
        }),
    );

    const { result } = renderHook(() => useUserHistory());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('handles errors gracefully', async () => {
    mockFetchUserHistory.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUserHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('handles non-Error rejections', async () => {
    mockFetchUserHistory.mockRejectedValue('String error');

    const { result } = renderHook(() => useUserHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch user history');
  });

  it('returns fetched history from refetch', async () => {
    const mockHistory: UserHistoryItem[] = [
      {
        id: 'history-001',
        timestamp: Date.now(),
        type: 'withdrawal',
        amount: '500.00',
        asset: 'USDC',
        txHash: '0x456',
        status: 'completed',
        details: { source: '0xdef' },
      },
    ];
    mockFetchUserHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useUserHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let returnedHistory: UserHistoryItem[] = [];
    await act(async () => {
      returnedHistory = await result.current.refetch();
    });

    expect(returnedHistory).toEqual(mockHistory);
  });
});
