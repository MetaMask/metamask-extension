import React from 'react';
import ReactDOM from 'react-dom';
import { type CaipChainId } from '@metamask/utils';
import { act, waitFor } from '@testing-library/react';
import { fetchTokensBySearchQuery } from '../../pages/bridge/utils/tokens';
import { useTokenSearchResults } from './useTokenSearchResults';

jest.mock('@metamask/bridge-controller', () => ({
  BridgeClientId: { EXTENSION: 'extension' },
}));

jest.mock('../../../shared/constants/bridge', () => ({
  BRIDGE_API_BASE_URL: 'https://bridge.api.test',
}));

jest.mock('lodash/debounce', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- ESM interop
  __esModule: true,
  default: (fn: (...args: unknown[]) => void) =>
    Object.assign((...args: unknown[]) => fn(...args), { cancel: jest.fn() }),
}));

jest.mock('../useAsync', () => ({
  useAsyncResult: () => ({
    status: 'success',
    pending: false,
    idle: false,
    value: 'mock-jwt',
    error: undefined,
  }),
}));

jest.mock('../../store/actions', () => ({
  getBearerToken: jest.fn(),
}));

jest.mock('../../ducks/bridge/types', () => ({}));

jest.mock('../../ducks/bridge/asset-selectors', () => ({
  getBridgeAssetsByAssetId: jest.fn(() => ({})),
}));

jest.mock('../../ducks/bridge/utils', () => ({
  toBridgeToken: jest.fn((token) => token),
}));

jest.mock('../../pages/bridge/utils/tokens', () => ({
  fetchTokensBySearchQuery: jest.fn().mockResolvedValue({
    tokens: [],
    endCursor: undefined,
    hasNextPage: false,
  }),
}));

const mockUseSelector = jest.fn((selector: (state: unknown) => unknown) =>
  selector({}),
);

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) =>
    mockUseSelector(selector),
}));

const mockFetchTokensBySearchQuery =
  fetchTokensBySearchQuery as jest.MockedFunction<
    typeof fetchTokensBySearchQuery
  >;

// Lightweight hook renderer for this suite. Avoids renderHookWithProvider and
// createBridgeMockStore, which OOM in CI when this file runs in the full unit suite.
function renderHook<Result>(callback: () => Result) {
  const result: { current: Result | undefined } = { current: undefined };
  const container = document.createElement('div');

  // eslint-disable-next-line @typescript-eslint/naming-convention -- test-only component
  function HookRenderer() {
    result.current = callback();
    return null;
  }

  act(() => {
    // eslint-disable-next-line react/no-deprecated -- jest-fixed-jsdom lacks createRoot
    ReactDOM.render(React.createElement(HookRenderer), container);
  });

  return {
    result,
    rerender: () => {
      act(() => {
        // eslint-disable-next-line react/no-deprecated -- jest-fixed-jsdom lacks createRoot
        ReactDOM.render(React.createElement(HookRenderer), container);
      });
    },
    unmount: () => {
      act(() => {
        // eslint-disable-next-line react/no-deprecated -- jest-fixed-jsdom lacks createRoot
        ReactDOM.unmountComponentAtNode(container);
      });
    },
  };
}

describe('useTokenSearchResults', () => {
  const mainnetChainIds = new Set<CaipChainId>(['eip155:1']);
  const polygonChainIds = new Set<CaipChainId>(['eip155:137']);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockImplementation((selector) => selector({}));
  });

  it('does not fetch when searchQuery is empty', () => {
    const { result, unmount } = renderHook(() =>
      useTokenSearchResults({
        searchQuery: '',
        assetsToInclude: [],
        chainIds: mainnetChainIds,
      }),
    );

    expect(result.current?.searchResults).toEqual([]);
    expect(result.current?.isSearchResultsLoading).toBe(false);
    expect(result.current?.hasMoreResults).toBe(false);
    expect(mockFetchTokensBySearchQuery).not.toHaveBeenCalled();

    unmount();
  });

  it('returns empty search results when an account group is provided without a query', () => {
    const { result, unmount } = renderHook(() =>
      useTokenSearchResults({
        searchQuery: '',
        assetsToInclude: [],
        accountGroupId: 'entropy:01K2FF18CTTXJYD34R78X4N1N1/0',
        chainIds: mainnetChainIds,
      }),
    );

    expect(result.current?.searchResults).toEqual([]);
    expect(result.current?.isSearchResultsLoading).toBe(false);
    expect(result.current?.hasMoreResults).toBe(false);
    expect(mockFetchTokensBySearchQuery).not.toHaveBeenCalled();

    unmount();
  });

  it('refetches search results when chainIds change with the same search query', async () => {
    let chainIds: Set<CaipChainId> = mainnetChainIds;

    const { rerender, unmount } = renderHook(() =>
      useTokenSearchResults({
        searchQuery: 'usdc',
        assetsToInclude: [],
        chainIds,
      }),
    );

    await waitFor(() => {
      expect(mockFetchTokensBySearchQuery).toHaveBeenCalledTimes(1);
    });
    expect(mockFetchTokensBySearchQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        chainIds: ['eip155:1'],
        query: 'usdc',
      }),
    );

    mockFetchTokensBySearchQuery.mockClear();
    chainIds = polygonChainIds;
    rerender();

    await waitFor(() => {
      expect(mockFetchTokensBySearchQuery).toHaveBeenCalledTimes(1);
    });
    expect(mockFetchTokensBySearchQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        chainIds: ['eip155:137'],
        query: 'usdc',
      }),
    );

    unmount();
  });
});
