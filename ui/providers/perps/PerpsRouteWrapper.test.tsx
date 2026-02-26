import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { PerpsRouteWrapper } from './PerpsRouteWrapper';

const mockInit = jest.fn<Promise<void>, [string]>();
const mockPrewarm = jest.fn();
const mockCleanupPrewarm = jest.fn();
const mockPositionsHasCachedData = jest.fn(() => false);
const mockOrdersHasCachedData = jest.fn(() => false);
const mockAccountHasCachedData = jest.fn(() => false);

jest.mock('./PerpsStreamManager', () => ({
  getPerpsStreamManager: () => ({
    init: (...args: [string]) => mockInit(...args),
    prewarm: () => mockPrewarm(),
    cleanupPrewarm: () => mockCleanupPrewarm(),
    positions: { hasCachedData: () => mockPositionsHasCachedData() },
    orders: { hasCachedData: () => mockOrdersHasCachedData() },
    account: { hasCachedData: () => mockAccountHasCachedData() },
  }),
}));

const mockIsCancelledError = jest.fn<boolean, [unknown]>(() => false);

jest.mock('./getPerpsController', () => ({
  isPerpsControllerInitializationCancelledError: (...args: [unknown]) =>
    mockIsCancelledError(...args),
}));

jest.mock('../../selectors/accounts', () => ({
  getSelectedInternalAccount: (state: Record<string, unknown>) =>
    (state as { testAccount?: { address: string } }).testAccount ?? null,
}));

const mockConfigureStore = configureStore();

function createMockStore(address?: string) {
  return mockConfigureStore({
    metamask: {},
    testAccount: address ? { address } : null,
  });
}

describe('PerpsRouteWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children after successful initialization', async () => {
    mockInit.mockResolvedValue(undefined);
    const store = createMockStore('0xaaa');

    await act(async () => {
      render(
        <Provider store={store}>
          <PerpsRouteWrapper>
            <div data-testid="child">Hello</div>
          </PerpsRouteWrapper>
        </Provider>,
      );
    });

    expect(mockInit).toHaveBeenCalledWith('0xaaa');
    expect(mockPrewarm).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('child')).toHaveTextContent('Hello');
  });

  it('shows loading fallback while initializing', () => {
    mockInit.mockReturnValue(new Promise(() => undefined));
    const store = createMockStore('0xaaa');

    render(
      <Provider store={store}>
        <PerpsRouteWrapper
          loadingFallback={<div data-testid="loading">Loading...</div>}
        >
          <div data-testid="child">Hello</div>
        </PerpsRouteWrapper>
      </Provider>,
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
  });

  it('renders null as default fallback when no loadingFallback provided', () => {
    mockInit.mockReturnValue(new Promise(() => undefined));
    const store = createMockStore('0xaaa');

    const { container } = render(
      <Provider store={store}>
        <PerpsRouteWrapper>
          <div data-testid="child">Hello</div>
        </PerpsRouteWrapper>
      </Provider>,
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(container.innerHTML).toBe('');
  });

  it('shows error when no account is selected', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <PerpsRouteWrapper>
          <div data-testid="child">Hello</div>
        </PerpsRouteWrapper>
      </Provider>,
    );

    expect(screen.getByText(/No account selected/u)).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('shows error state on init failure', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    mockInit.mockRejectedValue(new Error('network down'));
    const store = createMockStore('0xaaa');

    await act(async () => {
      render(
        <Provider store={store}>
          <PerpsRouteWrapper>
            <div data-testid="child">Hello</div>
          </PerpsRouteWrapper>
        </Provider>,
      );
    });

    expect(screen.getByText(/network down/u)).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('wraps non-Error throws in Error for display', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    mockInit.mockRejectedValue('string error');
    const store = createMockStore('0xaaa');

    await act(async () => {
      render(
        <Provider store={store}>
          <PerpsRouteWrapper>
            <div>child</div>
          </PerpsRouteWrapper>
        </Provider>,
      );
    });

    expect(screen.getByText(/string error/u)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('silently ignores cancellation errors', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    mockInit.mockRejectedValue(new Error('cancelled'));
    mockIsCancelledError.mockReturnValue(true);
    const store = createMockStore('0xaaa');

    await act(async () => {
      render(
        <Provider store={store}>
          <PerpsRouteWrapper>
            <div data-testid="child">Hello</div>
          </PerpsRouteWrapper>
        </Provider>,
      );
    });

    expect(screen.queryByText(/cancelled/u)).not.toBeInTheDocument();
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('renders children immediately when cached data exists', () => {
    mockInit.mockReturnValue(new Promise(() => undefined));
    mockPositionsHasCachedData.mockReturnValue(true);
    const store = createMockStore('0xaaa');

    render(
      <Provider store={store}>
        <PerpsRouteWrapper>
          <div data-testid="child">Cached</div>
        </PerpsRouteWrapper>
      </Provider>,
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Cached');
  });

  it('renders children with cached orders data', () => {
    mockInit.mockReturnValue(new Promise(() => undefined));
    mockOrdersHasCachedData.mockReturnValue(true);
    const store = createMockStore('0xaaa');

    render(
      <Provider store={store}>
        <PerpsRouteWrapper>
          <div data-testid="child">Orders cached</div>
        </PerpsRouteWrapper>
      </Provider>,
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Orders cached');
  });

  it('renders children with cached account data', () => {
    mockInit.mockReturnValue(new Promise(() => undefined));
    mockAccountHasCachedData.mockReturnValue(true);
    const store = createMockStore('0xaaa');

    render(
      <Provider store={store}>
        <PerpsRouteWrapper>
          <div data-testid="child">Account cached</div>
        </PerpsRouteWrapper>
      </Provider>,
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Account cached');
  });

  it('calls cleanupPrewarm on unmount', async () => {
    mockInit.mockResolvedValue(undefined);
    const store = createMockStore('0xaaa');

    let unmountFn: (() => void) | undefined;
    await act(async () => {
      ({ unmount: unmountFn } = render(
        <Provider store={store}>
          <PerpsRouteWrapper>
            <div>child</div>
          </PerpsRouteWrapper>
        </Provider>,
      ));
    });

    if (unmountFn) {
      unmountFn();
    }

    expect(mockCleanupPrewarm).toHaveBeenCalledTimes(1);
  });
});
