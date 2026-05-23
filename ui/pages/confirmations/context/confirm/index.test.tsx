import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import mockState from '../../../../../test/data/mock-state.json';
import { ConfirmContextProvider, useConfirmContext } from '.';

const mockNavigate = jest.fn();

let mockWindowSearch = '';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(mockWindowSearch), jest.fn()],
  useParams: () => ({}),
  useLocation: () => ({
    pathname: '/confirm-transaction',
    search: mockWindowSearch,
    hash: '',
    state: null,
    key: 'test',
  }),
}));

let mockCurrentConfirmation: { id: string; type: string } | undefined;

jest.mock('../../hooks/useCurrentConfirmation', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => ({
      currentConfirmation: mockCurrentConfirmation,
    }),
  };
});

jest.mock('../../hooks/useSyncConfirmPath', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => undefined,
  };
});

const middleware = [thunk];

function createStore() {
  return configureMockStore(middleware)({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      pendingApprovals: {},
    },
  });
}

function renderContextProvider(store: ReturnType<typeof createStore>) {
  return renderHook(() => useConfirmContext(), {
    wrapper: ({ children }: { children: React.ReactElement }) => (
      <Provider store={store}>
        <ConfirmContextProvider>
          {children as React.ReactElement}
        </ConfirmContextProvider>
      </Provider>
    ),
  });
}

describe('ConfirmContextProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowSearch = '';
    window.history.replaceState({}, '', '/');
    mockCurrentConfirmation = { id: 'test-id', type: 'transaction' };
  });

  it('navigates to DEFAULT_ROUTE when confirmation disappears and no goBackTo', () => {
    const store = createStore();
    const { rerender } = renderContextProvider(store);

    mockCurrentConfirmation = undefined;
    rerender();

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, { replace: true });
  });

  it('navigates to goBackTo when confirmation disappears and goBackTo is present', () => {
    mockWindowSearch = '?goBackTo=/perps/trade/BTC';
    window.history.replaceState({}, '', '/?goBackTo=/perps/trade/BTC');
    const store = createStore();
    const { rerender } = renderContextProvider(store);

    mockCurrentConfirmation = undefined;
    rerender();

    expect(mockNavigate).toHaveBeenCalledWith('/perps/trade/BTC', {
      replace: true,
    });
  });

  it('does not navigate when confirmation is still present', () => {
    const store = createStore();
    const { rerender } = renderContextProvider(store);

    rerender();

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when currentConfirmationOverride is set', () => {
    const store = createStore();

    const override = {
      id: 'override-id',
      type: 'transaction',
    };

    const { rerender } = renderHook(() => useConfirmContext(), {
      wrapper: ({ children }: { children: React.ReactElement }) => (
        <Provider store={store}>
          <ConfirmContextProvider
            currentConfirmationOverride={override as never}
          >
            {children as React.ReactElement}
          </ConfirmContextProvider>
        </Provider>
      ),
    });

    mockCurrentConfirmation = undefined;
    rerender();

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('ignores unsafe goBackTo values (absolute URLs)', () => {
    mockWindowSearch = '?goBackTo=https%3A%2F%2Fevil.com%2Fphishing';
    window.history.replaceState(
      {},
      '',
      '/?goBackTo=https%3A%2F%2Fevil.com%2Fphishing',
    );
    const store = createStore();
    const { rerender } = renderContextProvider(store);

    mockCurrentConfirmation = undefined;
    rerender();

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, { replace: true });
  });

  it('keeps goBackTo from initial URL when location search is cleared after mount', () => {
    mockWindowSearch = '?goBackTo=/asset/keep';
    window.history.replaceState({}, '', '/?goBackTo=/asset/keep');
    const store = createStore();
    const { result, rerender } = renderContextProvider(store);

    expect(result.current.goBackTo).toBe('/asset/keep');
    mockWindowSearch = '';
    window.history.replaceState({}, '', '/');
    rerender();
    expect(result.current.goBackTo).toBe('/asset/keep');
  });
});
