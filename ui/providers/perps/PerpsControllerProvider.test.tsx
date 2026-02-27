import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import type { PerpsController } from '@metamask/perps-controller';
import {
  PerpsControllerProvider,
  usePerpsController,
} from './PerpsControllerProvider';

const mockGetPerpsStreamingController = jest.fn<Promise<unknown>, [string, unknown?]>();
const mockGetPerpsControllerInstance = jest.fn<unknown | null, []>(() => null);
const mockIsPerpsControllerInitializationCancelledError = jest.fn<
  boolean,
  [unknown]
>(() => false);

jest.mock('./getPerpsController', () => ({
  getPerpsStreamingController: (...args: [string, unknown?]) =>
    mockGetPerpsStreamingController(...args),
  getPerpsControllerInstance: () => mockGetPerpsControllerInstance(),
  isPerpsControllerInitializationCancelledError: (...args: [unknown]) =>
    mockIsPerpsControllerInitializationCancelledError(...args),
}));

const mockStreamManagerInit = jest.fn<Promise<void>, [string]>();
const mockStreamManagerPrewarm = jest.fn();
const mockStreamManagerCleanupPrewarm = jest.fn();

jest.mock('./PerpsStreamManager', () => ({
  getPerpsStreamManager: () => ({
    init: (...args: [string]) => mockStreamManagerInit(...args),
    prewarm: () => mockStreamManagerPrewarm(),
    cleanupPrewarm: () => mockStreamManagerCleanupPrewarm(),
  }),
}));

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
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
    mockStreamManagerInit.mockResolvedValue(undefined);
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

      expect(mockGetPerpsStreamingController).not.toHaveBeenCalled();
    });

    it('does not call stream manager when controller is provided', () => {
      const ctrl = makeMockController();
      const store = createMockStore('0xaaa');

      render(
        <Provider store={store}>
          <PerpsControllerProvider controller={ctrl}>
            <div>child</div>
          </PerpsControllerProvider>
        </Provider>,
      );

      expect(mockStreamManagerInit).not.toHaveBeenCalled();
      expect(mockStreamManagerPrewarm).not.toHaveBeenCalled();
    });
  });

  describe('without provided controller', () => {
    it('shows loading fallback while initializing', () => {
      mockGetPerpsStreamingController.mockReturnValue(new Promise(() => undefined));
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
      mockGetPerpsStreamingController.mockReturnValue(new Promise(() => undefined));
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

    it('initializes controller via getPerpsStreamingController', async () => {
      const ctrl = makeMockController();
      mockGetPerpsStreamingController.mockResolvedValue(ctrl);
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

      expect(mockGetPerpsStreamingController).toHaveBeenCalledWith('0xaaa', store);
      expect(mockStreamManagerInit).toHaveBeenCalledWith('0xaaa');
      expect(mockStreamManagerPrewarm).toHaveBeenCalled();
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('calls streamManager.init and prewarm on mount', async () => {
      const ctrl = makeMockController();
      mockGetPerpsStreamingController.mockResolvedValue(ctrl);
      const store = createMockStore('0xaddr');

      await act(async () => {
        render(
          <Provider store={store}>
            <PerpsControllerProvider>
              <div data-testid="child">Hi</div>
            </PerpsControllerProvider>
          </Provider>,
        );
      });

      expect(mockStreamManagerInit).toHaveBeenCalledWith('0xaddr');
      expect(mockStreamManagerPrewarm).toHaveBeenCalled();
    });

    it('calls cleanupPrewarm on unmount', async () => {
      const ctrl = makeMockController();
      mockGetPerpsStreamingController.mockResolvedValue(ctrl);
      const store = createMockStore('0xaaa');

      const { unmount } = render(
        <Provider store={store}>
          <PerpsControllerProvider>
            <div>child</div>
          </PerpsControllerProvider>
        </Provider>,
      );

      await waitFor(() => {
        expect(mockStreamManagerPrewarm).toHaveBeenCalled();
      });

      unmount();
      expect(mockStreamManagerCleanupPrewarm).toHaveBeenCalled();
    });

    it('renders children immediately when singleton controller exists', () => {
      const ctrl = makeMockController();
      mockGetPerpsControllerInstance.mockReturnValue(ctrl);
      const store = createMockStore('0xaaa');

      render(
        <Provider store={store}>
          <PerpsControllerProvider>
            <div data-testid="child">Hello</div>
          </PerpsControllerProvider>
        </Provider>,
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Hello');
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

      expect(mockGetPerpsStreamingController).not.toHaveBeenCalled();
      expect(container.innerHTML).toBe('');
    });

    it('shows error state on initialization failure', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      mockGetPerpsStreamingController.mockRejectedValue(new Error('init failed'));
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

      mockGetPerpsStreamingController.mockRejectedValue('string error');
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

      mockGetPerpsStreamingController.mockRejectedValue(new Error('cancelled'));
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

  it('throws when used outside provider', () => {
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
    ).toThrow(/usePerpsController must be used within a <PerpsControllerProvider>/u);

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
});
