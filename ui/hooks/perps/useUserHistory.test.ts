import { renderHook, act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import type { UserHistoryItem } from '@metamask/perps-controller';
import { useUserHistory } from './useUserHistory';

const mockSubmitRequestToBackground = jest.fn();

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

describe('useUserHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue([]);
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
    mockSubmitRequestToBackground.mockResolvedValue(mockHistory);

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
    expect(result.current.userHistory).toEqual([]);
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
