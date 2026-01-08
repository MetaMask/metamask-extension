import { renderHook } from '@testing-library/react-hooks';
import { useSelector, useDispatch } from 'react-redux';
import { updateBalancesFoAccounts } from '../store/actions';
import { getEnabledChainIds } from '../selectors';
import { useAssetsUpdateAllAccountBalances } from './useAssetsUpdateAllAccountBalances';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../store/actions', () => ({
  updateBalancesFoAccounts: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getEnabledChainIds: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;
const mockUpdateBalancesFoAccounts =
  updateBalancesFoAccounts as jest.MockedFunction<
    typeof updateBalancesFoAccounts
  >;

describe('useAssetsUpdateAllAccountBalances', () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn().mockImplementation(() => Promise.resolve());
    mockUseDispatch.mockReturnValue(mockDispatch);
    // Mock returns a thunk function (action creator now returns ThunkAction)
    mockUpdateBalancesFoAccounts.mockImplementation(
      () => () => Promise.resolve(),
    );

    // Mock console.warn to avoid cluttering test output
    jest.spyOn(console, 'warn').mockImplementation(() => ({}));
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should return updateBalances function', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return ['0x1', '0x89'];
      }
      return undefined;
    });

    const { result } = renderHook(() => useAssetsUpdateAllAccountBalances());

    expect(result.current).toHaveProperty('updateBalances');
    expect(typeof result.current.updateBalances).toBe('function');
  });

  it('should call updateBalancesFoAccounts when enabledChainIds are available', () => {
    const mockChainIds = ['0x1', '0x89'];
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return mockChainIds;
      }
      return undefined;
    });

    renderHook(() => useAssetsUpdateAllAccountBalances());

    // Verify updateBalancesFoAccounts was called with correct args
    expect(mockUpdateBalancesFoAccounts).toHaveBeenCalledWith(
      mockChainIds,
      false,
    );
    // Verify dispatch was called with a thunk function
    expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should not call updateBalancesFoAccounts when enabledChainIds is empty', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return [];
      }
      return undefined;
    });

    renderHook(() => useAssetsUpdateAllAccountBalances());

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockUpdateBalancesFoAccounts).not.toHaveBeenCalled();
  });

  it('should only run effect once even when hook is re-rendered with same chainIds', () => {
    const mockChainIds = ['0x1', '0x89'];
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return mockChainIds;
      }
      return undefined;
    });

    const { rerender } = renderHook(() => useAssetsUpdateAllAccountBalances());

    // First render should call dispatch
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    // Re-render with same chain IDs
    rerender();

    // Should not call dispatch again
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it('should run effect again when enabledChainIds change', () => {
    const initialChainIds = ['0x1'];
    const updatedChainIds = ['0x1', '0x89'];

    let currentChainIds = initialChainIds;
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return currentChainIds;
      }
      return undefined;
    });

    const { rerender } = renderHook(() => useAssetsUpdateAllAccountBalances());

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockUpdateBalancesFoAccounts).toHaveBeenCalledWith(
      initialChainIds,
      false,
    );

    // Update chain IDs and rerender
    currentChainIds = updatedChainIds;
    rerender();

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockUpdateBalancesFoAccounts).toHaveBeenCalledWith(
      updatedChainIds,
      false,
    );
  });

  it('should handle manual updateBalances call', async () => {
    const mockChainIds = ['0x1', '0x89'];
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return mockChainIds;
      }
      return undefined;
    });

    const { result } = renderHook(() => useAssetsUpdateAllAccountBalances());

    // Clear previous calls from useEffect
    mockDispatch.mockClear();
    mockUpdateBalancesFoAccounts.mockClear();

    // Call updateBalances manually
    await result.current.updateBalances();

    // Verify updateBalancesFoAccounts was called with correct args
    expect(mockUpdateBalancesFoAccounts).toHaveBeenCalledWith(
      mockChainIds,
      false,
    );
    // Verify dispatch was called with a thunk function
    expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should not call updateBalances manually when enabledChainIds is empty', async () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return [];
      }
      return undefined;
    });

    const { result } = renderHook(() => useAssetsUpdateAllAccountBalances());

    // Clear any calls from useEffect (none expected with empty chain IDs)
    mockDispatch.mockClear();
    mockUpdateBalancesFoAccounts.mockClear();

    // Call updateBalances manually
    await result.current.updateBalances();

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockUpdateBalancesFoAccounts).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully in updateBalances', async () => {
    const mockChainIds = ['0x1', '0x89'];
    const mockError = new Error('Failed to update balances');

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return mockChainIds;
      }
      return undefined;
    });

    // Dispatch rejects when the thunk fails
    mockDispatch.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useAssetsUpdateAllAccountBalances());

    // Clear previous calls from useEffect
    mockDispatch.mockClear();
    mockUpdateBalancesFoAccounts.mockClear();
    mockDispatch.mockRejectedValueOnce(mockError);

    // Call updateBalances manually and expect it to handle error gracefully
    await expect(result.current.updateBalances()).resolves.not.toThrow();

    expect(console.warn).toHaveBeenCalledWith(
      'Error updating balances state for all accounts',
      mockError,
    );
  });

  it('should handle errors gracefully in useEffect', async () => {
    const mockChainIds = ['0x1', '0x89'];
    const mockError = new Error('Failed to update balances');

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return mockChainIds;
      }
      return undefined;
    });

    // Dispatch rejects when the thunk fails
    mockDispatch.mockRejectedValueOnce(mockError);

    // This should not throw
    expect(() => {
      renderHook(() => useAssetsUpdateAllAccountBalances());
    }).not.toThrow();

    // Wait for async operation to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(console.warn).toHaveBeenCalledWith(
      'Error updating balances state for all accounts',
      mockError,
    );
  });

  it('should memoize updateBalances function correctly', () => {
    const mockChainIds = ['0x1', '0x89'];
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return mockChainIds;
      }
      return undefined;
    });

    const { result, rerender } = renderHook(() =>
      useAssetsUpdateAllAccountBalances(),
    );

    const firstUpdateBalances = result.current.updateBalances;

    // Re-render without changing dependencies
    rerender();

    const secondUpdateBalances = result.current.updateBalances;

    // updateBalances function should be the same reference (memoized)
    expect(firstUpdateBalances).toBe(secondUpdateBalances);
  });

  it('should create new updateBalances function when dependencies change', () => {
    let currentChainIds = ['0x1'];
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getEnabledChainIds) {
        return currentChainIds;
      }
      return undefined;
    });

    const { result, rerender } = renderHook(() =>
      useAssetsUpdateAllAccountBalances(),
    );

    const firstUpdateBalances = result.current.updateBalances;

    // Change chain IDs
    currentChainIds = ['0x1', '0x89'];
    rerender();

    const secondUpdateBalances = result.current.updateBalances;

    // updateBalances function should be different (new reference due to dependency change)
    expect(firstUpdateBalances).not.toBe(secondUpdateBalances);
  });
});
