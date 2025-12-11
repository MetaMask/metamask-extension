import { act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import usePolling from './usePolling';

describe('usePolling', () => {
  it('calls startPolling with input when component mounts', async () => {
    const mockStart = jest.fn().mockResolvedValue('pollingToken');
    const input = { networkClientId: 'mainnet' };

    renderHook(() =>
      usePolling({
        startPolling: mockStart,
        stopPollingByPollingToken: jest.fn(),
        input,
      }),
    );

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledWith(input);
    });
  });

  it('calls stopPollingByPollingToken when unmounted', async () => {
    const mockStart = jest.fn().mockResolvedValue('pollingToken');
    const mockStop = jest.fn();
    const input = { networkClientId: 'mainnet' };

    const { unmount } = renderHook(() =>
      usePolling({
        startPolling: mockStart,
        stopPollingByPollingToken: mockStop,
        input,
      }),
    );

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });

    act(() => {
      unmount();
    });

    expect(mockStop).toHaveBeenCalledWith('pollingToken');
  });

  it('does not call startPolling when enabled is false', async () => {
    const mockStart = jest.fn().mockResolvedValue('pollingToken');
    const mockStop = jest.fn();
    const input = { networkClientId: 'mainnet' };

    renderHook(() =>
      usePolling({
        startPolling: mockStart,
        stopPollingByPollingToken: mockStop,
        input,
        enabled: false,
      }),
    );

    // Give the effect a chance to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockStart).not.toHaveBeenCalled();
  });

  it('stops existing poll and does not start new one when enabled changes to false', async () => {
    const mockStart = jest.fn().mockResolvedValue('pollingToken');
    const mockStop = jest.fn();
    const input = { networkClientId: 'mainnet' };

    const { rerender } = renderHook(
      ({ enabled }) =>
        usePolling({
          startPolling: mockStart,
          stopPollingByPollingToken: mockStop,
          input,
          enabled,
        }),
      { initialProps: { enabled: true } },
    );

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledTimes(1);
    });

    rerender({ enabled: false });

    await waitFor(() => {
      expect(mockStop).toHaveBeenCalledWith('pollingToken');
    });
  });

  it('restarts polling when input changes', async () => {
    const mockStart = jest
      .fn()
      .mockResolvedValueOnce('pollingToken1')
      .mockResolvedValueOnce('pollingToken2');
    const mockStop = jest.fn();

    const { rerender } = renderHook(
      ({ input }) =>
        usePolling({
          startPolling: mockStart,
          stopPollingByPollingToken: mockStop,
          input,
        }),
      { initialProps: { input: { networkClientId: 'mainnet' } } },
    );

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledWith({ networkClientId: 'mainnet' });
    });

    rerender({ input: { networkClientId: 'goerli' } });

    await waitFor(() => {
      expect(mockStop).toHaveBeenCalledWith('pollingToken1');
      expect(mockStart).toHaveBeenCalledWith({ networkClientId: 'goerli' });
    });
  });

  it('handles race conditions by stopping stale polls', async () => {
    let resolveFirst: (value: string) => void;
    let resolveSecond: (value: string) => void;

    const mockStart = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            resolveSecond = resolve;
          }),
      );
    const mockStop = jest.fn();

    const { rerender } = renderHook(
      ({ input }) =>
        usePolling({
          startPolling: mockStart,
          stopPollingByPollingToken: mockStop,
          input,
        }),
      { initialProps: { input: { networkClientId: 'mainnet' } } },
    );

    // Trigger second call before first resolves
    rerender({ input: { networkClientId: 'goerli' } });

    // Resolve second call first (simulating faster response)
    await act(async () => {
      resolveSecond('pollingToken2');
    });

    // Now resolve first call (stale)
    await act(async () => {
      resolveFirst('pollingToken1');
    });

    // The stale token should be immediately stopped
    await waitFor(() => {
      expect(mockStop).toHaveBeenCalledWith('pollingToken1');
    });
  });
});
