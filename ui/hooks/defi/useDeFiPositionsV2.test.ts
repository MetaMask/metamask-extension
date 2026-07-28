import { act, renderHook } from '@testing-library/react-hooks';
import { useDeFiPositionsV2 } from './useDeFiPositionsV2';

const mockFetchDeFiPositions = jest.fn().mockResolvedValue(undefined);

jest.mock('./useFetchDeFiPositions', () => ({
  useFetchDeFiPositions: () => mockFetchDeFiPositions,
}));

const mockSelectedAccountGroup = 'entropy:1/0';
let mockGroupAccounts: { id: string }[] = [{ id: 'account-1' }];
let mockPositionsByAccount: Record<string, unknown> = {};

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('../../selectors/multichain-accounts/account-tree', () => ({
  getSelectedAccountGroup: () => mockSelectedAccountGroup,
  getInternalAccountsFromGroupById: () => mockGroupAccounts,
}));

jest.mock('../../selectors/defi-controller-v2/positions', () => ({
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

  it('does not fetch when disabled', async () => {
    const { result } = renderHook(() =>
      useDeFiPositionsV2({ enabled: false }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockFetchDeFiPositions).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('reports loading until positions exist', async () => {
    let resolveFetch: (() => void) | undefined;
    mockFetchDeFiPositions.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { result } = renderHook(() => useDeFiPositionsV2());

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveFetch?.();
      await Promise.resolve();
    });

    expect(result.current.isLoading).toBe(false);
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

  it('returns merged positions from state', () => {
    mockPositionsByAccount = {
      'account-1': [{ protocolId: 'lido' }],
    };

    const { result } = renderHook(() => useDeFiPositionsV2({ enabled: false }));

    expect(result.current.positions).toEqual([{ protocolId: 'lido' }]);
  });
});
