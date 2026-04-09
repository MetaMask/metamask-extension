import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import mockState from '../../../../../test/data/mock-state.json';
import { ConfirmContextProvider, useConfirmContext } from '.';

const mockNavigate = jest.fn();

let mockSearchParams = new URLSearchParams('');

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, jest.fn()],
  useParams: () => ({}),
  useLocation: () => ({
    pathname: '/confirm-transaction',
    search: '',
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
    mockSearchParams = new URLSearchParams('');
    mockCurrentConfirmation = { id: 'test-id', type: 'transaction' };
  });

  it('navigates to DEFAULT_ROUTE when confirmation disappears and no returnTo', () => {
    const store = createStore();
    const { rerender } = renderContextProvider(store);

    mockCurrentConfirmation = undefined;
    rerender();

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, { replace: true });
  });

  it('navigates to returnTo when confirmation disappears and returnTo is present', () => {
    mockSearchParams = new URLSearchParams('returnTo=/perps/trade/BTC');
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

  it('ignores unsafe returnTo values (absolute URLs)', () => {
    mockSearchParams = new URLSearchParams(
      'returnTo=https://evil.com/phishing',
    );
    const store = createStore();
    const { rerender } = renderContextProvider(store);

    mockCurrentConfirmation = undefined;
    rerender();

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, { replace: true });
  });
});
