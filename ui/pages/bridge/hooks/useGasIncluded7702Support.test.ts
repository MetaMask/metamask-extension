import { renderHook } from '@testing-library/react-hooks';
import { act } from '@testing-library/react';
import { useGasIncluded7702Support } from './useGasIncluded7702Support';

jest.mock('../../../store/actions', () => ({
  isRelaySupported: jest.fn(),
}));

jest.mock('../../../store/controller-actions/transaction-controller', () => ({
  isAtomicBatchSupported: jest.fn(),
}));

describe('useGasIncluded7702Support', () => {
  const mockIsRelaySupported = jest.requireMock(
    '../../../store/actions',
  ).isRelaySupported;
  const mockIsAtomicBatchSupported = jest.requireMock(
    '../../../store/controller-actions/transaction-controller',
  ).isAtomicBatchSupported;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {
      // Suppress console.error in tests
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns false when smartAccountOptIn is false', () => {
    const { result } = renderHook(() =>
      useGasIncluded7702Support(
        false,
        true,
        { address: '0x123' },
        { chainId: '0x1' },
      ),
    );

    expect(result.current).toBe(false);
    expect(mockIsAtomicBatchSupported).not.toHaveBeenCalled();
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
  });

  it('returns false when isSwap is false', () => {
    const { result } = renderHook(() =>
      useGasIncluded7702Support(
        true,
        false,
        { address: '0x123' },
        { chainId: '0x1' },
      ),
    );

    expect(result.current).toBe(false);
    expect(mockIsAtomicBatchSupported).not.toHaveBeenCalled();
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
  });

  it('returns false when selectedAccount is null', () => {
    const { result } = renderHook(() =>
      useGasIncluded7702Support(true, true, null, { chainId: '0x1' }),
    );

    expect(result.current).toBe(false);
    expect(mockIsAtomicBatchSupported).not.toHaveBeenCalled();
    expect(mockIsRelaySupported).not.toHaveBeenCalled();
  });

  it('returns false when fromChain is null', () => {
    const { result } = renderHook(() =>
      useGasIncluded7702Support(true, true, { address: '0x123' }, null),
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
      useGasIncluded7702Support(
        true,
        true,
        { address: '0x123' },
        { chainId: '0x1' },
      ),
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
      useGasIncluded7702Support(
        true,
        true,
        { address: '0x123' },
        { chainId: '0x1' },
      ),
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
      useGasIncluded7702Support(
        true,
        true,
        { address: '0x123' },
        { chainId: '0x1' },
      ),
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
      useGasIncluded7702Support(
        true,
        true,
        { address: '0x123' },
        { chainId: '0x1' },
      ),
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
      useGasIncluded7702Support(
        true,
        true,
        { address: '0x123' },
        { chainId: '0x1' },
      ),
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
      useGasIncluded7702Support(
        true,
        true,
        { address: '0x123' },
        { chainId: '0x1' },
      ),
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
});
