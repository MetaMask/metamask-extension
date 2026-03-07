import { act, waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { getGaslessBridgeWith7702EnabledForChain } from '../../../../shared/modules/selectors';
import { getIsStxEnabled } from '../../../ducks/bridge/selectors';
import { useGasIncluded7702 } from './useGasIncluded7702';

jest.mock('../../../store/actions', () => ({
  isRelaySupported: jest.fn(),
}));

jest.mock('../../../store/controller-actions/transaction-controller', () => ({
  isAtomicBatchSupported: jest.fn(),
}));

jest.mock('../../../../shared/modules/selectors');

jest.mock('../../../ducks/bridge/selectors', () => ({
  ...jest.requireActual('../../../ducks/bridge/selectors'),
  getIsStxEnabled: jest.fn(),
}));

const renderUseGasIncluded7702 = (
  params: Parameters<typeof useGasIncluded7702>[0],
  mockStoreOverrides?: Record<string, unknown>,
) => {
  return renderHookWithProvider(
    () => useGasIncluded7702(params),
    mockStoreOverrides ?? {
      metamask: { preferences: {} },
    },
  );
};

describe('useGasIncluded7702', () => {
  const mockIsRelaySupported = jest.requireMock(
    '../../../store/actions',
  ).isRelaySupported;
  const mockIsAtomicBatchSupported = jest.requireMock(
    '../../../store/controller-actions/transaction-controller',
  ).isAtomicBatchSupported;
  const mockGetIsStxEnabled = jest.mocked(getIsStxEnabled);
  const mockGetGaslessBridgeWith7702Enabled = jest.mocked(
    getGaslessBridgeWith7702EnabledForChain,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockGetIsStxEnabled.mockReturnValue(false);
    mockGetGaslessBridgeWith7702Enabled.mockReturnValue(false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns false and skips checks when send bundle supported AND Smart Transactions enabled', () => {
    mockGetIsStxEnabled.mockReturnValue(true);

    const { result } = renderUseGasIncluded7702({
      isSwap: true,
      selectedAccount: { address: '0x123' },
      fromChain: { chainId: '0x1' },
      isSendBundleSupportedForChain: true,
    });

    expect(result.current).toBe(false);
    expect(mockIsAtomicBatchSupported).not.toHaveBeenCalled();
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
  });

  it('proceeds with checks when send bundle supported BUT Smart Transactions disabled', async () => {
    mockGetIsStxEnabled.mockReturnValue(false);
    mockIsRelaySupported.mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderUseGasIncluded7702({
      isSwap: true,
      selectedAccount: { address: '0x123' },
      fromChain: { chainId: '0x1' },
      isSendBundleSupportedForChain: true,
    });

    // initial false
    expect(result.current).toBe(false);

    await waitForNextUpdate();

    expect(mockIsRelaySupported).toHaveBeenCalled();
    expect(result.current).toBe(true);
  });

  it('returns false when isSwap is false and gaslessBridgeWith7702Enabled is false', () => {
    mockGetGaslessBridgeWith7702Enabled.mockReturnValue(false);

    const { result } = renderUseGasIncluded7702({
      isSwap: false,
      selectedAccount: { address: '0x123' },
      fromChain: { chainId: '0x1' },
      isSendBundleSupportedForChain: false,
    });

    expect(result.current).toBe(false);
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
  });

  it('proceeds with relay check when isSwap is true regardless of gaslessBridgeWith7702Enabled value', async () => {
    mockGetGaslessBridgeWith7702Enabled.mockReturnValue(true);
    mockIsRelaySupported.mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderUseGasIncluded7702({
      isSwap: true,
      selectedAccount: { address: '0x123' },
      fromChain: { chainId: '0x1' },
      isSendBundleSupportedForChain: false,
    });

    await waitForNextUpdate();

    expect(result.current).toBe(true);
    expect(mockIsRelaySupported).toHaveBeenCalledWith('0x1');
  });

  it('returns true when isSwap is false and gaslessBridgeWith7702Enabled is true and relay supported', async () => {
    mockGetGaslessBridgeWith7702Enabled.mockReturnValue(true);
    mockIsRelaySupported.mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderUseGasIncluded7702({
      isSwap: false,
      selectedAccount: { address: '0x123' },
      fromChain: { chainId: '0x1' },
      isSendBundleSupportedForChain: false,
    });

    await waitForNextUpdate();

    expect(result.current).toBe(true);
    expect(mockIsRelaySupported).toHaveBeenCalledWith('0x1');
  });

  it('returns false when selectedAccount is null', () => {
    const { result } = renderUseGasIncluded7702({
      isSwap: true,
      selectedAccount: null,
      fromChain: { chainId: '0x1' },
      isSendBundleSupportedForChain: false,
    });

    expect(result.current).toBe(false);
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
  });

  it('returns false when fromChain is null and does not call selectors with a chainId', () => {
    const { result } = renderUseGasIncluded7702({
      isSwap: true,
      selectedAccount: { address: '0x123' },
      fromChain: null,
      isSendBundleSupportedForChain: false,
    });

    expect(result.current).toBe(false);
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
    expect(mockGetGaslessBridgeWith7702Enabled).not.toHaveBeenCalled();
  });

  it('returns false for non-EVM chain IDs and skips relay check', () => {
    const { result } = renderUseGasIncluded7702({
      isSwap: true,
      selectedAccount: { address: '0x123' },
      fromChain: { chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' },
      isSendBundleSupportedForChain: false,
    });

    expect(result.current).toBe(false);
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
  });

  it('passes the correct hex chainId to selectors', () => {
    renderUseGasIncluded7702({
      isSwap: true,
      selectedAccount: { address: '0x123' },
      fromChain: { chainId: '0x1' },
      isSendBundleSupportedForChain: false,
    });

    expect(mockGetGaslessBridgeWith7702Enabled).toHaveBeenCalledWith(
      expect.anything(),
      '0x1',
    );
    expect(mockGetIsStxEnabled).toHaveBeenCalled();
  });

  it('returns true when relay is supported', async () => {
    mockIsRelaySupported.mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderUseGasIncluded7702({
      isSwap: true,
      selectedAccount: { address: '0x123' },
      fromChain: { chainId: '0x1' },
      isSendBundleSupportedForChain: false,
    });

    await waitForNextUpdate();

    expect(result.current).toBe(true);
    expect(mockIsRelaySupported).toHaveBeenCalledWith('0x1');
  });

  it('returns false when relay is not supported', async () => {
    mockIsRelaySupported.mockResolvedValue(false);

    const { result } = renderUseGasIncluded7702({
      isSwap: true,
      selectedAccount: { address: '0x123' },
      fromChain: { chainId: '0x1' },
      isSendBundleSupportedForChain: false,
    });

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
    mockIsRelaySupported.mockRejectedValue(new Error('Test error'));

    const { result } = renderUseGasIncluded7702({
      isSwap: true,
      selectedAccount: { address: '0x123' },
      fromChain: { chainId: '0x1' },
      isSendBundleSupportedForChain: false,
    });

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

  it('converts decimal chainId to hex before calling isRelaySupported', async () => {
    mockIsRelaySupported.mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderUseGasIncluded7702({
      isSwap: true,
      selectedAccount: { address: '0x123' },
      fromChain: { chainId: '10' },
      isSendBundleSupportedForChain: false,
    });

    await waitForNextUpdate();

    expect(result.current).toBe(true);
    expect(mockIsRelaySupported).toHaveBeenCalledWith('0xa');
  });

  describe('Race condition handling', () => {
    it('should not update state when component unmounts before async operations complete', async () => {
      // Create a promise that we can control when it resolves
      let resolveRelay: (value: unknown) => void;
      const relayPromise = new Promise((resolve) => {
        resolveRelay = resolve;
      });

      mockIsRelaySupported.mockReturnValue(relayPromise);

      const { result, unmount } = renderUseGasIncluded7702({
        isSwap: true,
        selectedAccount: { address: '0x123' },
        fromChain: { chainId: '0x1' },
        isSendBundleSupportedForChain: false,
      });

      // Initial state should be false
      expect(result.current).toBe(false);

      // Unmount before the promise resolves
      unmount();

      // Now resolve the promise
      await act(async () => {
        resolveRelay?.(true);
        await Promise.resolve();
      });

      // State should still be false since component unmounted
      expect(result.current).toBe(false);
    });

    it('should not update state with stale results when dependencies change', async () => {
      // Create promises that we can control
      let resolveFirstRelay: (value: unknown) => void;
      let resolveSecondRelay: (value: unknown) => void;
      const firstRelayPromise = new Promise((resolve) => {
        resolveFirstRelay = resolve;
      });
      const secondRelayPromise = new Promise((resolve) => {
        resolveSecondRelay = resolve;
      });

      mockIsRelaySupported
        .mockReturnValueOnce(firstRelayPromise)
        .mockReturnValueOnce(secondRelayPromise);

      const { result, rerender } = renderHookWithProvider(
        ({
          children: { address, chainId } = {
            address: '0x123',
            chainId: '0x1',
          },
        } = {}) =>
          useGasIncluded7702({
            isSwap: true,
            selectedAccount: { address },
            fromChain: { chainId },
            isSendBundleSupportedForChain: false,
          }),
        {
          initialProps: { children: { address: '0x123', chainId: '0x1' } },
        },
      );

      // Initial state should be false
      expect(result.current).toBe(false);

      // Change props (this triggers a new effect)
      rerender({ children: { address: '0x456', chainId: '0x2' } });

      // Resolve the second request first
      await act(async () => {
        resolveSecondRelay?.(false);
        await Promise.resolve();
      });

      // State should be false based on second request
      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      // Now resolve the first (stale) request
      await act(async () => {
        resolveFirstRelay?.(true);
        await Promise.resolve();
      });

      // State should still be false (not updated by stale request)
      expect(result.current).toBe(false);
    });

    it('should handle rapid prop changes without race conditions', async () => {
      const addresses = ['0x111', '0x222', '0x333'];
      const chainIds = ['0x1', '0x2', '0x3'];

      // Mock responses for each chainId - only the last chainId returns true
      mockIsRelaySupported.mockImplementation((chainId: string) => {
        const chainIndex = chainIds.indexOf(chainId);
        const isSupported = chainIndex === 2;
        return Promise.resolve(isSupported);
      });

      const { result, rerender } = renderHookWithProvider(
        ({
          children: { address, chainId } = {
            address: addresses[0],
            chainId: chainIds[0],
          },
        } = {}) =>
          useGasIncluded7702({
            isSwap: true,
            selectedAccount: { address },
            fromChain: { chainId },
            isSendBundleSupportedForChain: false,
          }),
        {
          initialProps: {
            children: { address: addresses[0], chainId: chainIds[0] },
          },
          state: { metamask: { preferences: {} } },
        },
      );

      // Rapidly change props
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          rerender({
            children: { address: addresses[i], chainId: chainIds[j] },
          });
        }
      }

      // Wait for all effects to settle
      await act(async () => {
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should cleanup properly when effect dependencies change during async operation', async () => {
      let resolveFirstRelay: (value: unknown) => void;
      const firstRelayPromise = new Promise((resolve) => {
        resolveFirstRelay = resolve;
      });

      mockIsRelaySupported
        .mockReturnValueOnce(firstRelayPromise)
        .mockResolvedValueOnce(false);

      const { result, rerender } = renderHookWithProvider(
        ({
          children: { chainId } = {
            chainId: '0x1',
          },
        } = {}) =>
          useGasIncluded7702({
            isSwap: true,
            selectedAccount: { address: '0x123' },
            fromChain: { chainId },
            isSendBundleSupportedForChain: false,
          }),
        {
          initialProps: { children: { chainId: '0x1' } },
        },
      );

      // Change chainId while first relay check is pending
      rerender({ children: { chainId: '0x2' } });

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
