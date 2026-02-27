import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import type { PerpsController } from '@metamask/perps-controller';
import {
  PerpsControllerProvider,
  usePerpsController,
} from './PerpsControllerProvider';

const mockGetPerpsController = jest.fn<Promise<unknown>, [string, unknown?]>();
const mockIsPerpsControllerInitializationCancelledError = jest.fn<
  boolean,
  [unknown]
>(() => false);

jest.mock('./getPerpsController', () => ({
  getPerpsController: (...args: [string, unknown?]) =>
    mockGetPerpsController(...args),
  isPerpsControllerInitializationCancelledError: (...args: [unknown]) =>
    mockIsPerpsControllerInitializationCancelledError(...args),
}));

const mockStreamManagerInit = jest.fn<Promise<void>, [string]>();
jest.mock('./PerpsStreamManager', () => ({
  getPerpsStreamManager: () => ({
    init: (...args: [string]) => mockStreamManagerInit(...args),
  }),
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

function makeMockController(
  overrides: Partial<PerpsController> = {},
): PerpsController {
  return {
    state: {},
    ...overrides,
  } as unknown as PerpsController;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const ControllerConsumer = () => {
  const controller = usePerpsController();
  return <div data-testid="controller-state">{String(controller.state)}</div>;
};

describe('PerpsControllerProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with provided controller', () => {
    it('renders children with the provided controller', () => {
      const ctrl = makeMockController();
      const store = createMockStore('0xaaa');

      render(
        <Provider store={store}>
          <PerpsControllerProvider controller={ctrl}>
            <div data-testid="child">Hello</div>
          </PerpsControllerProvider>
        </Provider>,
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Hello');
    });

    it('makes controller available via usePerpsController', () => {
      const ctrl = makeMockController({ state: { foo: 'bar' } as never });
      const store = createMockStore('0xaaa');

      render(
        <Provider store={store}>
          <PerpsControllerProvider controller={ctrl}>
            <ControllerConsumer />
          </PerpsControllerProvider>
        </Provider>,
      );

      expect(screen.getByTestId('controller-state')).toBeInTheDocument();
    });

    it('does not call getPerpsController when controller is provided', () => {
      const ctrl = makeMockController();
      const store = createMockStore('0xaaa');

      render(
        <Provider store={store}>
          <PerpsControllerProvider controller={ctrl}>
            <div>child</div>
          </PerpsControllerProvider>
        </Provider>,
      );

      expect(mockGetPerpsController).not.toHaveBeenCalled();
    });
  });

  describe('without provided controller', () => {
    it('shows loading fallback while initializing', () => {
      mockGetPerpsController.mockReturnValue(new Promise(() => undefined));
      const store = createMockStore('0xaaa');

      render(
        <Provider store={store}>
          <PerpsControllerProvider
            loadingFallback={<div data-testid="loading">Loading...</div>}
          >
            <div data-testid="child">Hello</div>
          </PerpsControllerProvider>
        </Provider>,
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    });

    it('renders null as fallback by default', () => {
      mockGetPerpsController.mockReturnValue(new Promise(() => undefined));
      const store = createMockStore('0xaaa');

      const { container } = render(
        <Provider store={store}>
          <PerpsControllerProvider>
            <div data-testid="child">Hello</div>
          </PerpsControllerProvider>
        </Provider>,
      );

      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
      expect(container.innerHTML).toBe('');
    });

    it('initializes controller via getPerpsController', async () => {
      const ctrl = makeMockController();
      mockGetPerpsController.mockResolvedValue(ctrl);
      const store = createMockStore('0xaaa');

      await act(async () => {
        render(
          <Provider store={store}>
            <PerpsControllerProvider>
              <div data-testid="child">Hello</div>
            </PerpsControllerProvider>
          </Provider>,
        );
      });

      expect(mockGetPerpsController).toHaveBeenCalledWith('0xaaa', store);
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('does not initialize when no address is selected', () => {
      const store = createMockStore();

      const { container } = render(
        <Provider store={store}>
          <PerpsControllerProvider>
            <div data-testid="child">Hello</div>
          </PerpsControllerProvider>
        </Provider>,
      );

      expect(mockGetPerpsController).not.toHaveBeenCalled();
      expect(container.innerHTML).toBe('');
    });

    it('shows error state on initialization failure', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      mockGetPerpsController.mockRejectedValue(new Error('init failed'));
      const store = createMockStore('0xaaa');

      await act(async () => {
        render(
          <Provider store={store}>
            <PerpsControllerProvider>
              <div data-testid="child">Hello</div>
            </PerpsControllerProvider>
          </Provider>,
        );
      });

      expect(screen.getByText(/init failed/u)).toBeInTheDocument();
      expect(screen.queryByTestId('child')).not.toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it('wraps non-Error throws in Error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      mockGetPerpsController.mockRejectedValue('string error');
      const store = createMockStore('0xaaa');

      await act(async () => {
        render(
          <Provider store={store}>
            <PerpsControllerProvider>
              <div>child</div>
            </PerpsControllerProvider>
          </Provider>,
        );
      });

      expect(screen.getByText(/string error/u)).toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it('ignores cancellation errors silently', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      mockGetPerpsController.mockRejectedValue(new Error('cancelled'));
      mockIsPerpsControllerInitializationCancelledError.mockReturnValue(true);
      const store = createMockStore('0xaaa');

      await act(async () => {
        render(
          <Provider store={store}>
            <PerpsControllerProvider>
              <div data-testid="child">Hello</div>
            </PerpsControllerProvider>
          </Provider>,
        );
      });

      expect(screen.queryByText(/cancelled/u)).not.toBeInTheDocument();
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

describe('usePerpsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when no controller is available', () => {
    const store = createMockStore();
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() =>
      render(
        <Provider store={store}>
          <ControllerConsumer />
        </Provider>,
      ),
    ).toThrow(/Controller not available/u);

    consoleSpy.mockRestore();
  });

  it('returns context controller when inside provider', () => {
    const ctrl = makeMockController();
    const store = createMockStore('0xaaa');

    render(
      <Provider store={store}>
        <PerpsControllerProvider controller={ctrl}>
          <ControllerConsumer />
        </PerpsControllerProvider>
      </Provider>,
    );

    expect(screen.getByTestId('controller-state')).toBeInTheDocument();
  });

  it('falls back to stream manager when no context controller', async () => {
    const ctrl = makeMockController();
    mockStreamManagerInit.mockResolvedValue(undefined);
    mockGetPerpsController.mockResolvedValue(ctrl);
    const store = createMockStore('0xaaa');

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const FallbackConsumer = () => {
      const [ready, setReady] = React.useState(false);
      React.useEffect(() => {
        mockStreamManagerInit('0xaaa')
          .then(() => mockGetPerpsController('0xaaa'))
          .then(() => setReady(true))
          .catch(() => undefined);
      }, []);
      return <div data-testid={ready ? 'got-controller' : 'no-controller'} />;
    };

    await act(async () => {
      render(
        <Provider store={store}>
          <FallbackConsumer />
        </Provider>,
      );
    });

    await waitFor(() => {
      expect(mockStreamManagerInit).toHaveBeenCalledWith('0xaaa');
    });
  });

  it('ignores cancellation errors from stream manager init', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    mockStreamManagerInit.mockRejectedValue(new Error('cancelled'));
    mockIsPerpsControllerInitializationCancelledError.mockReturnValue(true);
    const store = createMockStore('0xaaa');

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const FallbackConsumer = () => {
      const [, setError] = React.useState<Error | null>(null);
      React.useEffect(() => {
        mockStreamManagerInit('0xaaa').catch((err: unknown) => {
          if (!mockIsPerpsControllerInitializationCancelledError(err)) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        });
      }, []);
      return <div data-testid="no-controller">waiting</div>;
    };

    await act(async () => {
      render(
        <Provider store={store}>
          <FallbackConsumer />
        </Provider>,
      );
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
