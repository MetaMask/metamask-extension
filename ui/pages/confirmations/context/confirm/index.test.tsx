import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import mockState from '../../../../../test/data/mock-state.json';
import { ConfirmContextProvider, useConfirmContext } from '.';

const mockNavigate = jest.fn();
const mockUseHardwareWalletSigningBehavior = jest.fn();

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

jest.mock('../../../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../../../contexts/hardware-wallets'),
  useHardwareWalletSigningBehavior: () =>
    mockUseHardwareWalletSigningBehavior(),
}));

const middleware = [thunk];

function createStore({ isLoading = false }: { isLoading?: boolean } = {}) {
  return configureMockStore(middleware)({
    ...mockState,
    appState: {
      ...mockState.appState,
      isLoading,
    },
    metamask: {
      ...mockState.metamask,
      pendingApprovals: {},
    },
  });
}

function renderContextProvider(store: ReturnType<typeof createStore>) {
  return renderHook(
    ({ reduxStore }: { reduxStore: ReturnType<typeof createStore> }) =>
      useConfirmContext(),
    {
      initialProps: { reduxStore: store },
      wrapper: ({
        children,
        reduxStore,
      }: {
        children: React.ReactElement;
        reduxStore: ReturnType<typeof createStore>;
      }) => (
        <Provider store={reduxStore}>
          <ConfirmContextProvider>
            {children as React.ReactElement}
          </ConfirmContextProvider>
        </Provider>
      ),
    },
  );
}

describe('ConfirmContextProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowSearch = '';
    window.history.replaceState({}, '', '/');
    mockCurrentConfirmation = {
      id: 'test-id',
      type: TransactionType.simpleSend,
    };
    mockUseHardwareWalletSigningBehavior.mockReturnValue({
      keepConfirmationOpenDuringSigning: false,
    });
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

  it('keeps the last confirmation while loading when signing behavior is configured to wait', () => {
    mockUseHardwareWalletSigningBehavior.mockReturnValue({
      keepConfirmationOpenDuringSigning: true,
    });
    const loadingStore = createStore({ isLoading: true });
    const { result, rerender } = renderContextProvider(loadingStore);

    mockCurrentConfirmation = undefined;
    rerender({ reduxStore: loadingStore });

    expect(result.current.currentConfirmation).toStrictEqual({
      id: 'test-id',
      type: TransactionType.simpleSend,
    });
    expect(mockNavigate).not.toHaveBeenCalled();

    const idleStore = createStore({ isLoading: false });
    rerender({ reduxStore: idleStore });

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });

  it('does not keep the last software wallet confirmation while loading', () => {
    const loadingStore = createStore({ isLoading: true });
    const { result, rerender } = renderContextProvider(loadingStore);

    mockCurrentConfirmation = undefined;
    rerender({ reduxStore: loadingStore });

    expect(result.current.currentConfirmation).toBeUndefined();
    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });

  it('does not keep the last confirmation while loading when signing behavior is configured not to wait', () => {
    mockUseHardwareWalletSigningBehavior.mockReturnValue({
      keepConfirmationOpenDuringSigning: false,
    });
    const loadingStore = createStore({ isLoading: true });
    const { result, rerender } = renderContextProvider(loadingStore);

    mockCurrentConfirmation = undefined;
    rerender({ reduxStore: loadingStore });

    expect(result.current.currentConfirmation).toBeUndefined();
    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
    });
  });
});
