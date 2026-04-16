import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import type { UserHistoryItem } from '@metamask/perps-controller';
import { useUserHistory } from './useUserHistory';

const mockSubmitRequestToBackground = jest.fn();

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

const mockSubscribe = jest.fn();
const mockPushData = jest.fn();
const mockGetCachedData = jest.fn();
const mockHasCachedData = jest.fn();

jest.mock('../../providers/perps/PerpsStreamManager', () => ({
  getPerpsStreamManager: () => ({
    userHistory: {
      subscribe: mockSubscribe,
      pushData: mockPushData,
      getCachedData: mockGetCachedData,
      hasCachedData: mockHasCachedData,
    },
  }),
}));

describe('useUserHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue([]);
    mockSubscribe.mockReturnValue(jest.fn());
    mockGetCachedData.mockReturnValue([]);
    mockHasCachedData.mockReturnValue(false);
  });

  it('initializes with empty state when no cached data', () => {
    const { result } = renderHook(() => useUserHistory());

    expect(result.current.userHistory).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('initializes with cached data when available', () => {
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
    mockHasCachedData.mockReturnValue(true);
    mockGetCachedData.mockReturnValue(cachedHistory);

    const { result } = renderHook(() => useUserHistory());

    expect(result.current.userHistory).toEqual(cachedHistory);
  });

  it('subscribes to the userHistory channel on mount', () => {
    renderHook(() => useUserHistory());

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  it('unsubscribes from the channel on unmount', () => {
    const unsubscribe = jest.fn();
    mockSubscribe.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useUserHistory());
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('updates state when channel pushes new data', () => {
    let channelCallback: ((data: UserHistoryItem[]) => void) | undefined;
    mockSubscribe.mockImplementation(
      (cb: (data: UserHistoryItem[]) => void) => {
        channelCallback = cb;
        return jest.fn();
      },
    );

    const { result } = renderHook(() => useUserHistory());

    const newHistory: UserHistoryItem[] = [
      {
        id: 'pushed-001',
        timestamp: Date.now(),
        type: 'withdrawal',
        amount: '200.00',
        asset: 'USDC',
        txHash: '0xpushed',
        status: 'completed',
        details: { source: '0xbbb' },
      },
    ];

    act(() => {
      channelCallback?.(newHistory);
    });

    expect(result.current.userHistory).toEqual(newHistory);
  });

  it('fetches user history on refetch and pushes to channel', async () => {
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
    mockSubmitRequestToBackground.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useUserHistory());

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockPushData).toHaveBeenCalledWith(mockHistory);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('passes params to getUserHistory', async () => {
    const { result } = renderHook(() =>
      useUserHistory({
        startTime: 1000,
        endTime: 2000,
        accountId: 'eip155:1:0xabc' as `${string}:${string}:${string}`,
      }),
    );

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetUserHistory',
      [{ startTime: 1000, endTime: 2000, accountId: 'eip155:1:0xabc' }],
    );
  });

  it('sets loading state during fetch', async () => {
    mockSubmitRequestToBackground.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([]), 100);
        }),
    );

    const { result } = renderHook(() => useUserHistory());

    act(() => {
      result.current.refetch();
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('handles errors gracefully', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUserHistory());

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.isLoading).toBe(false);
  });

  it('handles non-Error rejections', async () => {
    mockSubmitRequestToBackground.mockRejectedValue('String error');

    const { result } = renderHook(() => useUserHistory());

    await act(async () => {
      await result.current.refetch();
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
    mockSubmitRequestToBackground.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useUserHistory());

    let returnedHistory: UserHistoryItem[] = [];
    await act(async () => {
      returnedHistory = await result.current.refetch();
    });

    expect(returnedHistory).toEqual(mockHistory);
  });
});
