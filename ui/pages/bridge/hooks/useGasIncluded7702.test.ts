import { renderHook } from '@testing-library/react-hooks';
import { act, waitFor } from '@testing-library/react';
import { useGasIncluded7702 } from './useGasIncluded7702';

jest.mock('../../../store/actions', () => ({
  isRelaySupported: jest.fn(),
}));

jest.mock('../../../store/controller-actions/transaction-controller', () => ({
  isAtomicBatchSupported: jest.fn(),
}));

describe('useGasIncluded7702', () => {
  const mockIsRelaySupported = jest.requireMock(
    '../../../store/actions',
  ).isRelaySupported;
  const mockIsAtomicBatchSupported = jest.requireMock(
    '../../../store/controller-actions/transaction-controller',
  ).isAtomicBatchSupported;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns false when smartAccountOptIn is false', () => {
    const { result } = renderHook(() =>
      useGasIncluded7702(false, true, { address: '0x123' }, { chainId: '0x1' }),
    );

    expect(result.current).toBe(false);
    expect(mockIsAtomicBatchSupported).not.toHaveBeenCalled();
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
  });

  it('returns false when isSwap is false', () => {
    const { result } = renderHook(() =>
      useGasIncluded7702(true, false, { address: '0x123' }, { chainId: '0x1' }),
    );

    expect(result.current).toBe(false);
    expect(mockIsAtomicBatchSupported).not.toHaveBeenCalled();
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
  });

  it('returns false when selectedAccount is null', () => {
    const { result } = renderHook(() =>
      useGasIncluded7702(true, true, null, { chainId: '0x1' }),
    );

    expect(result.current).toBe(false);
    expect(mockIsAtomicBatchSupported).not.toHaveBeenCalled();
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
  });

  it('returns false when fromChain is null', () => {
    const { result } = renderHook(() =>
      useGasIncluded7702(true, true, { address: '0x123' }, null),
    );

    expect(result.current).toBe(false);
    expect(mockIsAtomicBatchSupported).not.toHaveBeenCalled();
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
  });

  it('returns true when both atomic batch and relay are supported', async () => {
    mockIsAtomicBatchSupported.mockResolvedValue([
      { chainId: '0x1', isSupported: true },
    ]);
    mockIsRelaySupported.mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useGasIncluded7702(true, true, { address: '0x123' }, { chainId: '0x1' }),
    );

    await waitForNextUpdate();

    expect(result.current).toBe(true);
    expect(mockIsAtomicBatchSupported).toHaveBeenCalledWith({
      address: '0x123',
      chainIds: ['0x1'],
    });
    expect(mockIsRelaySupported).toHaveBeenCalledWith('0x1');
  });

  it('returns false when atomic batch is not supported', async () => {
    mockIsAtomicBatchSupported.mockResolvedValue([
      { chainId: '0x1', isSupported: false },
    ]);
    mockIsRelaySupported.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useGasIncluded7702(true, true, { address: '0x123' }, { chainId: '0x1' }),
    );

    // Initial state should be false
    expect(result.current).toBe(false);

    // Wait for async operations to complete
    await act(async () => {
      await Promise.resolve();
    });

    // Verify the mocks were called
    expect(mockIsAtomicBatchSupported).toHaveBeenCalled();
  });

  it('returns false when relay is not supported', async () => {
    mockIsAtomicBatchSupported.mockResolvedValue([
      { chainId: '0x1', isSupported: true },
    ]);
    mockIsRelaySupported.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useGasIncluded7702(true, true, { address: '0x123' }, { chainId: '0x1' }),
    );

    // Initial state should be false
    expect(result.current).toBe(false);

    // Wait for async operations to complete
    await act(async () => {
      await Promise.resolve();
    });

    // Verify the mocks were called
    expect(mockIsRelaySupported).toHaveBeenCalled();
  });

  it('handles errors gracefully and returns false', async () => {
    mockIsAtomicBatchSupported.mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() =>
      useGasIncluded7702(true, true, { address: '0x123' }, { chainId: '0x1' }),
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
      'Error checking gasless 7702 support:',
      expect.any(Error),
    );
  });

  it('handles case-insensitive chainId comparison', async () => {
    mockIsAtomicBatchSupported.mockResolvedValue([
      { chainId: '0X1', isSupported: true },
    ]);
    mockIsRelaySupported.mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() =>
      useGasIncluded7702(true, true, { address: '0x123' }, { chainId: '0x1' }),
    );

    await waitForNextUpdate();
    expect(result.current).toBe(true);
  });

  it('returns false when no matching chain in atomic batch result', async () => {
    mockIsAtomicBatchSupported.mockResolvedValue([
      { chainId: '0x2', isSupported: true },
    ]);
    mockIsRelaySupported.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useGasIncluded7702(true, true, { address: '0x123' }, { chainId: '0x1' }),
    );

    // Initial state should be false
    expect(result.current).toBe(false);

    // Wait for async operations to complete
    await act(async () => {
      await Promise.resolve();
    });

    // Verify the mocks were called
    expect(mockIsAtomicBatchSupported).toHaveBeenCalled();
  });

  describe('Race condition handling', () => {
    it('should not update state when component unmounts before async operations complete', async () => {
      // Create a promise that we can control when it resolves
      let resolveAtomicBatch: (value: unknown) => void;
      const atomicBatchPromise = new Promise((resolve) => {
        resolveAtomicBatch = resolve;
      });

      mockIsAtomicBatchSupported.mockReturnValue(atomicBatchPromise);
      mockIsRelaySupported.mockResolvedValue(true);

      const { result, unmount } = renderHook(() =>
        useGasIncluded7702(
          true,
          true,
          { address: '0x123' },
          { chainId: '0x1' },
        ),
      );

      // Initial state should be false
      expect(result.current).toBe(false);

      // Unmount before the promise resolves
      unmount();

      // Now resolve the promise
      await act(async () => {
        resolveAtomicBatch?.([{ chainId: '0x1', isSupported: true }]);
        await Promise.resolve();
      });

      // State should still be false since component unmounted
      expect(result.current).toBe(false);
    });

    it('should not update state with stale results when dependencies change', async () => {
      // Create promises that we can control
      let resolveFirstAtomicBatch: (value: unknown) => void;
      let resolveSecondAtomicBatch: (value: unknown) => void;
      const firstAtomicBatchPromise = new Promise((resolve) => {
        resolveFirstAtomicBatch = resolve;
      });
      const secondAtomicBatchPromise = new Promise((resolve) => {
        resolveSecondAtomicBatch = resolve;
      });

      mockIsAtomicBatchSupported
        .mockReturnValueOnce(firstAtomicBatchPromise)
        .mockReturnValueOnce(secondAtomicBatchPromise);
      mockIsRelaySupported.mockResolvedValue(true);

      const { result, rerender } = renderHook(
        ({ address, chainId }) =>
          useGasIncluded7702(true, true, { address }, { chainId }),
        {
          initialProps: { address: '0x123', chainId: '0x1' },
        },
      );

      // Initial state should be false
      expect(result.current).toBe(false);

      // Change props (this triggers a new effect)
      rerender({ address: '0x456', chainId: '0x2' });

      // Resolve the second request first
      await act(async () => {
        resolveSecondAtomicBatch?.([{ chainId: '0x2', isSupported: false }]);
        await Promise.resolve();
      });

      // State should be false based on second request
      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      // Now resolve the first (stale) request
      await act(async () => {
        resolveFirstAtomicBatch?.([{ chainId: '0x1', isSupported: true }]);
        await Promise.resolve();
      });

      // State should still be false (not updated by stale request)
      expect(result.current).toBe(false);
    });

    it('should handle rapid prop changes without race conditions', async () => {
      const addresses = ['0x111', '0x222', '0x333'];
      const chainIds = ['0x1', '0x2', '0x3'];

      // Mock responses for each combination
      mockIsAtomicBatchSupported.mockImplementation(
        ({
          address,
          chainIds: chains,
        }: {
          address: string;
          chainIds: string[];
        }) => {
          const addrIndex = addresses.indexOf(address);
          const chainIndex = chainIds.indexOf(chains[0]);
          // Only return true for the last combination
          const isSupported = addrIndex === 2 && chainIndex === 2;
          return Promise.resolve([{ chainId: chains[0], isSupported }]);
        },
      );
      mockIsRelaySupported.mockResolvedValue(true);

      const { result, rerender } = renderHook(
        ({ address, chainId }) =>
          useGasIncluded7702(true, true, { address }, { chainId }),
        {
          initialProps: { address: addresses[0], chainId: chainIds[0] },
        },
      );

      // Rapidly change props
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          rerender({ address: addresses[i], chainId: chainIds[j] });
        }
      }

      // Wait for all effects to settle
      await act(async () => {
        await Promise.resolve();
      });

      await waitFor(() => {
        // Final state should reflect the last combination (true)
        expect(result.current).toBe(true);
      });
    });

    it('should cleanup properly when effect dependencies change during async operation', async () => {
      let resolveFirstRelay: (value: unknown) => void;
      const firstRelayPromise = new Promise((resolve) => {
        resolveFirstRelay = resolve;
      });

      mockIsAtomicBatchSupported.mockResolvedValue([
        { chainId: '0x1', isSupported: true },
      ]);
      mockIsRelaySupported
        .mockReturnValueOnce(firstRelayPromise)
        .mockResolvedValueOnce(false);

      const { result, rerender } = renderHook(
        ({ chainId }) =>
          useGasIncluded7702(true, true, { address: '0x123' }, { chainId }),
        {
          initialProps: { chainId: '0x1' },
        },
      );

      // Change chainId while first relay check is pending
      rerender({ chainId: '0x2' });

      // Resolve the first (now stale) relay check
      await act(async () => {
        resolveFirstRelay?.(true);
        await Promise.resolve();
      });

      // Wait for second effect to complete
      await waitFor(() => {
        // Should be false based on second chain
        expect(result.current).toBe(false);
      });
    });
  });
});
