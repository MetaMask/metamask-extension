import { act, renderHook } from '@testing-library/react-hooks';
import { useDeFiPositionsV2 } from './useDeFiPositionsV2';

const mockFetchDeFiPositions = jest.fn().mockResolvedValue(undefined);

jest.mock('./useFetchDeFiPositions', () => ({
  useFetchDeFiPositions: () => mockFetchDeFiPositions,
}));

let mockSelectedAccountGroup: string | null = 'entropy:1/0';
let mockGroupAccounts: { id: string }[] = [{ id: 'account-1' }];
let mockPositionsByAccount: Record<string, unknown> = {};

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('../../../selectors/multichain-accounts/account-tree', () => ({
  getSelectedAccountGroup: () => mockSelectedAccountGroup,
  getInternalAccountsFromGroupById: () => mockGroupAccounts,
}));

jest.mock('../../../selectors/defi-controller-v2/positions', () => ({
  getDeFiPositionsV2: () => mockPositionsByAccount,
}));

jest.mock('@metamask/assets-controllers', () => ({
  mergePositionsForAccounts: (
    positionsByAccount: Record<string, unknown>,
    accountIds: string[],
  ) =>
    accountIds.flatMap((id) => {
      const value = positionsByAccount[id];
      return Array.isArray(value) ? value : [];
    }),
}));

describe('useDeFiPositionsV2', () => {
  beforeEach(() => {
    mockFetchDeFiPositions.mockClear();
    mockFetchDeFiPositions.mockResolvedValue(undefined);
    mockSelectedAccountGroup = 'entropy:1/0';
    mockGroupAccounts = [{ id: 'account-1' }];
    mockPositionsByAccount = {};
  });

  it('fetches positions on mount', async () => {
    renderHook(() => useDeFiPositionsV2());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchDeFiPositions).toHaveBeenCalledTimes(1);
    expect(mockFetchDeFiPositions).toHaveBeenCalledWith();
  });

  it('reports loading until positions exist in the store', async () => {
    let resolveFetch: (() => void) | undefined;
    mockFetchDeFiPositions.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result, rerender } = renderHook(() => useDeFiPositionsV2());

    expect(result.current.isLoading).toBe(true);

    // Messenger resolve alone must not clear loading — that races the UI
    // store update and flashes the empty state.
    await act(async () => {
      resolveFetch?.();
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(true);

    mockPositionsByAccount = { 'account-1': [{ protocolId: 'lido' }] };
    rerender();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.positions).toEqual([{ protocolId: 'lido' }]);
  });

  it('clears loading when the store has an empty positions list', () => {
    mockPositionsByAccount = { 'account-1': [] };

    const { result } = renderHook(() => useDeFiPositionsV2());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.positions).toEqual([]);
  });

  it('sets isError when the fetch fails', async () => {
    mockFetchDeFiPositions.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useDeFiPositionsV2());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('does not report isError when the selected account group is still null', () => {
    mockSelectedAccountGroup = null;
    mockGroupAccounts = [];
    mockFetchDeFiPositions.mockImplementation(
      () =>
        new Promise<void>(() => {
          // Leave pending so we stay on the cold-start path.
        }),
    );

    const { result } = renderHook(() => useDeFiPositionsV2());

    expect(result.current.isError).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('shows loading for a new account group after a prior fetch failure', async () => {
    mockFetchDeFiPositions.mockRejectedValue(new Error('network'));

    const { result, rerender } = renderHook(() => useDeFiPositionsV2());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);

    // Switch groups before the effect clears the stale error. The first render
    // for the new group must treat this as loading, not as another error.
    mockSelectedAccountGroup = 'entropy:1/1';
    mockGroupAccounts = [{ id: 'account-2' }];
    mockPositionsByAccount = {};
    mockFetchDeFiPositions.mockImplementation(
      () =>
        new Promise<void>(() => {
          // Leave pending so loading stays true.
        }),
    );

    rerender();

    expect(result.current.isError).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('refresh force-fetches positions', async () => {
    const { result } = renderHook(() => useDeFiPositionsV2());

    await act(async () => {
      await Promise.resolve();
    });

    mockFetchDeFiPositions.mockClear();

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockFetchDeFiPositions).toHaveBeenCalledTimes(1);
    expect(mockFetchDeFiPositions).toHaveBeenCalledWith({ forceRefresh: true });
  });

  it('does not report loading when positions are already cached', async () => {
    mockPositionsByAccount = { 'account-1': [] };
    let resolveFetch: (() => void) | undefined;
    mockFetchDeFiPositions.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result } = renderHook(() => useDeFiPositionsV2());

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      resolveFetch?.();
      await Promise.resolve();
    });
  });

  it('returns merged positions from state', async () => {
    mockPositionsByAccount = {
      'account-1': [{ protocolId: 'lido' }],
    };

    const { result } = renderHook(() => useDeFiPositionsV2());

    expect(result.current.positions).toEqual([{ protocolId: 'lido' }]);

    // Flush the mount-time fetch so its state updates are wrapped in act.
    await act(async () => {
      await Promise.resolve();
    });
  });
});
