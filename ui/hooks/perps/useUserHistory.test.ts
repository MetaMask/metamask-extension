import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { useUserHistory } from './useUserHistory';
import type { UserHistoryItem } from '@metamask/perps-controller';

// Mock the perps provider
const mockGetUserHistory = jest.fn();
const mockGetActiveProvider = jest.fn(() => ({
  getUserHistory: mockGetUserHistory,
}));
const mockController = {
  getActiveProvider: mockGetActiveProvider,
};

jest.mock('../../providers/perps', () => ({
  usePerpsController: () => mockController,
}));

describe('useUserHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserHistory.mockResolvedValue([]);
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useUserHistory());

    expect(result.current.userHistory).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('fetches user history on refetch', async () => {
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
    mockGetUserHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useUserHistory());

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.userHistory).toEqual(mockHistory);
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

    expect(mockGetUserHistory).toHaveBeenCalledWith({
      startTime: 1000,
      endTime: 2000,
      accountId: 'eip155:1:0xabc',
    });
  });

  it('sets loading state during fetch', async () => {
    mockGetUserHistory.mockImplementation(
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
    mockGetUserHistory.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUserHistory());

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.userHistory).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles non-Error rejections', async () => {
    mockGetUserHistory.mockRejectedValue('String error');

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
    mockGetUserHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useUserHistory());

    let returnedHistory: UserHistoryItem[] = [];
    await act(async () => {
      returnedHistory = await result.current.refetch();
    });

    expect(returnedHistory).toEqual(mockHistory);
  });
});
