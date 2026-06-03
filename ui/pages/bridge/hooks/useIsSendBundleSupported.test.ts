import { renderHook } from '@testing-library/react-hooks';
import { act, waitFor } from '@testing-library/react';
import { useIsSendBundleSupported } from './useIsSendBundleSupported';

jest.mock('../../../store/actions', () => ({
  isSendBundleSupported: jest.fn(),
}));

describe('useIsSendBundleSupported', () => {
  const mockIsSendBundleSupported = jest.requireMock(
    '../../../store/actions',
  ).isSendBundleSupported;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns false when fromChain is null', () => {
    const { result } = renderHook(() => useIsSendBundleSupported(null));

    expect(result.current).toBe(false);
    expect(mockIsSendBundleSupported).not.toHaveBeenCalled();
  });

  it('returns false when fromChain is undefined', () => {
    const { result } = renderHook(() => useIsSendBundleSupported(undefined));

    expect(result.current).toBe(false);
    expect(mockIsSendBundleSupported).not.toHaveBeenCalled();
  });

  it('returns false when fromChain has no chainId', () => {
    const { result } = renderHook(() =>
      useIsSendBundleSupported({ chainId: '' }),
    );

    expect(result.current).toBe(false);
    expect(mockIsSendBundleSupported).not.toHaveBeenCalled();
  });

  it('returns true when send bundle is supported', async () => {
    mockIsSendBundleSupported.mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useIsSendBundleSupported({ chainId: '0x1' }),
    );

    await waitForNextUpdate();

    expect(result.current).toBe(true);
    expect(mockIsSendBundleSupported).toHaveBeenCalledWith('0x1');
  });

  it('returns false when send bundle is not supported', async () => {
    mockIsSendBundleSupported.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useIsSendBundleSupported({ chainId: '0x1' }),
    );

    // Initial state should be false
    expect(result.current).toBe(false);

    // Wait for async operations to complete
    await act(async () => {
      await Promise.resolve();
    });

    // Should still be false
    expect(result.current).toBe(false);
    expect(mockIsSendBundleSupported).toHaveBeenCalledWith('0x1');
  });

  it('handles errors gracefully and returns false', async () => {
    mockIsSendBundleSupported.mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() =>
      useIsSendBundleSupported({ chainId: '0x1' }),
    );

    // Initial state should be false
    expect(result.current).toBe(false);

    // Wait for async operations to complete
    await act(async () => {
      await Promise.resolve();
    });

    // Should still be false after error
    expect(result.current).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      'Error checking send bundle support:',
      expect.any(Error),
    );
  });

  it('updates when chainId changes', async () => {
    mockIsSendBundleSupported
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ chainId }) => useIsSendBundleSupported({ chainId }),
      {
        initialProps: { chainId: '0x1' },
      },
    );

    await waitForNextUpdate();
    expect(result.current).toBe(true);

    // Change chainId
    rerender({ chainId: '0x2' });

    await waitForNextUpdate();
    expect(result.current).toBe(false);
    expect(mockIsSendBundleSupported).toHaveBeenCalledTimes(2);
    expect(mockIsSendBundleSupported).toHaveBeenNthCalledWith(1, '0x1');
    expect(mockIsSendBundleSupported).toHaveBeenNthCalledWith(2, '0x2');
  });

  describe('Race condition handling', () => {
    it('should not update state when component unmounts before async operation completes', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockIsSendBundleSupported.mockReturnValue(promise);

      const { result, unmount } = renderHook(() =>
        useIsSendBundleSupported({ chainId: '0x1' }),
      );

      // Initial state should be false
      expect(result.current).toBe(false);

      // Unmount before the promise resolves
      unmount();

      // Now resolve the promise
      await act(async () => {
        resolvePromise?.(true);
        await Promise.resolve();
      });

      // State should still be false since component unmounted
      expect(result.current).toBe(false);
    });

    it('should not update state with stale results when chainId changes', async () => {
      let resolveFirst: (value: unknown) => void;
      let resolveSecond: (value: unknown) => void;
      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve;
      });

      mockIsSendBundleSupported
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { result, rerender } = renderHook(
        ({ chainId }) => useIsSendBundleSupported({ chainId }),
        {
          initialProps: { chainId: '0x1' },
        },
      );

      // Initial state should be false
      expect(result.current).toBe(false);

      // Change chainId (this triggers a new effect)
      rerender({ chainId: '0x2' });

      // Resolve the second request first
      await act(async () => {
        resolveSecond?.(false);
        await Promise.resolve();
      });

      // State should be false based on second request
      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      // Now resolve the first (stale) request
      await act(async () => {
        resolveFirst?.(true);
        await Promise.resolve();
      });

      // State should still be false (not updated by stale request)
      expect(result.current).toBe(false);
    });

    it('should handle rapid chainId changes without race conditions', async () => {
      const chainIds = ['0x1', '0x2', '0x3', '0x4', '0x5'];

      // Mock responses - only return true for the last chainId
      mockIsSendBundleSupported.mockImplementation((chainId: string) => {
        return Promise.resolve(chainId === '0x5');
      });

      const { result, rerender } = renderHook(
        ({ chainId }) => useIsSendBundleSupported({ chainId }),
        {
          initialProps: { chainId: chainIds[0] },
        },
      );

      // Rapidly change chainIds
      for (const chainId of chainIds) {
        rerender({ chainId });
      }

      // Wait for all effects to settle
      await act(async () => {
        await Promise.resolve();
      });

      await waitFor(() => {
        // Final state should reflect the last chainId (true for 0x5)
        expect(result.current).toBe(true);
      });
    });
  });
});
