import { it } from '@jest/globals';
import type {
  PerpsController,
  PriceUpdate,
  Position,
  OrderFill,
} from '@metamask/perps-controller';

// Provide the runtime enum that the source file imports. Jest cannot parse
// the full @metamask/perps-controller bundle (Hyperliquid SDK uses ESM), so
// we supply the enum value via a partial mock and re-export it for test use.
const WebSocketConnectionState = {
  Connected: 'connected',
  Connecting: 'connecting',
  Disconnected: 'disconnected',
  Disconnecting: 'disconnecting',
} as const;

jest.mock('@metamask/perps-controller', () => ({
  WebSocketConnectionState,
}));

// eslint-disable-next-line import-x/first
import { PerpsStreamBridge } from './perps-stream-bridge';

function createMockController(): jest.Mocked<
  Pick<
    PerpsController,
    | 'subscribeToPositions'
    | 'subscribeToOrders'
    | 'subscribeToAccount'
    | 'subscribeToOrderFills'
    | 'subscribeToPrices'
    | 'subscribeToOrderBook'
    | 'subscribeToCandles'
    | 'subscribeToConnectionState'
    | 'getWebSocketConnectionState'
    | 'reconnect'
    | 'getMarketDataWithPrices'
    | 'getPositions'
    | 'getActiveProvider'
    | 'getOpenOrders'
    | 'getAccountState'
    | 'startMarketDataPreload'
  >
> {
  return {
    subscribeToPositions: jest.fn().mockReturnValue(jest.fn()),
    subscribeToOrders: jest.fn().mockReturnValue(jest.fn()),
    subscribeToAccount: jest.fn().mockReturnValue(jest.fn()),
    subscribeToOrderFills: jest.fn().mockReturnValue(jest.fn()),
    subscribeToPrices: jest.fn().mockReturnValue(jest.fn()),
    subscribeToOrderBook: jest.fn().mockReturnValue(jest.fn()),
    subscribeToCandles: jest.fn().mockReturnValue(jest.fn()),
    subscribeToConnectionState: jest.fn().mockReturnValue(jest.fn()),
    getWebSocketConnectionState: jest
      .fn()
      .mockReturnValue(WebSocketConnectionState.Connected as never),
    reconnect: jest.fn().mockResolvedValue(undefined),
    getMarketDataWithPrices: jest.fn().mockResolvedValue([]),
    getPositions: jest.fn().mockResolvedValue([]),
    getActiveProvider: jest.fn().mockReturnValue({}),
    getOpenOrders: jest.fn().mockResolvedValue([]),
    getAccountState: jest.fn().mockResolvedValue(null),
    startMarketDataPreload: jest.fn().mockReturnValue(undefined),
  };
}

function createMockControllerApi() {
  return {
    perpsInit: jest.fn().mockResolvedValue(undefined),
    perpsDisconnect: jest.fn().mockResolvedValue(undefined),
    perpsToggleTestnet: jest.fn().mockResolvedValue(undefined),
  };
}

type BridgeOverrides = {
  getSelectedAddress?: () => string;
  controller?: PerpsController;
  controllerApi?: ReturnType<typeof createMockControllerApi>;
  onControllerStateChange?: jest.Mock;
  onConnectivityChange?: jest.Mock;
  isConnectionAlive?: () => boolean;
  isTerminalBackendEnabled?: () => boolean;
  isPreloadAllowed?: () => boolean;
  subscribeAggregatedOrderBook?: jest.Mock;
  emit?: jest.Mock;
};

function createBridge(overrides: BridgeOverrides = {}) {
  const emit = overrides.emit ?? jest.fn();
  const controller =
    overrides.controller ??
    (createMockController() as unknown as PerpsController);
  const controllerApi = overrides.controllerApi ?? createMockControllerApi();
  const onControllerStateChange =
    overrides.onControllerStateChange ?? jest.fn().mockReturnValue(jest.fn());
  const onConnectivityChange =
    overrides.onConnectivityChange ?? jest.fn().mockReturnValue(jest.fn());
  const isConnectionAlive = overrides.isConnectionAlive ?? (() => true);
  const isTerminalBackendEnabled =
    overrides.isTerminalBackendEnabled ?? (() => false);
  const subscribeAggregatedOrderBook =
    overrides.subscribeAggregatedOrderBook ??
    jest.fn().mockReturnValue(jest.fn());

  const bridge = new PerpsStreamBridge({
    controller,
    getSelectedAddress: overrides.getSelectedAddress ?? (() => '0xfirst'),
    onControllerStateChange,
    onConnectivityChange,
    perpsInit: controllerApi.perpsInit,
    perpsDisconnect: controllerApi.perpsDisconnect,
    perpsToggleTestnet: controllerApi.perpsToggleTestnet,
    isConnectionAlive,
    isTerminalBackendEnabled,
    isPreloadAllowed: overrides.isPreloadAllowed ?? (() => true),
    subscribeAggregatedOrderBook,
    emit,
  });

  return {
    bridge,
    emit,
    controller,
    controllerApi,
    onControllerStateChange,
    onConnectivityChange,
    subscribeAggregatedOrderBook,
  };
}

describe('PerpsStreamBridge', () => {
  describe('shared account transitions', () => {
    it.each(['prices', 'candles'] as const)(
      'waits for another UI account disconnect before initializing %s',
      async (channel) => {
        let address = '0xaaa';
        const first = createBridge({ getSelectedAddress: () => address });
        const second = createBridge({
          controller: first.controller,
          controllerApi: first.controllerApi,
          getSelectedAddress: () => address,
        });
        const init = first.bridge.bridgeApi().perpsInitForAccount as (
          selectedAddress: string,
        ) => Promise<unknown>;
        await init(address);
        const events: string[] = [];
        let finishDisconnect!: () => void;
        let startDisconnect!: () => void;
        const disconnectStarted = new Promise<void>((resolve) => {
          startDisconnect = resolve;
        });
        first.controllerApi.perpsDisconnect.mockImplementationOnce(
          () =>
            new Promise<void>((resolve) => {
              events.push('disconnect-start');
              startDisconnect();
              finishDisconnect = () => {
                events.push('disconnect-end');
                resolve();
              };
            }),
        );
        first.controllerApi.perpsInit.mockImplementation(async () => {
          events.push('init');
        });
        address = '0xbbb';
        const transition = init(address);
        await disconnectStarted;
        const api = second.bridge.bridgeApi();
        const activate = (
          channel === 'prices'
            ? api.perpsActivatePriceStream
            : api.perpsActivateCandleStream
        ) as (params: Record<string, unknown>) => Promise<void>;
        const activation = activate(
          channel === 'prices'
            ? { symbols: ['BTC'] }
            : { symbol: 'BTC', interval: '1h' },
        );
        try {
          await Promise.resolve();
          expect(events).toStrictEqual(['disconnect-start']);
          finishDisconnect();
          await Promise.all([transition, activation]);
          expect(events).toStrictEqual([
            'disconnect-start',
            'disconnect-end',
            'init',
            'init',
          ]);
          const controller = first.controller as unknown as ReturnType<
            typeof createMockController
          >;
          if (channel === 'prices') {
            expect(controller.subscribeToPrices).toHaveBeenCalledTimes(1);
          } else {
            expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);
          }
        } finally {
          finishDisconnect();
          await Promise.all([transition, activation]);
          first.bridge.dispose();
          second.bridge.dispose();
        }
      },
    );

    it.each(['prices', 'candles'] as const)(
      'preserves a pending %s subscription across a queued account switch',
      async (channel) => {
        let address = '0xaaa';
        const controller = createMockController();
        controller.subscribeToPrices.mockImplementation(() => jest.fn());
        controller.subscribeToCandles.mockImplementation(() => jest.fn());
        const { bridge, controllerApi, emit } = createBridge({
          controller: controller as unknown as PerpsController,
          getSelectedAddress: () => address,
        });
        const api = bridge.bridgeApi();
        const init = api.perpsInitForAccount as (
          selectedAddress: string,
        ) => Promise<unknown>;
        await init(address);
        let finishInit!: () => void;
        let startInit!: () => void;
        const initStarted = new Promise<void>((resolve) => {
          startInit = resolve;
        });
        controllerApi.perpsInit.mockImplementationOnce(
          () =>
            new Promise<void>((resolve) => {
              finishInit = resolve;
              startInit();
            }),
        );
        const activate = (
          channel === 'prices'
            ? api.perpsActivatePriceStream
            : api.perpsActivateCandleStream
        ) as (params: Record<string, unknown>) => Promise<void>;
        const activation = activate(
          channel === 'prices'
            ? { symbols: ['BTC'] }
            : { symbol: 'BTC', interval: '1h' },
        );
        await initStarted;
        address = '0xbbb';
        const transition = init(address);
        try {
          await new Promise<void>((resolve) => setImmediate(resolve));
          expect(controllerApi.perpsDisconnect).not.toHaveBeenCalled();
          finishInit();
          await Promise.all([activation, transition]);
          expect(controllerApi.perpsDisconnect).toHaveBeenCalledTimes(1);
          const subscribe =
            channel === 'prices'
              ? controller.subscribeToPrices
              : controller.subscribeToCandles;
          // The switch must capture the request, unsubscribe, and restore it.
          expect(subscribe).toHaveBeenCalledTimes(2);
          expect(subscribe.mock.results[0].value).toHaveBeenCalledTimes(1);
          expect(subscribe.mock.results[1].value).not.toHaveBeenCalled();
          emit.mockClear();
          subscribe.mock.calls[1][0].callback([] as never);
          expect(emit).toHaveBeenCalledWith(
            channel,
            [],
            ...(channel === 'candles'
              ? [{ symbol: 'BTC', interval: '1h' }]
              : []),
          );
        } finally {
          finishInit();
          await Promise.all([activation, transition]);
          bridge.dispose();
        }
      },
    );

    it('keeps the first window streams alive when a second window handles the same account change later', async () => {
      let selectedAddress = '0xaaa';
      const controller = createMockController();
      const subscribers = new Set<(data: Position[]) => void>();
      controller.subscribeToPositions.mockImplementation(({ callback }) => {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
      });
      const controllerApi = createMockControllerApi();
      controllerApi.perpsDisconnect.mockImplementation(async () => {
        subscribers.clear();
      });
      const options = {
        controller: controller as unknown as PerpsController,
        controllerApi,
        getSelectedAddress: () => selectedAddress,
      };
      const first = createBridge(options);
      const second = createBridge(options);
      const init = (bridge: PerpsStreamBridge, address: string) =>
        (
          bridge.bridgeApi().perpsInitForAccount as (
            address: string,
          ) => Promise<unknown>
        )(address);
      await init(first.bridge, selectedAddress);
      await init(second.bridge, selectedAddress);
      for (const { bridge } of [first, second]) {
        (bridge.bridgeApi().perpsViewActive as (active: boolean) => void)(true);
        await (
          bridge.bridgeApi().perpsActivateCandleStream as (params: {
            symbol: string;
            interval: string;
          }) => Promise<void>
        )({ symbol: 'BTC', interval: '1h' });
        await (
          bridge.bridgeApi().perpsActivateOrderBookStream as (params: {
            symbol: string;
          }) => Promise<void>
        )({ symbol: 'BTC' });
      }
      selectedAddress = '0xbbb';
      await init(first.bridge, selectedAddress);
      first.emit.mockClear();
      await init(second.bridge, selectedAddress);
      expect(controllerApi.perpsDisconnect).toHaveBeenCalledTimes(1);
      for (const callback of subscribers) {
        callback([{ symbol: 'BTC' }] as Position[]);
      }
      expect(first.emit).toHaveBeenCalledWith(
        'positions',
        [{ symbol: 'BTC' }],
        undefined,
      );
      expect(second.emit).toHaveBeenCalledWith(
        'positions',
        [{ symbol: 'BTC' }],
        undefined,
      );
      expect(first.bridge.canEmit('positions')).toBe(true);
      expect(first.bridge.canEmit('candles')).toBe(true);
      expect(second.bridge.canEmit('orderBook')).toBe(true);
      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(4);
      expect(controller.subscribeToOrderBook).toHaveBeenCalledTimes(4);
      controller.subscribeToCandles.mock.calls[2][0].callback({
        candles: [],
      } as never);
      controller.subscribeToOrderBook.mock.calls[3][0].callback({
        bids: [],
        asks: [],
      } as never);
      expect(first.emit).toHaveBeenCalledWith(
        'candles',
        { candles: [] },
        { symbol: 'BTC', interval: '1h' },
      );
      expect(second.emit).toHaveBeenCalledWith('orderBook', {
        bids: [],
        asks: [],
      });
      first.bridge.dispose();
      second.bridge.dispose();
    });

    it.each([true, false])(
      'restores candles after an account change only when reactivation is %s',
      async (reactivate) => {
        jest.useFakeTimers();
        let address = '0xaaa';
        const { bridge, controller } = createBridge({
          getSelectedAddress: () => address,
        });
        const api = bridge.bridgeApi() as unknown as {
          perpsInitForAccount: (address: string) => Promise<unknown>;
          perpsActivateCandleStream: (params: {
            symbol: string;
            interval: string;
          }) => Promise<void>;
          perpsDeactivateCandleStream: (params: {
            symbol: string;
            interval: string;
          }) => void;
        };
        const request = { symbol: 'BTC', interval: '1h' };
        await api.perpsInitForAccount(address);
        await api.perpsActivateCandleStream(request);
        api.perpsDeactivateCandleStream(request);
        if (reactivate) {
          await api.perpsActivateCandleStream(request);
        }
        address = '0xbbb';
        await api.perpsInitForAccount(address);
        expect(controller.subscribeToCandles).toHaveBeenCalledTimes(
          reactivate ? 2 : 1,
        );
        bridge.dispose();
        jest.useRealTimers();
      },
    );

    it('keeps foreground inactive when the view leaves during account initialization', async () => {
      let address = '0xaaa';
      const { bridge, controllerApi } = createBridge({
        getSelectedAddress: () => address,
      });
      const api = bridge.bridgeApi() as unknown as {
        perpsInitForAccount: (address: string) => Promise<unknown>;
        perpsViewActive: (active: boolean) => void;
      };
      await api.perpsInitForAccount(address);
      api.perpsViewActive(true);
      let finish!: () => void;
      let started!: () => void;
      const start = new Promise<void>((resolve) => {
        started = resolve;
      });
      controllerApi.perpsInit.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
            started();
          }),
      );
      address = '0xbbb';
      const pending = api.perpsInitForAccount(address);
      await start;
      api.perpsViewActive(false);
      finish();
      await pending;
      expect(bridge.isActive).toBe(false);
      expect(bridge.canEmit('candles')).toBe(false);
      bridge.dispose();
    });

    it('retries shared teardown when the new account initialization fails', async () => {
      let address = '0xaaa';
      const first = createBridge({ getSelectedAddress: () => address });
      const second = createBridge({
        controller: first.controller,
        controllerApi: first.controllerApi,
        getSelectedAddress: () => address,
      });
      const init = (bridge: PerpsStreamBridge) =>
        (
          bridge.bridgeApi().perpsInitForAccount as (
            address: string,
          ) => Promise<unknown>
        )(address);
      await init(first.bridge);
      address = '0xbbb';
      first.controllerApi.perpsInit.mockRejectedValueOnce(
        new Error('init failed'),
      );
      await expect(init(first.bridge)).rejects.toThrow('init failed');
      await init(second.bridge);
      expect(first.controllerApi.perpsDisconnect).toHaveBeenCalledTimes(2);
      first.bridge.dispose();
      second.bridge.dispose();
    });

    it('preserves a healthy session when a joining UI closes before its init completes', async () => {
      const controller = createMockController();
      const first = createBridge({
        controller: controller as unknown as PerpsController,
        getSelectedAddress: () => '0xaaa',
      });
      let joiningAlive = true;
      const options = {
        controller: first.controller,
        controllerApi: first.controllerApi,
        getSelectedAddress: () => '0xaaa',
      };
      const joining = createBridge({
        ...options,
        isConnectionAlive: () => joiningAlive,
      });
      const later = createBridge(options);
      const init = (bridge: PerpsStreamBridge) =>
        (
          bridge.bridgeApi().perpsInitForAccount as (
            address: string,
          ) => Promise<unknown>
        )('0xaaa');
      await init(first.bridge);
      (first.bridge.bridgeApi().perpsViewActive as (active: boolean) => void)(
        true,
      );
      await (
        first.bridge.bridgeApi().perpsActivateCandleStream as (params: {
          symbol: string;
          interval: string;
        }) => Promise<void>
      )({ symbol: 'BTC', interval: '1h' });
      const positionsCallback =
        controller.subscribeToPositions.mock.calls[0][0].callback;
      const candleCallback =
        controller.subscribeToCandles.mock.calls[0][0].callback;
      let finish!: () => void;
      let started!: () => void;
      const start = new Promise<void>((resolve) => {
        started = resolve;
      });
      first.controllerApi.perpsInit.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
            started();
          }),
      );
      const pending = init(joining.bridge);
      await start;
      joiningAlive = false;
      joining.bridge.dispose();
      finish();
      await expect(pending).rejects.toThrow('Perps connection was released');
      await init(later.bridge);
      expect(first.controllerApi.perpsDisconnect).not.toHaveBeenCalled();
      first.emit.mockClear();
      positionsCallback([]);
      candleCallback({ candles: [] } as never);
      expect(first.emit).toHaveBeenCalledWith('positions', [], undefined);
      expect(first.emit).toHaveBeenCalledWith(
        'candles',
        { candles: [] },
        { symbol: 'BTC', interval: '1h' },
      );
      expect(first.bridge.canEmit('candles')).toBe(true);
      first.bridge.dispose();
      later.bridge.dispose();
    });

    it('rejects a delayed request for an account that is no longer selected', async () => {
      const { bridge, controllerApi } = createBridge({
        getSelectedAddress: () => '0xbbb',
      });
      const init = bridge.bridgeApi().perpsInitForAccount as (
        address: string,
      ) => Promise<unknown>;
      await expect(init('0xaaa')).rejects.toThrow('Perps account changed');
      expect(controllerApi.perpsInit).not.toHaveBeenCalled();
      expect(controllerApi.perpsDisconnect).not.toHaveBeenCalled();
      bridge.dispose();
    });
  });

  describe('foreground lifecycle', () => {
    it('preserves settlement across UI bridges but not controller replacement', async () => {
      const first = createBridge();
      const reloaded = createBridge({ controller: first.controller });
      expect(await first.bridge.bridgeApi().perpsGetLifecycleContext()).toBe(
        'cold_process',
      );
      await first.bridge.bridgeApi().perpsMarkForegroundSettled();
      first.bridge.destroy();
      expect(await reloaded.bridge.bridgeApi().perpsGetLifecycleContext()).toBe(
        'warm',
      );
      expect(
        await createBridge().bridge.bridgeApi().perpsGetLifecycleContext(),
      ).toBe('cold_process');
    });

    it('does not consume cold on connection or background preload', async () => {
      const controller = Object.assign(createMockController(), {
        state: { activeProvider: 'hyperliquid', isTestnet: false },
        getActiveProvider: () => ({
          ping: jest.fn().mockResolvedValue(undefined),
        }),
      });
      controller.getMarketDataWithPrices.mockResolvedValue([
        { symbol: 'BTC' },
      ] as never);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      await bridge.bridgeApi().perpsInit();
      await (
        bridge.bridgeApi().perpsStartPreload as (id: string) => Promise<void>
      )('preload');
      expect(await bridge.bridgeApi().perpsGetLifecycleContext()).toBe(
        'cold_process',
      );
      bridge.destroy();
    });
  });

  describe('isActive', () => {
    it('returns false initially', () => {
      const { bridge } = createBridge();
      expect(bridge.isActive).toBe(false);
    });

    it('returns false when only perpsInit has been called', async () => {
      const { bridge } = createBridge();
      const api = bridge.bridgeApi();
      await api.perpsInit();
      expect(bridge.isActive).toBe(false);
    });

    it('returns false when only perpsViewActive(true) has been called', () => {
      const { bridge } = createBridge();
      const api = bridge.bridgeApi();
      (api.perpsViewActive as (v: boolean) => void)(true);
      expect(bridge.isActive).toBe(false);
    });

    it('returns true when both perpsInit and perpsViewActive(true) have been called', async () => {
      const { bridge } = createBridge();
      const api = bridge.bridgeApi();
      await api.perpsInit();
      (api.perpsViewActive as (v: boolean) => void)(true);
      expect(bridge.isActive).toBe(true);
    });

    it('returns false after perpsViewActive(false)', async () => {
      const { bridge } = createBridge();
      const api = bridge.bridgeApi();
      await api.perpsInit();
      (api.perpsViewActive as (v: boolean) => void)(true);
      (api.perpsViewActive as (v: boolean) => void)(false);
      expect(bridge.isActive).toBe(false);
    });
  });

  describe('perpsInit', () => {
    it('delegates to controllerApi and activates static subscriptions', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      controllerApi.perpsInit.mockResolvedValue('init-result');
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();
      (api.perpsViewActive as (active: boolean) => void)(true);

      const result = await api.perpsInit();

      expect(controllerApi.perpsInit).toHaveBeenCalledTimes(1);
      expect(result).toBe('init-result');
      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToOrders).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToAccount).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToOrderFills).toHaveBeenCalledTimes(1);
    });

    it('triggers controller.startMarketDataPreload so the UI cache is primed for subsequent cold mounts', async () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await api.perpsInit();

      expect(controller.startMarketDataPreload).toHaveBeenCalledTimes(1);
    });

    it('still resolves when startMarketDataPreload throws synchronously', async () => {
      const controller = createMockController();
      controller.startMarketDataPreload.mockImplementation(() => {
        throw new Error('preload blew up');
      });
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await expect(api.perpsInit()).resolves.toBeUndefined();
      expect(controller.startMarketDataPreload).toHaveBeenCalledTimes(1);
    });

    it('emits on correct channels when static subscription callbacks fire', async () => {
      const controller = createMockController();
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      (api.perpsViewActive as (active: boolean) => void)(true);
      await api.perpsInit();

      const positionsCallback = controller.subscribeToPositions.mock.calls[0][0]
        .callback as (data: unknown) => void;
      const ordersCallback = controller.subscribeToOrders.mock.calls[0][0]
        .callback as (data: unknown) => void;
      const accountCallback = controller.subscribeToAccount.mock.calls[0][0]
        .callback as (data: unknown) => void;
      const fillsCallback = controller.subscribeToOrderFills.mock.calls[0][0]
        .callback as (data: unknown) => void;

      positionsCallback({ stub: 'positions' });
      ordersCallback({ stub: 'orders' });
      accountCallback({ stub: 'account' });
      fillsCallback([{ timestamp: 1 }]);

      expect(emit).toHaveBeenCalledWith(
        'positions',
        { stub: 'positions' },
        undefined,
      );
      expect(emit).toHaveBeenCalledWith(
        'orders',
        { stub: 'orders' },
        undefined,
      );
      expect(emit).toHaveBeenCalledWith(
        'account',
        { stub: 'account' },
        undefined,
      );
      expect(emit).toHaveBeenCalledWith('fills', [{ timestamp: 1 }]);
    });

    it('skips activation when already activated', async () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await api.perpsInit();
      await api.perpsInit();

      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
    });

    it('skips activation when connection is dead', async () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        isConnectionAlive: () => false,
      });
      const api = bridge.bridgeApi();

      await expect(api.perpsInit()).rejects.toThrow(
        'Perps connection was released',
      );

      expect(controller.subscribeToPositions).not.toHaveBeenCalled();
      expect(bridge.isActive).toBe(false);
    });

    it('subscribes to connection state and controller state during activation', async () => {
      const controller = createMockController();
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
      });
      await bridge.bridgeApi().perpsInit();

      expect(controller.subscribeToConnectionState).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToConnectionState).toHaveBeenCalledWith(
        expect.any(Function),
      );
      expect(onControllerStateChange).toHaveBeenCalledTimes(1);
      expect(onControllerStateChange).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('tears down previous static subscriptions on re-activation after destroy', async () => {
      const controller = createMockController();
      const stateChangeUnsub = jest.fn();
      const onControllerStateChange = jest
        .fn()
        .mockReturnValue(stateChangeUnsub);
      const connectivityUnsub = jest.fn();
      const onConnectivityChange = jest.fn().mockReturnValue(connectivityUnsub);
      const unsubs = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
      const fillsUnsubscribe = jest.fn();
      controller.subscribeToPositions.mockReturnValue(unsubs[0]);
      controller.subscribeToOrders.mockReturnValue(unsubs[1]);
      controller.subscribeToAccount.mockReturnValue(unsubs[2]);
      controller.subscribeToOrderFills.mockReturnValue(fillsUnsubscribe);
      controller.subscribeToConnectionState.mockReturnValue(unsubs[3]);

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        onConnectivityChange,
      });
      const api = bridge.bridgeApi();
      (api.perpsViewActive as (active: boolean) => void)(true);

      await api.perpsInit();
      for (const unsub of unsubs) {
        expect(unsub).not.toHaveBeenCalled();
      }
      expect(stateChangeUnsub).not.toHaveBeenCalled();
      expect(connectivityUnsub).not.toHaveBeenCalled();

      bridge.destroy();
      await api.perpsInit();

      for (const unsub of unsubs) {
        expect(unsub).toHaveBeenCalledTimes(1);
      }
      expect(fillsUnsubscribe).not.toHaveBeenCalled();
      expect(stateChangeUnsub).toHaveBeenCalledTimes(1);
      expect(connectivityUnsub).toHaveBeenCalledTimes(1);
      PerpsStreamBridge.invalidateController(
        controller as unknown as PerpsController,
      );
      expect(fillsUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('perpsDisconnect', () => {
    it('destroys bridge and delegates to controllerApi', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      controllerApi.perpsDisconnect.mockResolvedValue('disconnect-result');
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      await api.perpsInit();
      (api.perpsViewActive as (v: boolean) => void)(true);
      expect(bridge.isActive).toBe(true);

      const result = await api.perpsDisconnect();

      expect(result).toBe('disconnect-result');
      expect(bridge.isActive).toBe(false);
    });

    it('allows perpsInit to activate static subscriptions again after disconnect', async () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await api.perpsInit();
      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);

      await api.perpsDisconnect();

      await api.perpsInit();
      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(2);
    });
  });

  describe('perpsToggleTestnet', () => {
    it('destroys bridge and delegates to controllerApi', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      controllerApi.perpsToggleTestnet.mockResolvedValue('toggle-result');
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      await api.perpsInit();
      const result = await api.perpsToggleTestnet();

      expect(result).toBe('toggle-result');
      expect(bridge.isActive).toBe(false);
    });
  });

  describe('perpsViewActive', () => {
    it('enables isActive when combined with perpsInit', async () => {
      const { bridge } = createBridge();
      const api = bridge.bridgeApi();

      await api.perpsInit();

      (api.perpsViewActive as (v: boolean) => void)(true);
      expect(bridge.isActive).toBe(true);

      (api.perpsViewActive as (v: boolean) => void)(false);
      expect(bridge.isActive).toBe(false);
    });
  });

  describe('perpsActivateStreaming', () => {
    const callStreaming = (
      api: Record<string, (...args: never[]) => unknown>,
      params: Record<string, unknown>,
    ) =>
      (
        api.perpsActivateStreaming as (
          p: Record<string, unknown>,
        ) => Promise<void>
      )(params);

    it('activates static subscriptions if not yet activated', async () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      (api.perpsViewActive as (active: boolean) => void)(true);

      expect(bridge.isActive).toBe(false);
      await callStreaming(api, { priceSymbols: ['ETH'] });

      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToOrders).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToAccount).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToOrderFills).toHaveBeenCalledTimes(1);
    });

    it('does not re-activate static subscriptions if already activated', async () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await api.perpsInit();
      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);

      await callStreaming(api, { priceSymbols: ['ETH'] });
      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
    });

    describe('prices', () => {
      it('subscribes to prices when priceSymbols are provided', async () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });
        const api = bridge.bridgeApi();

        await callStreaming(api, { priceSymbols: ['ETH', 'BTC'] });

        expect(controller.subscribeToPrices).toHaveBeenCalledWith({
          symbols: ['ETH', 'BTC'],
          callback: expect.any(Function),
        });
      });

      it('does not subscribe to prices when priceSymbols is empty', async () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        await callStreaming(bridge.bridgeApi(), { priceSymbols: [] });

        expect(controller.subscribeToPrices).not.toHaveBeenCalled();
      });

      it('emits price updates on the prices channel', async () => {
        const controller = createMockController();
        const { bridge, emit } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        await callStreaming(bridge.bridgeApi(), { priceSymbols: ['ETH'] });

        const callback = controller.subscribeToPrices.mock.calls[0][0]
          .callback as (data: unknown) => void;
        callback({ stub: 'price-update' });

        expect(emit).toHaveBeenCalledWith('prices', { stub: 'price-update' });
      });

      it('tears down previous prices subscription when called again', async () => {
        const controller = createMockController();
        const unsub = jest.fn();
        controller.subscribeToPrices.mockReturnValue(unsub);
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });
        const api = bridge.bridgeApi();

        await callStreaming(api, { priceSymbols: ['ETH'] });
        expect(unsub).not.toHaveBeenCalled();

        await callStreaming(api, { priceSymbols: ['BTC'] });
        expect(unsub).toHaveBeenCalledTimes(1);
      });
    });

    describe('orderBook', () => {
      it('subscribes to order book when orderBookSymbol is provided', async () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        await callStreaming(bridge.bridgeApi(), { orderBookSymbol: 'ETH' });

        expect(controller.subscribeToOrderBook).toHaveBeenCalledWith({
          symbol: 'ETH',
          callback: expect.any(Function),
        });
      });

      it('emits order book updates on the orderBook channel', async () => {
        const controller = createMockController();
        const { bridge, emit } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        await callStreaming(bridge.bridgeApi(), { orderBookSymbol: 'BTC' });

        const callback = controller.subscribeToOrderBook.mock.calls[0][0]
          .callback as (data: unknown) => void;
        callback({ stub: 'order-book' });

        expect(emit).toHaveBeenCalledWith('orderBook', { stub: 'order-book' });
      });
    });

    describe('candles', () => {
      it('subscribes to candles when symbol and interval are provided', async () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        await callStreaming(bridge.bridgeApi(), {
          candle: { symbol: 'ETH', interval: '1h', duration: '1d' },
        });

        expect(controller.subscribeToCandles).toHaveBeenCalledWith({
          symbol: 'ETH',
          interval: '1h',
          duration: '1d',
          callback: expect.any(Function),
        });
      });

      it('emits candle updates with symbol and interval metadata', async () => {
        const controller = createMockController();
        const { bridge, emit } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        await callStreaming(bridge.bridgeApi(), {
          candle: { symbol: 'ETH', interval: '15m' },
        });

        const callback = controller.subscribeToCandles.mock.calls[0][0]
          .callback as (data: unknown) => void;
        callback({ stub: 'candle-update' });

        expect(emit).toHaveBeenCalledWith(
          'candles',
          { stub: 'candle-update' },
          { symbol: 'ETH', interval: '15m' },
        );
      });
    });

    describe('combined params', () => {
      it('subscribes to all channels when all params are provided', async () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        await callStreaming(bridge.bridgeApi(), {
          priceSymbols: ['ETH'],
          orderBookSymbol: 'ETH',
          candle: { symbol: 'ETH', interval: '5m' },
        });

        expect(controller.subscribeToPrices).toHaveBeenCalledTimes(1);
        expect(controller.subscribeToOrderBook).toHaveBeenCalledTimes(1);
        expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);
      });

      it('tears down omitted channels when navigating to a simpler view', async () => {
        const controller = createMockController();
        const orderBookUnsub = jest.fn();
        const candleUnsub = jest.fn();
        controller.subscribeToOrderBook.mockReturnValue(orderBookUnsub);
        controller.subscribeToCandles.mockReturnValue(candleUnsub);
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });
        const api = bridge.bridgeApi();

        await callStreaming(api, {
          priceSymbols: ['ETH'],
          orderBookSymbol: 'ETH',
          candle: { symbol: 'ETH', interval: '1h' },
        });

        expect(orderBookUnsub).not.toHaveBeenCalled();
        expect(candleUnsub).not.toHaveBeenCalled();

        await callStreaming(api, { priceSymbols: ['BTC'] });

        expect(orderBookUnsub).toHaveBeenCalledTimes(1);
        expect(candleUnsub).toHaveBeenCalledTimes(1);
      });
    });

    it('skips streaming when connection is dead', async () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        isConnectionAlive: () => false,
      });

      await callStreaming(bridge.bridgeApi(), { priceSymbols: ['ETH'] });

      expect(controller.subscribeToPrices).not.toHaveBeenCalled();
    });
  });

  describe('perpsActivatePriceStream / perpsDeactivatePriceStream', () => {
    it('subscribes to prices and emits on prices channel', async () => {
      const controller = createMockController();
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivatePriceStream as (p: {
          symbols: string[];
        }) => Promise<void>
      )({
        symbols: ['ETH', 'BTC'],
      });

      expect(controller.subscribeToPrices).toHaveBeenCalledWith({
        symbols: ['ETH', 'BTC'],
        includeMarketData: undefined,
        callback: expect.any(Function),
      });
      const callback = controller.subscribeToPrices.mock.calls[0][0]
        .callback as (data: unknown) => void;
      callback({ price: '100' });
      expect(emit).toHaveBeenCalledWith('prices', { price: '100' });
    });

    it('forwards includeMarketData when requested', async () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivatePriceStream as (p: {
          symbols: string[];
          includeMarketData?: boolean;
        }) => Promise<void>
      )({
        symbols: ['ETH'],
        includeMarketData: true,
      });

      expect(controller.subscribeToPrices).toHaveBeenCalledWith({
        symbols: ['ETH'],
        includeMarketData: true,
        callback: expect.any(Function),
      });
    });

    it('deactivatePriceStream tears down price subscription', async () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToPrices.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivatePriceStream as (p: {
          symbols: string[];
        }) => Promise<void>
      )({
        symbols: ['ETH'],
      });
      (api.perpsDeactivatePriceStream as () => void)();

      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('deactivatePriceStream is a no-op when no stream active', () => {
      const { bridge } = createBridge();
      const api = bridge.bridgeApi();
      expect(() =>
        (api.perpsDeactivatePriceStream as () => void)(),
      ).not.toThrow();
    });
  });

  describe('perpsActivateOrderBookStream / perpsDeactivateOrderBookStream', () => {
    it('subscribes to order book and emits on orderBook channel', async () => {
      const controller = createMockController();
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateOrderBookStream as (p: {
          symbol: string;
        }) => Promise<void>
      )({
        symbol: 'ETH',
      });

      expect(controller.subscribeToOrderBook).toHaveBeenCalledWith({
        symbol: 'ETH',
        callback: expect.any(Function),
      });
      const callback = controller.subscribeToOrderBook.mock.calls[0][0]
        .callback as (data: unknown) => void;
      callback({ bids: [], asks: [] });
      expect(emit).toHaveBeenCalledWith('orderBook', { bids: [], asks: [] });
    });

    it('forwards levels / nSigFigs / mantissa to the controller', async () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateOrderBookStream as (p: {
          symbol: string;
          levels?: number;
          nSigFigs?: 2 | 3 | 4 | 5;
          mantissa?: 2 | 5;
        }) => Promise<void>
      )({
        symbol: 'ETH',
        levels: 25,
        nSigFigs: 4,
        mantissa: 5,
      });

      expect(controller.subscribeToOrderBook).toHaveBeenCalledWith({
        symbol: 'ETH',
        levels: 25,
        nSigFigs: 4,
        mantissa: 5,
        callback: expect.any(Function),
      });
    });

    it('deactivateOrderBookStream tears down order book subscription', async () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToOrderBook.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateOrderBookStream as (p: {
          symbol: string;
        }) => Promise<void>
      )({
        symbol: 'ETH',
      });
      (api.perpsDeactivateOrderBookStream as () => void)();

      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('does not subscribe when deactivated before init resolves (deferred-init guard)', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      let resolveInit: () => void = () => undefined;
      controllerApi.perpsInit.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveInit = resolve;
        }),
      );
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      // Activation starts but blocks on the still-pending init promise.
      const activation = (
        api.perpsActivateOrderBookStream as (p: {
          symbol: string;
        }) => Promise<void>
      )({ symbol: 'ETH' });

      // The panel is closed (deactivated) before init resolves.
      (api.perpsDeactivateOrderBookStream as () => void)();

      // Init finally resolves; the stale continuation must abort instead of
      // resurrecting the subscription after teardown.
      resolveInit();
      await activation;

      expect(controller.subscribeToOrderBook).not.toHaveBeenCalled();
    });

    it('still subscribes for a deferred activation that is not deactivated', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      let resolveInit: () => void = () => undefined;
      controllerApi.perpsInit.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveInit = resolve;
        }),
      );
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      const activation = (
        api.perpsActivateOrderBookStream as (p: {
          symbol: string;
        }) => Promise<void>
      )({ symbol: 'ETH' });

      // No deactivation this time — the guard must not suppress a legitimate
      // activation once init resolves.
      resolveInit();
      await activation;

      expect(controller.subscribeToOrderBook).toHaveBeenCalledWith({
        symbol: 'ETH',
        callback: expect.any(Function),
      });
    });
  });

  describe('perpsActivateOrderBookAggregatedStream / perpsDeactivateOrderBookAggregatedStream', () => {
    it('subscribes on the dedicated connection and emits on orderBookAggregated channel', async () => {
      const controller = createMockController();
      const subscribeAggregatedOrderBook = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        subscribeAggregatedOrderBook,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateOrderBookAggregatedStream as (p: {
          symbol: string;
          levels?: number;
          nSigFigs?: 2 | 3 | 4 | 5;
          mantissa?: 2 | 5;
          subscriptionId?: string;
        }) => Promise<void>
      )({
        symbol: 'ETH',
        levels: 20,
        nSigFigs: 3,
        subscriptionId: 'ETH:3::0',
      });

      // The aggregated stream uses the dedicated connection, never the shared
      // controller socket.
      expect(controller.subscribeToOrderBook).not.toHaveBeenCalled();
      expect(subscribeAggregatedOrderBook).toHaveBeenCalledWith({
        symbol: 'ETH',
        levels: 20,
        nSigFigs: 3,
        mantissa: undefined,
        callback: expect.any(Function),
        onStatusChange: expect.any(Function),
      });
      const callback = subscribeAggregatedOrderBook.mock.calls[0][0]
        .callback as (data: unknown) => void;
      callback({ bids: [], asks: [] });
      expect(emit).toHaveBeenCalledWith(
        'orderBookAggregated',
        {
          bids: [],
          asks: [],
        },
        { subscriptionId: 'ETH:3::0' },
      );
    });

    it('emits connection status on the orderBookAggregatedStatus channel', async () => {
      const controller = createMockController();
      const subscribeAggregatedOrderBook = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        subscribeAggregatedOrderBook,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateOrderBookAggregatedStream as (p: {
          symbol: string;
          nSigFigs?: 2 | 3 | 4 | 5;
          subscriptionId?: string;
        }) => Promise<void>
      )({ symbol: 'ETH', nSigFigs: 3, subscriptionId: 'ETH:3::0' });

      const { onStatusChange } = subscribeAggregatedOrderBook.mock.calls[0][0];
      onStatusChange('error');
      expect(emit).toHaveBeenCalledWith('orderBookAggregatedStatus', 'error', {
        subscriptionId: 'ETH:3::0',
      });
    });

    it('tags emissions with the subscription identity captured at activate time', async () => {
      const controller = createMockController();
      const subscribeAggregatedOrderBook = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        subscribeAggregatedOrderBook,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateOrderBookAggregatedStream as (p: {
          symbol: string;
          nSigFigs?: 2 | 3 | 4 | 5;
          subscriptionId?: string;
        }) => Promise<void>
      )({ symbol: 'BTC', nSigFigs: 4, subscriptionId: 'BTC:4::0' });

      const firstCallback = subscribeAggregatedOrderBook.mock.calls[0][0]
        .callback as (data: unknown) => void;

      await (
        api.perpsActivateOrderBookAggregatedStream as (p: {
          symbol: string;
          nSigFigs?: 2 | 3 | 4 | 5;
          subscriptionId?: string;
        }) => Promise<void>
      )({ symbol: 'BTC', nSigFigs: 5, subscriptionId: 'BTC:5::0' });

      // Late packet from the first subscription still carries the old identity.
      firstCallback({ bids: [{ price: '1' }], asks: [] });
      expect(emit).toHaveBeenCalledWith(
        'orderBookAggregated',
        { bids: [{ price: '1' }], asks: [] },
        { subscriptionId: 'BTC:4::0' },
      );

      const secondCallback = subscribeAggregatedOrderBook.mock.calls[1][0]
        .callback as (data: unknown) => void;
      secondCallback({ bids: [{ price: '2' }], asks: [] });
      expect(emit).toHaveBeenCalledWith(
        'orderBookAggregated',
        { bids: [{ price: '2' }], asks: [] },
        { subscriptionId: 'BTC:5::0' },
      );
    });

    it('runs independently of the raw order book stream', async () => {
      const controller = createMockController();
      const rawUnsub = jest.fn();
      const aggregatedUnsub = jest.fn();
      controller.subscribeToOrderBook.mockReturnValue(rawUnsub);
      const subscribeAggregatedOrderBook = jest
        .fn()
        .mockReturnValue(aggregatedUnsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        subscribeAggregatedOrderBook,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateOrderBookStream as (p: {
          symbol: string;
        }) => Promise<void>
      )({
        symbol: 'ETH',
      });
      await (
        api.perpsActivateOrderBookAggregatedStream as (p: {
          symbol: string;
          nSigFigs?: 2 | 3 | 4 | 5;
        }) => Promise<void>
      )({ symbol: 'ETH', nSigFigs: 3 });

      // Raw stream on the shared socket, aggregated on the dedicated connection.
      expect(controller.subscribeToOrderBook).toHaveBeenCalledTimes(1);
      expect(subscribeAggregatedOrderBook).toHaveBeenCalledTimes(1);
      expect(rawUnsub).not.toHaveBeenCalled();
      expect(aggregatedUnsub).not.toHaveBeenCalled();

      // Tearing down the aggregated stream leaves the raw stream intact.
      (api.perpsDeactivateOrderBookAggregatedStream as () => void)();
      expect(aggregatedUnsub).toHaveBeenCalledTimes(1);
      expect(rawUnsub).not.toHaveBeenCalled();
    });

    it('does not subscribe when deactivated before init resolves (deferred-init guard)', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      const subscribeAggregatedOrderBook = jest.fn().mockReturnValue(jest.fn());
      let resolveInit: () => void = () => undefined;
      controllerApi.perpsInit.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveInit = resolve;
        }),
      );
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
        subscribeAggregatedOrderBook,
      });
      const api = bridge.bridgeApi();

      const activation = (
        api.perpsActivateOrderBookAggregatedStream as (p: {
          symbol: string;
          nSigFigs?: 2 | 3 | 4 | 5;
        }) => Promise<void>
      )({ symbol: 'ETH', nSigFigs: 3 });

      (api.perpsDeactivateOrderBookAggregatedStream as () => void)();

      resolveInit();
      await activation;

      expect(subscribeAggregatedOrderBook).not.toHaveBeenCalled();
    });
  });

  describe('perpsActivateCandleStream / perpsDeactivateCandleStream', () => {
    it('subscribes to candles and emits with metadata', async () => {
      const controller = createMockController();
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateCandleStream as (
          p: Record<string, unknown>,
        ) => Promise<void>
      )({
        symbol: 'ETH',
        interval: '1h',
        duration: '1d',
      });

      expect(controller.subscribeToCandles).toHaveBeenCalledWith({
        symbol: 'ETH',
        interval: '1h',
        duration: '1d',
        callback: expect.any(Function),
      });
      const callback = controller.subscribeToCandles.mock.calls[0][0]
        .callback as (data: unknown) => void;
      callback({ o: 100 });
      expect(emit).toHaveBeenCalledWith(
        'candles',
        { o: 100 },
        { symbol: 'ETH', interval: '1h' },
      );
    });

    it('deactivateCandleStream tears down candle subscription', async () => {
      jest.useFakeTimers();
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateCandleStream as (
          p: Record<string, unknown>,
        ) => Promise<void>
      )({
        symbol: 'ETH',
        interval: '1h',
      });
      (
        api.perpsDeactivateCandleStream as (p: {
          symbol: string;
          interval: string;
        }) => void
      )({
        symbol: 'ETH',
        interval: '1h',
      });

      jest.advanceTimersByTime(150);

      expect(unsub).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });

    it('keeps other candle streams when deactivating one symbol+interval', async () => {
      jest.useFakeTimers();
      const controller = createMockController();
      const unsubBtc = jest.fn();
      const unsubEth = jest.fn();
      controller.subscribeToCandles
        .mockReturnValueOnce(unsubBtc)
        .mockReturnValueOnce(unsubEth);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      const deactivate = api.perpsDeactivateCandleStream as (p: {
        symbol: string;
        interval: string;
      }) => void;

      await (
        api.perpsActivateCandleStream as (
          p: Record<string, unknown>,
        ) => Promise<void>
      )({
        symbol: 'BTC',
        interval: '1h',
      });
      await (
        api.perpsActivateCandleStream as (
          p: Record<string, unknown>,
        ) => Promise<void>
      )({
        symbol: 'ETH',
        interval: '4h',
      });

      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(2);

      deactivate({ symbol: 'BTC', interval: '1h' });

      jest.advanceTimersByTime(150);

      expect(unsubBtc).toHaveBeenCalledTimes(1);
      expect(unsubEth).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('short-circuits when the same candle stream is already active', async () => {
      jest.useFakeTimers();
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      const activate = api.perpsActivateCandleStream as (
        p: Record<string, unknown>,
      ) => Promise<void>;

      await activate({ symbol: 'BTC', interval: '5m' });
      await activate({ symbol: 'BTC', interval: '5m' });

      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('does not subscribe when destroy() runs while init is pending', async () => {
      const controller = createMockController();
      let resolveInit: (() => void) | undefined;
      let startInit!: () => void;
      const initStarted = new Promise<void>((resolve) => {
        startInit = resolve;
      });
      const controllerApi = createMockControllerApi();
      controllerApi.perpsInit.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveInit = resolve;
            startInit();
          }),
      );
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();
      const activate = api.perpsActivateCandleStream as (
        p: Record<string, unknown>,
      ) => Promise<void>;

      const pending = activate({ symbol: 'BTC', interval: '5m' });
      await initStarted;
      bridge.destroy();

      resolveInit?.();
      await pending;

      expect(controller.subscribeToCandles).not.toHaveBeenCalled();
    });

    it('coalesces concurrent activate calls for the same key across pending init', async () => {
      const controller = createMockController();
      let resolveInit: (() => void) | undefined;
      const controllerApi = createMockControllerApi();
      controllerApi.perpsInit.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveInit = resolve;
        }),
      );
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();
      const activate = api.perpsActivateCandleStream as (
        p: Record<string, unknown>,
      ) => Promise<void>;

      const first = activate({ symbol: 'BTC', interval: '5m' });
      const second = activate({ symbol: 'BTC', interval: '5m' });
      const third = activate({ symbol: 'BTC', interval: '5m' });

      // Let both callers pass the synchronous guards and queue behind init.
      await Promise.resolve();

      resolveInit?.();
      await Promise.all([first, second, third]);

      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);
      expect(controllerApi.perpsInit).toHaveBeenCalledTimes(1);
    });

    it('resubscribes after destroy() when a later activate runs', async () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      const activate = api.perpsActivateCandleStream as (
        p: Record<string, unknown>,
      ) => Promise<void>;

      await activate({ symbol: 'BTC', interval: '5m' });
      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);

      // Simulate perpsDisconnect / perpsToggleTestnet tearing the bridge down.
      bridge.destroy();

      // A later activate (e.g. after user reconnects or flips testnet) must
      // issue a fresh subscribe, not be permanently suppressed by a latched
      // destroyed flag.
      await activate({ symbol: 'BTC', interval: '5m' });
      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(2);
    });

    it('cancels deferred teardown when matching activate arrives within 150ms', async () => {
      jest.useFakeTimers();
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      const activate = api.perpsActivateCandleStream as (
        p: Record<string, unknown>,
      ) => Promise<void>;
      const deactivate = api.perpsDeactivateCandleStream as (p: {
        symbol: string;
        interval: string;
      }) => void;

      await activate({ symbol: 'BTC', interval: '5m' });
      deactivate({ symbol: 'BTC', interval: '5m' });

      await activate({ symbol: 'BTC', interval: '5m' });

      jest.advanceTimersByTime(200);

      expect(unsub).not.toHaveBeenCalled();
      expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('clears pending candle teardown timers on destroy', async () => {
      jest.useFakeTimers();
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      const activate = api.perpsActivateCandleStream as (
        p: Record<string, unknown>,
      ) => Promise<void>;
      const deactivate = api.perpsDeactivateCandleStream as (p: {
        symbol: string;
        interval: string;
      }) => void;

      await activate({ symbol: 'BTC', interval: '5m' });
      deactivate({ symbol: 'BTC', interval: '5m' });

      bridge.destroy();

      jest.advanceTimersByTime(200);

      expect(unsub).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('destroy', () => {
    it('tears down bridge subscriptions and retains provider-owned fills', async () => {
      const controller = createMockController();
      const stateChangeUnsub = jest.fn();
      const onControllerStateChange = jest
        .fn()
        .mockReturnValue(stateChangeUnsub);
      const connectivityUnsub = jest.fn();
      const onConnectivityChange = jest.fn().mockReturnValue(connectivityUnsub);
      const unsubs = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
      const fillsUnsubscribe = jest.fn();
      controller.subscribeToPositions.mockReturnValue(unsubs[0]);
      controller.subscribeToOrders.mockReturnValue(unsubs[1]);
      controller.subscribeToAccount.mockReturnValue(unsubs[2]);
      controller.subscribeToOrderFills.mockReturnValue(fillsUnsubscribe);
      controller.subscribeToConnectionState.mockReturnValue(unsubs[3]);

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        onConnectivityChange,
      });
      (bridge.bridgeApi().perpsViewActive as (active: boolean) => void)(true);
      await bridge.bridgeApi().perpsInit();
      bridge.destroy();

      for (const unsub of unsubs) {
        expect(unsub).toHaveBeenCalledTimes(1);
      }
      expect(fillsUnsubscribe).not.toHaveBeenCalled();
      expect(stateChangeUnsub).toHaveBeenCalledTimes(1);
      expect(connectivityUnsub).toHaveBeenCalledTimes(1);
      PerpsStreamBridge.invalidateController(
        controller as unknown as PerpsController,
      );
      expect(fillsUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('tears down all dynamic subscriptions', async () => {
      const controller = createMockController();
      const priceUnsub = jest.fn();
      const orderBookUnsub = jest.fn();
      const candleUnsub = jest.fn();
      controller.subscribeToPrices.mockReturnValue(priceUnsub);
      controller.subscribeToOrderBook.mockReturnValue(orderBookUnsub);
      controller.subscribeToCandles.mockReturnValue(candleUnsub);

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      await (
        bridge.bridgeApi().perpsActivateStreaming as (
          p: Record<string, unknown>,
        ) => Promise<void>
      )({
        priceSymbols: ['ETH'],
        orderBookSymbol: 'BTC',
        candle: { symbol: 'ETH', interval: '1h' },
      });
      bridge.destroy();

      expect(priceUnsub).toHaveBeenCalledTimes(1);
      expect(orderBookUnsub).toHaveBeenCalledTimes(1);
      expect(candleUnsub).toHaveBeenCalledTimes(1);
    });

    it('swallows errors thrown by unsub functions', async () => {
      const controller = createMockController();
      controller.subscribeToPositions.mockReturnValue(() => {
        throw new Error('static teardown failure');
      });
      controller.subscribeToPrices.mockReturnValue(() => {
        throw new Error('dynamic teardown failure');
      });

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      await api.perpsInit();
      await (
        api.perpsActivateStreaming as (
          p: Record<string, unknown>,
        ) => Promise<void>
      )({
        priceSymbols: ['ETH'],
      });

      expect(() => bridge.destroy()).not.toThrow();
    });

    it('does not throw when called with no active subscriptions', () => {
      const { bridge } = createBridge();
      expect(() => bridge.destroy()).not.toThrow();
    });

    it('resets isActive to false after destruction', async () => {
      const { bridge } = createBridge();
      const api = bridge.bridgeApi();
      await api.perpsInit();
      (api.perpsViewActive as (v: boolean) => void)(true);
      expect(bridge.isActive).toBe(true);

      bridge.destroy();
      expect(bridge.isActive).toBe(false);
    });

    it('resets viewActive so re-activation requires explicit perpsViewActive(true)', async () => {
      const { bridge } = createBridge();
      const api = bridge.bridgeApi();
      await api.perpsInit();
      (api.perpsViewActive as (v: boolean) => void)(true);
      expect(bridge.isActive).toBe(true);

      bridge.destroy();
      await api.perpsInit();
      expect(bridge.isActive).toBe(false);

      (api.perpsViewActive as (v: boolean) => void)(true);
      expect(bridge.isActive).toBe(true);
    });

    it('does not throw when called twice (idempotent)', async () => {
      const { bridge } = createBridge();
      const api = bridge.bridgeApi();
      await api.perpsInit();
      await (
        api.perpsActivateStreaming as (
          p: Record<string, unknown>,
        ) => Promise<void>
      )({
        priceSymbols: ['ETH'],
      });

      expect(() => {
        bridge.destroy();
        bridge.destroy();
      }).not.toThrow();
    });
  });

  describe('perpsCheckHealth', () => {
    it('calls reconnect when connection state is disconnected', async () => {
      const controller = createMockController();
      controller.getWebSocketConnectionState.mockReturnValue(
        WebSocketConnectionState.Disconnected as never,
      );
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      await api.perpsInit();

      (api.perpsCheckHealth as () => void)();

      expect(controller.reconnect).toHaveBeenCalledTimes(1);
    });

    it('does not call reconnect when connection state is connected', async () => {
      const controller = createMockController();
      controller.getWebSocketConnectionState.mockReturnValue(
        WebSocketConnectionState.Connected as never,
      );
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      await api.perpsInit();

      (api.perpsCheckHealth as () => void)();

      expect(controller.reconnect).not.toHaveBeenCalled();
    });

    it('is a no-op when bridge is not activated', () => {
      const controller = createMockController();
      controller.getWebSocketConnectionState.mockReturnValue(
        WebSocketConnectionState.Disconnected as never,
      );
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      (bridge.bridgeApi().perpsCheckHealth as () => void)();

      expect(controller.getWebSocketConnectionState).not.toHaveBeenCalled();
      expect(controller.reconnect).not.toHaveBeenCalled();
    });

    it('swallows reconnect errors', async () => {
      const controller = createMockController();
      controller.getWebSocketConnectionState.mockReturnValue(
        WebSocketConnectionState.Disconnected as never,
      );
      controller.reconnect.mockRejectedValue(new Error('reconnect failed'));
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      await api.perpsInit();

      expect(() => (api.perpsCheckHealth as () => void)()).not.toThrow();
    });
  });

  describe('market data preload sync', () => {
    it('emits markets when cachedMarketDataByProvider updates', async () => {
      const controller = createMockController();
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      const mockMarkets = [{ symbol: 'ETH' }, { symbol: 'BTC' }];
      stateChangeCallback(
        {
          activeProvider: 'hyperliquid',
          isTestnet: false,
          cachedMarketDataByProvider: {
            'hyperliquid:mainnet': { data: mockMarkets, timestamp: 1000 },
          },
        },
        [],
      );

      expect(emit).toHaveBeenCalledWith('markets', mockMarkets, {
        live: expect.any(Boolean),
      });
    });

    it('does not emit the un-enriched preload snapshot when terminal backend is enabled', async () => {
      const controller = createMockController();
      controller.getMarketDataWithPrices.mockResolvedValue([] as never);
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        isTerminalBackendEnabled: () => true,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const rawSnapshot = [{ symbol: 'ETH' }, { symbol: 'BTC' }];
      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      stateChangeCallback(
        {
          activeProvider: 'hyperliquid',
          isTestnet: false,
          cachedMarketDataByProvider: {
            'hyperliquid:mainnet': {
              data: rawSnapshot,
              timestamp: 1000,
            },
          },
        },
        [],
      );

      expect(emit).not.toHaveBeenCalledWith('markets', rawSnapshot, {
        live: expect.any(Boolean),
      });
    });

    it('refetches enriched terminal market data and emits it when the preload cache updates', async () => {
      const controller = createMockController();
      const enrichedMarkets = [
        { symbol: 'ETH', name: 'Ethereum' },
        { symbol: 'BTC', name: 'Bitcoin' },
      ];
      controller.getMarketDataWithPrices.mockResolvedValue(
        enrichedMarkets as never,
      );
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        isTerminalBackendEnabled: () => true,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      stateChangeCallback(
        {
          activeProvider: 'hyperliquid',
          isTestnet: false,
          cachedMarketDataByProvider: {
            'hyperliquid:mainnet': {
              data: [{ symbol: 'ETH' }],
              timestamp: 1000,
            },
          },
        },
        [],
      );

      await Promise.resolve();
      await Promise.resolve();

      expect(controller.getMarketDataWithPrices).toHaveBeenCalledWith({
        useTerminalApi: true,
      });
      expect(emit).toHaveBeenCalledWith('markets', enrichedMarkets, {
        live: expect.any(Boolean),
      });
    });

    it('does not refetch terminal market data when the timestamp is unchanged', async () => {
      const controller = createMockController();
      controller.getMarketDataWithPrices.mockResolvedValue([] as never);
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        isTerminalBackendEnabled: () => true,
      });
      await bridge.bridgeApi().perpsInit();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      const state = {
        activeProvider: 'hyperliquid',
        isTestnet: false,
        cachedMarketDataByProvider: {
          'hyperliquid:mainnet': {
            data: [{ symbol: 'ETH' }],
            timestamp: 1000,
          },
        },
      };

      stateChangeCallback(state, []);
      stateChangeCallback(state, []);
      await Promise.resolve();
      await Promise.resolve();

      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(1);
    });

    it('serializes concurrent preload bumps into a single follow-up terminal refetch', async () => {
      const controller = createMockController();
      let resolveFirst: ((value: unknown) => void) | undefined;
      let calls = 0;
      controller.getMarketDataWithPrices.mockImplementation(() => {
        calls += 1;
        if (calls === 1) {
          return new Promise((resolve) => {
            resolveFirst = resolve;
          }) as never;
        }
        return Promise.resolve([{ symbol: 'FINAL' }] as never);
      });
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        isTerminalBackendEnabled: () => true,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      const makeState = (timestamp: number) => ({
        activeProvider: 'hyperliquid',
        isTestnet: false,
        cachedMarketDataByProvider: {
          'hyperliquid:mainnet': {
            data: [{ symbol: 'ETH' }],
            timestamp,
          },
        },
      });

      // First bump starts a fetch that is still pending.
      stateChangeCallback(makeState(1000), []);
      // Two more bumps land mid-fetch; they must coalesce into one re-run.
      stateChangeCallback(makeState(2000), []);
      stateChangeCallback(makeState(3000), []);

      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(1);

      resolveFirst?.([{ symbol: 'FIRST' }]);
      await new Promise((resolve) => setImmediate(resolve));

      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(2);
      expect(emit).toHaveBeenCalledWith('markets', [{ symbol: 'FINAL' }], {
        live: true,
      });
    });

    it('does not emit a terminal refetch result after destroy', async () => {
      const controller = createMockController();
      let resolveFetch: ((value: unknown) => void) | undefined;
      controller.getMarketDataWithPrices.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }) as never,
      );
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        isTerminalBackendEnabled: () => true,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      stateChangeCallback(
        {
          activeProvider: 'hyperliquid',
          isTestnet: false,
          cachedMarketDataByProvider: {
            'hyperliquid:mainnet': {
              data: [{ symbol: 'ETH' }],
              timestamp: 1000,
            },
          },
        },
        [],
      );

      bridge.destroy();
      resolveFetch?.([{ symbol: 'LATE' }]);
      await Promise.resolve();
      await Promise.resolve();

      expect(emit).not.toHaveBeenCalledWith('markets', expect.anything());
    });

    it('does not emit a terminal refetch result when the backend is disabled mid-flight', async () => {
      const controller = createMockController();
      let resolveFetch: ((value: unknown) => void) | undefined;
      controller.getMarketDataWithPrices.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }) as never,
      );
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      let terminalEnabled = true;
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        isTerminalBackendEnabled: () => terminalEnabled,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      stateChangeCallback(
        {
          activeProvider: 'hyperliquid',
          isTestnet: false,
          cachedMarketDataByProvider: {
            'hyperliquid:mainnet': {
              data: [{ symbol: 'ETH' }],
              timestamp: 1000,
            },
          },
        },
        [],
      );
      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(1);

      // Terminal backend flips off before the in-flight fetch settles: the
      // enriched payload no longer matches the active mode and must not emit.
      terminalEnabled = false;
      resolveFetch?.([{ symbol: 'ENRICHED' }]);
      await new Promise((resolve) => setImmediate(resolve));

      expect(emit).not.toHaveBeenCalledWith('markets', expect.anything());
    });

    it('does not emit an empty terminal refetch result so it cannot blank or latch the markets channel', async () => {
      const controller = createMockController();
      controller.getMarketDataWithPrices.mockResolvedValue([] as never);
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        isTerminalBackendEnabled: () => true,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      stateChangeCallback(
        {
          activeProvider: 'hyperliquid',
          isTestnet: false,
          cachedMarketDataByProvider: {
            'hyperliquid:mainnet': {
              data: [{ symbol: 'ETH' }],
              timestamp: 1000,
            },
          },
        },
        [],
      );
      await new Promise((resolve) => setImmediate(resolve));

      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(1);
      expect(emit).not.toHaveBeenCalledWith('markets', expect.anything());
    });

    it('skips the queued terminal refetch rerun when the backend is disabled before it runs', async () => {
      const controller = createMockController();
      const resolvers: ((value: unknown) => void)[] = [];
      controller.getMarketDataWithPrices.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvers.push(resolve);
          }) as never,
      );
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      let terminalEnabled = true;
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        isTerminalBackendEnabled: () => terminalEnabled,
      });
      await bridge.bridgeApi().perpsInit();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;
      const makeState = (timestamp: number) => ({
        activeProvider: 'hyperliquid',
        isTestnet: false,
        cachedMarketDataByProvider: {
          'hyperliquid:mainnet': { data: [{ symbol: 'ETH' }], timestamp },
        },
      });

      // First bump starts an in-flight refetch; the second bump coalesces into
      // a single pending rerun.
      stateChangeCallback(makeState(1000), []);
      stateChangeCallback(makeState(2000), []);
      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(1);

      // Backend turns off before the in-flight fetch settles and fires the
      // queued rerun. The rerun must re-check the flag and bail out instead of
      // issuing another Terminal REST call.
      terminalEnabled = false;
      resolvers[0]?.([{ symbol: 'ENRICHED' }]);
      await new Promise((resolve) => setImmediate(resolve));

      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(1);
    });

    it('ignores a stale terminal refetch settling from a prior generation', async () => {
      const controller = createMockController();
      const resolvers: ((value: unknown) => void)[] = [];
      controller.getMarketDataWithPrices.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvers.push(resolve);
          }) as never,
      );
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        isTerminalBackendEnabled: () => true,
      });
      await bridge.bridgeApi().perpsInit();

      const makeState = (timestamp: number) => ({
        activeProvider: 'hyperliquid',
        isTestnet: false,
        cachedMarketDataByProvider: {
          'hyperliquid:mainnet': { data: [{ symbol: 'ETH' }], timestamp },
        },
      });

      const firstCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      // Generation 0: start a Terminal refetch that stays pending.
      firstCallback(makeState(1000), []);
      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(1);

      // Tear down and start a fresh generation with its own in-flight refetch.
      bridge.destroy();
      await bridge.bridgeApi().perpsInit();
      const secondCallback = onControllerStateChange.mock.calls[1][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;
      secondCallback(makeState(2000), []);
      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(2);

      // The prior generation's fetch settles late. Its finally block must not
      // clear the current generation's in-flight flag.
      resolvers[0]?.([{ symbol: 'STALE' }]);
      await new Promise((resolve) => setImmediate(resolve));

      // A new bump while the current fetch is still in flight must coalesce into
      // a single pending follow-up, not spawn an extra concurrent Terminal REST
      // call. If the stale finally had cleared in-flight, this would start a
      // third concurrent fetch.
      secondCallback(makeState(3000), []);
      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(2);
    });

    it('skips emit when market data is empty', async () => {
      const controller = createMockController();
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      stateChangeCallback(
        {
          activeProvider: 'hyperliquid',
          isTestnet: false,
          cachedMarketDataByProvider: {
            'hyperliquid:mainnet': { data: [], timestamp: 1000 },
          },
        },
        [],
      );

      expect(emit).not.toHaveBeenCalledWith('markets', expect.anything());
    });

    it('does not re-emit when timestamp has not changed', async () => {
      const controller = createMockController();
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      const state = {
        activeProvider: 'hyperliquid',
        isTestnet: false,
        cachedMarketDataByProvider: {
          'hyperliquid:mainnet': {
            data: [{ symbol: 'ETH' }],
            timestamp: 1000,
          },
        },
      };

      stateChangeCallback(state, []);
      stateChangeCallback(state, []);

      expect(emit).toHaveBeenCalledWith('markets', [{ symbol: 'ETH' }], {
        live: false,
      });
      expect(emit).toHaveBeenCalledTimes(1);
    });

    it('emits again when timestamp changes', async () => {
      const controller = createMockController();
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      stateChangeCallback(
        {
          activeProvider: 'hyperliquid',
          isTestnet: false,
          cachedMarketDataByProvider: {
            'hyperliquid:mainnet': {
              data: [{ symbol: 'ETH' }],
              timestamp: 1000,
            },
          },
        },
        [],
      );
      stateChangeCallback(
        {
          activeProvider: 'hyperliquid',
          isTestnet: false,
          cachedMarketDataByProvider: {
            'hyperliquid:mainnet': {
              data: [{ symbol: 'ETH' }, { symbol: 'BTC' }],
              timestamp: 2000,
            },
          },
        },
        [],
      );

      expect(emit).toHaveBeenCalledTimes(2);
      expect(emit).toHaveBeenNthCalledWith(1, 'markets', [{ symbol: 'ETH' }], {
        live: false,
      });
      expect(emit).toHaveBeenNthCalledWith(
        2,
        'markets',
        [{ symbol: 'ETH' }, { symbol: 'BTC' }],
        { live: false },
      );
    });

    it('uses correct key for testnet', async () => {
      const controller = createMockController();
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const stateChangeCallback = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      const mockMarkets = [{ symbol: 'ETH' }];
      stateChangeCallback(
        {
          activeProvider: 'hyperliquid',
          isTestnet: true,
          cachedMarketDataByProvider: {
            'hyperliquid:testnet': { data: mockMarkets, timestamp: 1000 },
          },
        },
        [],
      );

      expect(emit).toHaveBeenCalledWith('markets', mockMarkets, {
        live: expect.any(Boolean),
      });
    });

    it('resets deduplication key on destroy', async () => {
      const controller = createMockController();
      const onControllerStateChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
      });
      const api = bridge.bridgeApi();
      await api.perpsInit();
      emit.mockClear();

      const stateChangeCallback1 = onControllerStateChange.mock.calls[0][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      const state = {
        activeProvider: 'hyperliquid',
        isTestnet: false,
        cachedMarketDataByProvider: {
          'hyperliquid:mainnet': {
            data: [{ symbol: 'ETH' }],
            timestamp: 1000,
          },
        },
      };

      stateChangeCallback1(state, []);
      expect(emit).toHaveBeenCalledTimes(1);

      bridge.destroy();
      await api.perpsInit();
      emit.mockClear();

      const stateChangeCallback2 = onControllerStateChange.mock.calls[1][0] as (
        state: Record<string, unknown>,
        patches: unknown[],
      ) => void;

      stateChangeCallback2(state, []);
      expect(emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('connectivity change handling', () => {
    it('triggers reconnect when device transitions from offline to online', async () => {
      const controller = createMockController();
      controller.getWebSocketConnectionState.mockReturnValue(
        WebSocketConnectionState.Disconnected as never,
      );
      const onConnectivityChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onConnectivityChange,
      });
      await bridge.bridgeApi().perpsInit();

      const connectivityCallback = onConnectivityChange.mock
        .calls[0][0] as (state: { connectivityStatus: string }) => void;

      connectivityCallback({ connectivityStatus: 'offline' });
      connectivityCallback({ connectivityStatus: 'online' });

      expect(controller.reconnect).toHaveBeenCalledTimes(1);
    });

    it('does not reconnect when device stays online', async () => {
      const controller = createMockController();
      const onConnectivityChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onConnectivityChange,
      });
      await bridge.bridgeApi().perpsInit();

      const connectivityCallback = onConnectivityChange.mock
        .calls[0][0] as (state: { connectivityStatus: string }) => void;

      connectivityCallback({ connectivityStatus: 'online' });

      expect(controller.reconnect).not.toHaveBeenCalled();
    });

    it('does not reconnect when WS is already connected', async () => {
      const controller = createMockController();
      controller.getWebSocketConnectionState.mockReturnValue(
        WebSocketConnectionState.Connected as never,
      );
      const onConnectivityChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onConnectivityChange,
      });
      await bridge.bridgeApi().perpsInit();

      const connectivityCallback = onConnectivityChange.mock
        .calls[0][0] as (state: { connectivityStatus: string }) => void;

      connectivityCallback({ connectivityStatus: 'offline' });
      connectivityCallback({ connectivityStatus: 'online' });

      expect(controller.reconnect).not.toHaveBeenCalled();
    });

    it('swallows reconnect errors on connectivity change', async () => {
      const controller = createMockController();
      controller.getWebSocketConnectionState.mockReturnValue(
        WebSocketConnectionState.Disconnected as never,
      );
      controller.reconnect.mockRejectedValue(new Error('reconnect failed'));
      const onConnectivityChange = jest.fn().mockReturnValue(jest.fn());
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onConnectivityChange,
      });
      await bridge.bridgeApi().perpsInit();

      const connectivityCallback = onConnectivityChange.mock
        .calls[0][0] as (state: { connectivityStatus: string }) => void;

      expect(() => {
        connectivityCallback({ connectivityStatus: 'offline' });
        connectivityCallback({ connectivityStatus: 'online' });
      }).not.toThrow();
    });
  });

  describe('connection state handling', () => {
    function getConnectionStateListener(
      controller: ReturnType<typeof createMockController>,
    ): (state: string) => void {
      return controller.subscribeToConnectionState.mock
        .calls[0][0] as unknown as (state: string) => void;
    }

    it('emits connectionState updates to UI', async () => {
      const controller = createMockController();
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      await bridge.bridgeApi().perpsInit();

      const listener = getConnectionStateListener(controller);
      listener(WebSocketConnectionState.Disconnected);

      expect(emit).toHaveBeenCalledWith('connectionState', {
        state: WebSocketConnectionState.Disconnected,
      });
    });

    it('hydrates via REST when connection transitions from disconnected to connected', async () => {
      jest.useFakeTimers();
      const controller = createMockController();
      const mockMarkets = [{ symbol: 'ETH' }];
      const mockPositions = [{ symbol: 'BTC', size: '1' }];
      const mockOrders = [{ orderId: '1' }];
      const mockAccount = { equity: '100' };
      controller.getMarketDataWithPrices.mockResolvedValue(
        mockMarkets as never,
      );
      controller.getPositions.mockResolvedValue(mockPositions as never);
      controller.getOpenOrders.mockResolvedValue(mockOrders as never);
      controller.getAccountState.mockResolvedValue(mockAccount as never);

      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const listener = getConnectionStateListener(controller);

      listener(WebSocketConnectionState.Disconnected);
      listener(WebSocketConnectionState.Connected);

      // Let hydration promises settle
      await jest.advanceTimersByTimeAsync(300);

      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(1);
      expect(controller.getMarketDataWithPrices).toHaveBeenCalledWith({
        useTerminalApi: false,
      });
      expect(controller.getPositions).toHaveBeenCalledWith({
        skipCache: true,
      });
      expect(controller.getOpenOrders).toHaveBeenCalledTimes(1);
      expect(controller.getAccountState).toHaveBeenCalledTimes(1);

      expect(emit).toHaveBeenCalledWith('markets', mockMarkets, {
        live: expect.any(Boolean),
      });
      expect(emit).toHaveBeenCalledWith('positions', mockPositions);
      expect(emit).toHaveBeenCalledWith('orders', mockOrders);
      expect(emit).toHaveBeenCalledWith('account', mockAccount);

      jest.useRealTimers();
    });

    it('hydrates with useTerminalApi: true when terminal backend is enabled', async () => {
      jest.useFakeTimers();
      const controller = createMockController();
      controller.getMarketDataWithPrices.mockResolvedValue([] as never);

      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
        isTerminalBackendEnabled: () => true,
      });
      await bridge.bridgeApi().perpsInit();
      emit.mockClear();

      const listener = getConnectionStateListener(controller);
      listener(WebSocketConnectionState.Disconnected);
      listener(WebSocketConnectionState.Connected);

      await jest.advanceTimersByTimeAsync(300);

      expect(controller.getMarketDataWithPrices).toHaveBeenCalledWith({
        useTerminalApi: true,
      });

      jest.useRealTimers();
    });

    it('does not hydrate on initial connected state (no prior disconnect)', async () => {
      jest.useFakeTimers();
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      await bridge.bridgeApi().perpsInit();

      const listener = getConnectionStateListener(controller);
      listener(WebSocketConnectionState.Connected);

      await jest.advanceTimersByTimeAsync(300);

      expect(controller.getMarketDataWithPrices).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('does not hydrate when connection is dead', async () => {
      jest.useFakeTimers();
      const controller = createMockController();
      let connectionAlive = true;
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        isConnectionAlive: () => connectionAlive,
      });
      await bridge.bridgeApi().perpsInit();

      const listener = getConnectionStateListener(controller);

      // UI stream dies after activation
      connectionAlive = false;

      listener(WebSocketConnectionState.Disconnected);
      listener(WebSocketConnectionState.Connected);

      await jest.advanceTimersByTimeAsync(300);

      expect(controller.getMarketDataWithPrices).not.toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('swallows REST hydration errors', async () => {
      jest.useFakeTimers();
      const controller = createMockController();
      controller.getMarketDataWithPrices.mockRejectedValue(
        new Error('network error'),
      );
      controller.getPositions.mockRejectedValue(new Error('network error'));

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      await bridge.bridgeApi().perpsInit();

      const listener = getConnectionStateListener(controller);
      listener(WebSocketConnectionState.Disconnected);

      await expect(async () => {
        listener(WebSocketConnectionState.Connected);
        await jest.advanceTimersByTimeAsync(300);
      }).not.toThrow();

      jest.useRealTimers();
    });

    it('stale hydration finally does not unblock the guard for an active run after destroy', async () => {
      jest.useFakeTimers();
      const controller = createMockController();

      let resolveFirst: (value: unknown) => void = () => undefined;
      const firstMarketsPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });

      const secondMarkets = [{ symbol: 'SECOND' }];
      let getMarketDataWithPricesCalls = 0;
      controller.getMarketDataWithPrices.mockImplementation(() => {
        getMarketDataWithPricesCalls += 1;
        if (getMarketDataWithPricesCalls === 1) {
          return firstMarketsPromise as never;
        }
        return Promise.resolve(secondMarkets as never);
      });
      controller.getPositions.mockResolvedValue([] as never);
      controller.getOpenOrders.mockResolvedValue([] as never);
      controller.getAccountState.mockResolvedValue(null as never);

      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      await api.perpsInit();

      const listenerRound1 = getConnectionStateListener(controller);
      listenerRound1(WebSocketConnectionState.Disconnected);
      listenerRound1(WebSocketConnectionState.Connected);

      await Promise.resolve();

      bridge.destroy();
      await api.perpsInit();

      const subscribeCalls = controller.subscribeToConnectionState.mock.calls;
      const listenerRound2 = subscribeCalls[subscribeCalls.length - 1][0] as (
        state: string,
      ) => void;
      listenerRound2(WebSocketConnectionState.Disconnected);
      listenerRound2(WebSocketConnectionState.Connected);

      await Promise.resolve();

      resolveFirst([{ symbol: 'STALE' }]);
      await jest.advanceTimersByTimeAsync(300);

      expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(2);

      const marketPayloads = emit.mock.calls
        .filter((call) => call[0] === 'markets')
        .map((call) => call[1]);
      expect(marketPayloads).toContainEqual(secondMarkets);

      jest.useRealTimers();
    });
  });
});

describe('wallet-root Perps preload', () => {
  function setup(overrides: BridgeOverrides = {}) {
    const controller = {
      ...createMockController(),
      state: { activeProvider: 'hyperliquid', isTestnet: false },
      getActiveProvider: jest.fn(),
      stopMarketDataPreload: jest.fn(),
    };
    const ping = jest.fn().mockResolvedValue(undefined);
    controller.getActiveProvider.mockReturnValue({ ping });
    controller.getMarketDataWithPrices.mockResolvedValue([
      { symbol: 'BTC' },
      { symbol: 'ETH' },
    ] as never);
    const result = createBridge({
      ...overrides,
      controller: controller as unknown as PerpsController,
    });
    const api = result.bridge.bridgeApi() as unknown as {
      perpsInit: () => Promise<void>;
      perpsRegisterPreload: (id: string) => void;
      perpsInitForAccount: (address: string) => Promise<void>;
      perpsStartPreload: (id: string) => Promise<void>;
      perpsStopPreload: (id: string) => void;
      perpsViewActive: (active: boolean) => void;
      perpsActivatePriceStream: (params: {
        symbols: string[];
      }) => Promise<void>;
      perpsDeactivatePriceStream: () => void;
    };
    return { ...result, controller, ping, api };
  }

  it('restores wallet subscriptions after failed preload and global lock teardown', async () => {
    let allowed = true;
    const { api, bridge, controller } = setup({
      isPreloadAllowed: () => allowed,
    });
    await api.perpsInit();
    controller.getMarketDataWithPrices.mockRejectedValueOnce(
      new Error('market fetch failed'),
    );
    await expect(api.perpsStartPreload('failed')).rejects.toThrow(
      'market fetch failed',
    );
    expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
    allowed = false;
    PerpsStreamBridge.invalidateController(
      controller as unknown as PerpsController,
    );
    await api.perpsStopPreload('failed');
    allowed = true;
    await api.perpsInit();
    expect(controller.subscribeToPositions).toHaveBeenCalledTimes(2);
    expect(bridge.canEmit('positions')).toBe(true);
    bridge.dispose();
  });

  it('retains a successful preload provider and fills across a brief UI close', async () => {
    const { api, bridge, controller, controllerApi } = setup();
    const unsubscribeFills = jest.fn();
    controller.subscribeToOrderFills.mockReturnValue(unsubscribeFills);
    api.perpsRegisterPreload('home');
    await api.perpsInitForAccount('0xfirst');
    await api.perpsStartPreload('home');
    const fills = [{ orderId: 'first', timestamp: 1 }] as OrderFill[];
    controller.subscribeToOrderFills.mock.calls[0][0].callback(fills, true);

    bridge.dispose();
    // Let queued cleanup settle before a replacement can mask an early teardown.
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(controllerApi.perpsDisconnect).not.toHaveBeenCalled();
    expect(unsubscribeFills).not.toHaveBeenCalled();

    const replacement = createBridge({
      controller: controller as unknown as PerpsController,
      controllerApi,
    });
    await (
      replacement.bridge.bridgeApi().perpsInitForAccount as (
        address: string,
      ) => Promise<void>
    )('0xfirst');
    expect(controllerApi.perpsDisconnect).not.toHaveBeenCalled();
    expect(controller.subscribeToOrderFills).toHaveBeenCalledTimes(1);
    expect(replacement.emit).toHaveBeenCalledWith('fills', fills);
    replacement.bridge.dispose();
  });

  it('starts the controller preload before foreground initialization like Mobile', async () => {
    const { api, controller, controllerApi } = setup();

    await api.perpsInit();

    expect(
      controller.startMarketDataPreload.mock.invocationCallOrder[0],
    ).toBeLessThan(controllerApi.perpsInit.mock.invocationCallOrder[0]);
  });

  it('cancels registered preload during account init and disconnects after settlement', async () => {
    const { api, bridge, controller, controllerApi } = setup();
    let finishInit!: () => void;
    let startInit!: () => void;
    const started = new Promise<void>((resolve) => {
      startInit = resolve;
    });
    controllerApi.perpsInit.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishInit = resolve;
          startInit();
        }),
    );
    api.perpsRegisterPreload('timed-out');
    const pending = api.perpsInitForAccount('0xfirst');
    const rejected = expect(pending).rejects.toThrow('released');
    await started;
    const stopped = api.perpsStopPreload('timed-out');
    expect(controllerApi.perpsDisconnect).not.toHaveBeenCalled();
    finishInit();
    await rejected;
    await stopped;
    expect(controllerApi.perpsDisconnect).toHaveBeenCalledTimes(1);
    expect(controller.subscribeToPositions).not.toHaveBeenCalled();
    expect(bridge.canEmit('markets')).toBe(false);
    await api.perpsInitForAccount('0xfirst');
    expect(bridge.canEmit('positions')).toBe(true);
    bridge.dispose();
  });

  it('lets a replacement preload owner reuse pending same-account initialization', async () => {
    const { api, bridge, controllerApi } = setup();
    let finishInit!: () => void;
    let startInit!: () => void;
    const started = new Promise<void>((resolve) => {
      startInit = resolve;
    });
    controllerApi.perpsInit.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishInit = resolve;
          startInit();
        }),
    );
    api.perpsRegisterPreload('first');
    const pending = api.perpsInitForAccount('0xfirst');
    await started;
    const stopped = api.perpsStopPreload('first');
    api.perpsRegisterPreload('replacement');
    finishInit();
    await pending;
    await stopped;
    await api.perpsStartPreload('replacement');
    expect(bridge.canEmit('positions')).toBe(true);
    expect(controllerApi.perpsDisconnect).not.toHaveBeenCalled();
    bridge.dispose();
  });

  it.each([false, true])(
    'preserves a surviving owner during preload cancellation with same UI=%s',
    async (sameUi) => {
      const { api, bridge, controller, controllerApi } = setup();
      // A same-UI replacement retains this bridge; otherwise a second UI owns it.
      const survivor = sameUi
        ? bridge
        : createBridge({
            controller: controller as unknown as PerpsController,
            controllerApi,
          }).bridge;
      if (sameUi) {
        api.perpsViewActive(true);
      } else {
        await (
          survivor.bridgeApi().perpsInitForAccount as (
            address: string,
          ) => Promise<void>
        )('0xfirst');
      }
      let finishInit!: () => void;
      let startInit!: () => void;
      const started = new Promise<void>((resolve) => {
        startInit = resolve;
      });
      controllerApi.perpsInit.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            finishInit = resolve;
            startInit();
          }),
      );
      api.perpsRegisterPreload('cancelled');
      const pending = api.perpsInitForAccount('0xfirst');
      const result = sameUi
        ? expect(pending).resolves.toBeUndefined()
        : expect(pending).rejects.toThrow('released');
      await started;
      const stopped = api.perpsStopPreload('cancelled');
      finishInit();
      await result;
      await stopped;
      expect(controllerApi.perpsDisconnect).not.toHaveBeenCalled();
      expect(survivor.canEmit('positions')).toBe(true);
      const third = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      }).bridge;
      await (
        third.bridgeApi().perpsInitForAccount as (
          address: string,
        ) => Promise<void>
      )('0xfirst');
      expect(controllerApi.perpsDisconnect).not.toHaveBeenCalled();
      expect(survivor.canEmit('positions')).toBe(true);
      bridge.dispose();
      if (!sameUi) {
        survivor.dispose();
      }
      third.dispose();
    },
  );

  it.each(['none', 'replacement', 'other-window'] as const)(
    'releases a preload-only session after a market timeout with survivor=%s',
    async (owner) => {
      const { api, bridge, controllerApi, controller } = setup();
      const survivor = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      }).bridge;
      if (owner === 'other-window') {
        await (
          survivor.bridgeApi().perpsInitForAccount as (
            address: string,
          ) => Promise<void>
        )('0xfirst');
      }
      api.perpsRegisterPreload('home');
      await api.perpsInitForAccount('0xfirst');
      let finishMarkets!: (data: never) => void;
      let startMarkets!: () => void;
      const started = new Promise<void>((resolve) => {
        startMarkets = resolve;
      });
      controller.getMarketDataWithPrices.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishMarkets = resolve;
            startMarkets();
          }),
      );
      const pending = api.perpsStartPreload('home');
      const result = expect(pending).rejects.toThrow();
      await started;
      const stopped = api.perpsStopPreload('home');
      if (owner === 'replacement') {
        api.perpsRegisterPreload('replacement');
      }
      await stopped;
      finishMarkets([{ symbol: 'BTC' }] as never);
      await result;
      expect(controllerApi.perpsDisconnect).toHaveBeenCalledTimes(
        owner === 'none' ? 1 : 0,
      );
      if (owner === 'other-window') {
        expect(survivor.canEmit('positions')).toBe(true);
      } else if (owner === 'replacement') {
        await api.perpsStartPreload('replacement');
        expect(bridge.canEmit('markets')).toBe(true);
      } else {
        expect(bridge.canEmit('positions')).toBe(false);
      }
      bridge.dispose();
      survivor.dispose();
    },
  );

  it('rechecks ownership when the last owner releases after a queued cleanup already checked', async () => {
    const { api, bridge, controller, controllerApi } = setup();
    const abandoned = createBridge({
      controller: controller as unknown as PerpsController,
      controllerApi,
    }).bridge;
    const abandonedApi = abandoned.bridgeApi() as unknown as typeof api;
    api.perpsRegisterPreload('last-owner');
    await api.perpsInitForAccount('0xfirst');
    abandonedApi.perpsRegisterPreload('abandoned');
    const firstCleanup = abandonedApi.perpsStopPreload('abandoned');
    await Promise.resolve();
    await Promise.resolve();
    const lastCleanup = api.perpsStopPreload('last-owner');
    await firstCleanup;
    await lastCleanup;
    expect(controllerApi.perpsDisconnect).toHaveBeenCalledTimes(1);
    expect(bridge.canEmit('positions')).toBe(false);
    bridge.dispose();
    abandoned.dispose();
  });

  it('waits for pending initialization before disconnecting a remotely disabled provider', async () => {
    let allowed = true;
    const { api, bridge, controllerApi, controller } = setup({
      isPreloadAllowed: () => allowed,
    });
    let finishInit!: () => void;
    let startInit!: () => void;
    const started = new Promise<void>((resolve) => {
      startInit = resolve;
    });
    controllerApi.perpsInit.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishInit = resolve;
          startInit();
        }),
    );
    api.perpsRegisterPreload('home');
    const pending = api.perpsInitForAccount('0xfirst');
    const result = expect(pending).rejects.toThrow('released');
    await started;
    allowed = false;
    const stopped = api.perpsStopPreload('home');
    const duplicate = api.perpsStopPreload('home');
    expect(controllerApi.perpsDisconnect).not.toHaveBeenCalled();
    finishInit();
    await result;
    await stopped;
    await duplicate;
    expect(controllerApi.perpsDisconnect).toHaveBeenCalledTimes(1);
    expect(controller.subscribeToPositions).not.toHaveBeenCalled();
    bridge.dispose();
  });

  it('disconnects on remote disable even after the preload owner was released', async () => {
    let allowed = true;
    const { api, bridge, controllerApi } = setup({
      isPreloadAllowed: () => allowed,
    });
    await api.perpsInitForAccount('0xfirst');
    await api.perpsStartPreload('home');
    await api.perpsStopPreload('home');
    expect(controllerApi.perpsDisconnect).not.toHaveBeenCalled();
    allowed = false;
    await api.perpsStopPreload('home');
    expect(controllerApi.perpsDisconnect).toHaveBeenCalledTimes(1);
    expect(bridge.canEmit('positions')).toBe(false);
    bridge.dispose();
  });

  it.each(['account', 'stream'] as const)(
    'rejects a resolved failed %s initialization before fills registration and recovers on retry',
    async (path) => {
      const controller = createMockController();
      controller.getActiveProvider.mockImplementationOnce(() => {
        throw new Error('CLIENT_NOT_INITIALIZED');
      });
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();
      const initialize = () =>
        path === 'account'
          ? (api.perpsInitForAccount as (address: string) => Promise<unknown>)(
              '0xfirst',
            )
          : (
              api.perpsActivateStreaming as (params: object) => Promise<unknown>
            )({});
      await expect(initialize()).rejects.toThrow('CLIENT_NOT_INITIALIZED');
      expect(controller.subscribeToOrderFills).not.toHaveBeenCalled();
      expect(bridge.canEmit('fills')).toBe(false);
      await initialize();
      (api.perpsViewActive as (value: boolean) => void)(true);
      const fill = { orderId: 'recovered', timestamp: 1 } as OrderFill;
      controller.subscribeToOrderFills.mock.calls[0][0].callback([fill], true);
      expect(emit).toHaveBeenLastCalledWith('fills', [fill]);
      expect(controller.subscribeToOrderFills).toHaveBeenCalledTimes(1);
      PerpsStreamBridge.invalidateController(
        controller as unknown as PerpsController,
      );
      bridge.dispose();
    },
  );

  it('retains separate partial fills for one order', async () => {
    const { api, controller, emit } = setup();
    await api.perpsInit();
    const { callback } = controller.subscribeToOrderFills.mock.calls[0][0];
    const first = {
      orderId: 'one',
      timestamp: 1,
      size: '0.1',
      price: '10',
    } as OrderFill;
    const second = { ...first, timestamp: 2, size: '0.2' };
    callback([first], true);
    callback([second], false);
    expect(emit).toHaveBeenLastCalledWith('fills', [second, first]);
    PerpsStreamBridge.invalidateController(
      controller as unknown as PerpsController,
    );
  });

  it('restarts same-address preload after testnet toggle without retiring the new session', async () => {
    const { api, bridge, controller, controllerApi, emit } = setup();
    await api.perpsInitForAccount('0xfirst');
    await api.perpsStartPreload('mainnet');
    controllerApi.perpsToggleTestnet.mockImplementationOnce(async () => {
      controller.state.isTestnet = true;
    });
    await bridge.bridgeApi().perpsToggleTestnet();
    const markets = [{ symbol: 'TESTNET:BTC' }];
    controller.getMarketDataWithPrices.mockResolvedValueOnce(markets as never);
    api.perpsRegisterPreload('testnet');
    await expect(api.perpsStartPreload('testnet')).resolves.toBeUndefined();
    expect(controllerApi.perpsDisconnect).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('markets', markets, { live: true });
    expect(bridge.canEmit('fills')).toBe(true);
    expect(controller.subscribeToOrderFills).toHaveBeenCalledTimes(2);
    bridge.dispose();
  });

  it('keeps fills warm across Perps navigation until provider teardown', async () => {
    const { api, bridge, controller, emit } = setup();
    const unsubscribe = jest.fn();
    controller.subscribeToOrderFills.mockReturnValue(unsubscribe);
    await api.perpsInit();
    expect(controller.subscribeToOrderFills).toHaveBeenCalledTimes(1);
    expect(bridge.canEmit('fills')).toBe(true);
    api.perpsViewActive(true);
    api.perpsViewActive(false);
    const fill = { orderId: 'one', timestamp: 1 } as OrderFill;
    controller.subscribeToOrderFills.mock.calls[0][0].callback([fill], true);
    expect(emit).toHaveBeenCalledWith('fills', [fill]);
    api.perpsViewActive(true);
    expect(controller.subscribeToOrderFills).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();
    bridge.dispose();
    expect(unsubscribe).not.toHaveBeenCalled();
    PerpsStreamBridge.invalidateController(
      controller as unknown as PerpsController,
    );
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('shares pending fills across UI replacement and replays the session cache', async () => {
    const { api, bridge, controller, emit } = setup();
    const unsubscribe = jest.fn();
    controller.subscribeToOrderFills.mockReturnValue(unsubscribe);
    await api.perpsInitForAccount('0xfirst');
    const survivor = createBridge({
      controller: controller as unknown as PerpsController,
    });
    await (
      survivor.bridge.bridgeApi().perpsInitForAccount as (
        address: string,
      ) => Promise<unknown>
    )('0xfirst');
    bridge.dispose();
    const { callback } = controller.subscribeToOrderFills.mock.calls[0][0];
    const first = { orderId: 'one', timestamp: 1 } as OrderFill;
    const second = { orderId: 'two', timestamp: 2 } as OrderFill;
    emit.mockClear();
    callback([first], true);
    callback([second], false);
    expect(emit).not.toHaveBeenCalled();
    expect(survivor.emit).toHaveBeenLastCalledWith('fills', [second, first]);
    const replacement = createBridge({
      controller: controller as unknown as PerpsController,
    });
    await (
      replacement.bridge.bridgeApi().perpsInitForAccount as (
        address: string,
      ) => Promise<unknown>
    )('0xfirst');
    expect(replacement.emit).toHaveBeenCalledWith('fills', [second, first]);
    expect(controller.subscribeToOrderFills).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();
    PerpsStreamBridge.invalidateController(
      controller as unknown as PerpsController,
    );
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    survivor.bridge.dispose();
    replacement.bridge.dispose();
  });

  it('bounds the fills cache and replaces it with each snapshot including an empty one', async () => {
    const { api, controller, emit } = setup();
    await api.perpsInit();
    const { callback } = controller.subscribeToOrderFills.mock.calls[0][0];
    const fills = Array.from(
      { length: 101 },
      (_, timestamp) => ({ timestamp }) as OrderFill,
    );
    callback(fills, true);
    expect(emit).toHaveBeenLastCalledWith(
      'fills',
      [...fills].reverse().slice(0, 100),
    );
    const newest = { timestamp: 101 } as OrderFill;
    callback([newest], false);
    expect(emit).toHaveBeenLastCalledWith('fills', [
      newest,
      ...fills.slice(2).reverse(),
    ]);
    callback([], true);
    expect(emit).toHaveBeenLastCalledWith('fills', []);
    PerpsStreamBridge.invalidateController(
      controller as unknown as PerpsController,
    );
  });

  it('discards previous-account fills and ignores its late callback after transition', async () => {
    let address = '0xfirst';
    const controller = createMockController();
    const { bridge, emit } = createBridge({
      controller: controller as unknown as PerpsController,
      getSelectedAddress: () => address,
    });
    const init = bridge.bridgeApi().perpsInitForAccount as (
      value: string,
    ) => Promise<unknown>;
    await init(address);
    const previous = controller.subscribeToOrderFills.mock.calls[0][0].callback;
    previous([{ orderId: 'old', timestamp: 1 } as OrderFill], true);
    address = '0xsecond';
    emit.mockClear();
    await init(address);
    previous([{ orderId: 'late', timestamp: 2 } as OrderFill], false);
    expect(emit.mock.calls.filter(([channel]) => channel === 'fills')).toEqual(
      [],
    );
    const current = [{ orderId: 'new', timestamp: 3 } as OrderFill];
    controller.subscribeToOrderFills.mock.calls[1][0].callback(current, true);
    expect(emit).toHaveBeenLastCalledWith('fills', current);
    PerpsStreamBridge.invalidateController(
      controller as unknown as PerpsController,
    );
    bridge.dispose();
  });

  it.each([false, true])(
    'finishes wallet initialization after leaving Perps with remount=%s',
    async (remount) => {
      const { api, bridge, controller, controllerApi } = setup();
      let finishInit!: () => void;
      let initStarted!: () => void;
      const started = new Promise<void>((resolve) => {
        initStarted = resolve;
      });
      controllerApi.perpsInit.mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            finishInit = resolve;
            initStarted();
          }),
      );
      const pending = api.perpsInit();
      await started;

      api.perpsViewActive(true);
      api.perpsViewActive(false);
      if (remount) {
        api.perpsViewActive(true);
      }
      finishInit();

      await expect(pending).resolves.toBeUndefined();
      await api.perpsStartPreload('home');
      expect(bridge.isActive).toBe(remount);
      expect(bridge.canEmit('markets')).toBe(true);
      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToPrices).toHaveBeenCalledWith(
        expect.objectContaining({ symbols: ['BTC', 'ETH'] }),
      );
      bridge.destroy();
    },
  );

  it('still cancels pending wallet initialization on disconnect', async () => {
    const { api, bridge, controller, controllerApi } = setup();
    let finishInit!: () => void;
    let initStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      initStarted = resolve;
    });
    controllerApi.perpsInit.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishInit = resolve;
          initStarted();
        }),
    );
    const pending = api.perpsInit();
    await started;

    await bridge.bridgeApi().perpsDisconnect();
    finishInit();

    await expect(pending).rejects.toThrow('Perps connection was released');
    expect(bridge.canEmit('markets')).toBe(false);
    expect(controller.subscribeToPositions).not.toHaveBeenCalled();
  });

  it.each(['stop', 'pending', 'failure'] as const)(
    'preserves initialized wallet streams after preload %s',
    async (reason) => {
      const { api, bridge, controller, ping, emit } = setup();
      const positionsCleanup = jest.fn();
      const priceCleanup = jest.fn();
      const preloadCleanup = jest.fn();
      controller.subscribeToPositions.mockReturnValue(positionsCleanup);
      controller.subscribeToPrices
        .mockReturnValueOnce(priceCleanup)
        .mockReturnValueOnce(preloadCleanup);
      await api.perpsInit();
      await api.perpsActivatePriceStream({ symbols: ['BTC'] });
      const delivered = jest.fn();
      emit.mockImplementation((channel, data) => {
        if (bridge.canEmit(channel)) {
          delivered(channel, data);
        }
      });

      if (reason === 'failure') {
        ping.mockRejectedValue(new Error('offline'));
        await expect(api.perpsStartPreload('home')).rejects.toThrow('offline');
      } else if (reason === 'pending') {
        let finishPing!: () => void;
        const pingResult = new Promise<void>((resolve) => {
          finishPing = resolve;
        });
        ping.mockReturnValue(pingResult);
        const pending = api.perpsStartPreload('home');
        await Promise.resolve();
        await Promise.resolve();
        api.perpsStopPreload('home');
        finishPing();
        await expect(pending).rejects.toThrow('released');
      } else {
        await api.perpsStartPreload('home');
        api.perpsStopPreload('home');
        expect(preloadCleanup).toHaveBeenCalledTimes(1);
      }
      api.perpsViewActive(true);
      api.perpsViewActive(false);
      controller.subscribeToPositions.mock.calls[0][0].callback([]);
      controller.subscribeToPrices.mock.calls[0][0].callback([]);

      expect(delivered).toHaveBeenCalledWith('positions', []);
      expect(delivered).toHaveBeenCalledWith('prices', []);
      expect(positionsCleanup).not.toHaveBeenCalled();
      expect(priceCleanup).not.toHaveBeenCalled();
      bridge.destroy();
      expect(positionsCleanup).toHaveBeenCalledTimes(1);
      expect(priceCleanup).toHaveBeenCalledTimes(1);
    },
  );

  it('releases initialized wallet streams when eligibility is revoked', async () => {
    let allowed = true;
    const { api, bridge, controller } = setup({
      isPreloadAllowed: () => allowed,
    });
    const cleanup = jest.fn();
    controller.subscribeToPositions.mockReturnValue(cleanup);
    await api.perpsInit();
    await api.perpsStartPreload('home');

    allowed = false;
    api.perpsStopPreload('home');

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(controller.stopMarketDataPreload).toHaveBeenCalled();
    expect(bridge.canEmit('positions')).toBe(false);
  });

  it('prewarms broad prices after provider health succeeds without a visible Perps view', async () => {
    const { api, bridge, controller, ping, emit } = setup();

    await api.perpsStartPreload('home');

    expect(bridge.isActive).toBe(false);
    expect(bridge.canEmit('prices')).toBe(true);
    expect(bridge.canEmit('account')).toBe(true);
    expect(bridge.canEmit('candles')).toBe(false);
    expect(ping.mock.invocationCallOrder[0]).toBeLessThan(
      controller.subscribeToPrices.mock.invocationCallOrder[0],
    );
    expect(controller.subscribeToPrices).toHaveBeenCalledWith(
      expect.objectContaining({
        symbols: ['BTC', 'ETH'],
        includeMarketData: false,
      }),
    );
    expect(emit).toHaveBeenCalledWith(
      'markets',
      [{ symbol: 'BTC' }, { symbol: 'ETH' }],
      { live: true },
    );
    bridge.destroy();
  });

  it('keeps broad prices independent of the foreground symbol subscription', async () => {
    const { api, bridge, controller } = setup();
    const broadCleanup = jest.fn();
    controller.subscribeToPrices.mockReturnValueOnce(broadCleanup);
    await api.perpsStartPreload('home');
    api.perpsViewActive(true);

    await api.perpsActivatePriceStream({ symbols: ['BTC'] });
    api.perpsViewActive(false);

    expect(broadCleanup).not.toHaveBeenCalled();
    expect(bridge.canEmit('markets')).toBe(true);
    api.perpsStopPreload('home');
    expect(broadCleanup).toHaveBeenCalledTimes(1);
    expect(bridge.canEmit('markets')).toBe(false);
  });

  it.each([true, false])(
    'preserves focused prices across broad updates and resubscription, preload first: %s',
    async (preloadFirst) => {
      const { api, bridge, controller, emit } = setup();
      api.perpsViewActive(true);
      if (preloadFirst) {
        await api.perpsStartPreload('home');
      }
      await api.perpsActivatePriceStream({ symbols: ['BTC'] });
      if (!preloadFirst) {
        await api.perpsStartPreload('home');
      }
      const focused = controller.subscribeToPrices.mock.calls.find(
        ([params]) => params.symbols?.length === 1,
      )?.[0];
      if (!focused) {
        throw new Error('Focused price subscription was not registered');
      }
      const focusedPrices = [
        { symbol: 'BTC', price: '51000' },
      ] as PriceUpdate[];
      const broadPrices = [
        { symbol: 'BTC', price: '50000' },
        { symbol: 'ETH', price: '2000' },
      ] as PriceUpdate[];
      focused.callback(focusedPrices);
      expect(emit).toHaveBeenLastCalledWith('prices', focusedPrices);

      for (const owner of ['home', 'replacement']) {
        await api.perpsStartPreload(owner);
        const broad = controller.subscribeToPrices.mock.calls
          .filter(([params]) => params.symbols?.length === 2)
          .at(-1)?.[0];
        if (!broad) {
          throw new Error('Broad price subscription was not registered');
        }
        broad.callback(broadPrices);
        expect(emit).toHaveBeenLastCalledWith('prices', [broadPrices[1]]);
      }

      api.perpsViewActive(false);
      api.perpsDeactivatePriceStream();
      const broad = controller.subscribeToPrices.mock.calls.at(-1)?.[0];
      if (!broad) {
        throw new Error('Broad price subscription was not registered');
      }
      broad.callback(broadPrices);
      expect(emit).toHaveBeenLastCalledWith('prices', broadPrices);
      bridge.destroy();
    },
  );

  it('records the account of a restarted preload before the next account switch', async () => {
    let address = '0xfirst';
    const { api, bridge, controllerApi } = setup({
      getSelectedAddress: () => address,
    });
    api.perpsRegisterPreload('first');
    await api.perpsInitForAccount(address);
    await api.perpsStopPreload('first');
    expect(controllerApi.perpsDisconnect).toHaveBeenCalledTimes(1);
    api.perpsRegisterPreload('retry');
    await api.perpsStartPreload('retry');
    address = '0xsecond';
    await api.perpsInitForAccount(address);
    expect(controllerApi.perpsDisconnect).toHaveBeenCalledTimes(2);
    bridge.dispose();
  });

  it('shares an in-flight preload request for the same owner', async () => {
    const { api, bridge, controllerApi, controller, ping } = setup();
    let finishPing!: () => void;
    ping.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishPing = resolve;
      }),
    );
    const first = api.perpsStartPreload('home');
    const duplicate = api.perpsStartPreload('home');
    finishPing();
    await first;
    await duplicate;
    expect(controllerApi.perpsInit).toHaveBeenCalledTimes(1);
    expect(ping).toHaveBeenCalledTimes(1);
    expect(controller.getMarketDataWithPrices).toHaveBeenCalledTimes(1);
    bridge.dispose();
  });

  it('ignores a stale release after a newer owner replaces it', async () => {
    const { api, bridge, controller } = setup();
    await api.perpsStartPreload('first');
    await api.perpsStartPreload('second');
    const subscriptions = controller.subscribeToPrices.mock.calls.length;

    api.perpsStopPreload('first');
    await api.perpsStartPreload('second');

    expect(bridge.canEmit('prices')).toBe(true);
    expect(controller.subscribeToPrices).toHaveBeenCalledTimes(subscriptions);
    bridge.destroy();
  });

  it('rejects preload when global eligibility is disabled', async () => {
    const { api, controllerApi } = setup({ isPreloadAllowed: () => false });

    await expect(api.perpsStartPreload('home')).rejects.toThrow('unavailable');
    await expect(api.perpsInit()).rejects.toThrow('unavailable');

    expect(controllerApi.perpsInit).not.toHaveBeenCalled();
  });

  it('stops the controller preload when eligibility is revoked', async () => {
    let allowed = true;
    const { api, controller, bridge } = setup({
      isPreloadAllowed: () => allowed,
    });
    await api.perpsStartPreload('home');

    allowed = false;
    api.perpsStopPreload('home');

    expect(controller.stopMarketDataPreload).toHaveBeenCalled();
    expect(bridge.canEmit('prices')).toBe(false);
  });

  it('releases subscriptions after a failed provider ping', async () => {
    const { api, controller, ping, bridge, controllerApi } = setup();
    const cleanup = jest.fn();
    controller.subscribeToPositions.mockReturnValue(cleanup);
    ping.mockRejectedValue(new Error('offline'));

    await expect(api.perpsStartPreload('home')).rejects.toThrow('offline');

    expect(controller.subscribeToPrices).not.toHaveBeenCalled();
    expect(bridge.canEmit('markets')).toBe(false);
    expect(cleanup).toHaveBeenCalled();
    expect(controllerApi.perpsDisconnect).toHaveBeenCalledTimes(1);
  });

  it('preserves foreground subscriptions when wallet preload fails', async () => {
    const { api, controller, ping, bridge } = setup();
    const cleanup = jest.fn();
    controller.subscribeToPositions.mockReturnValue(cleanup);
    await api.perpsInit();
    api.perpsViewActive(true);
    ping.mockRejectedValue(new Error('offline'));

    await expect(api.perpsStartPreload('home')).rejects.toThrow('offline');

    expect(cleanup).not.toHaveBeenCalled();
    expect(bridge.isActive).toBe(true);
    bridge.destroy();
  });

  it('continues initialization after best-effort cache preload throws', async () => {
    const { api, controller, controllerApi, bridge } = setup();
    controller.startMarketDataPreload.mockImplementation(() => {
      throw new Error('cache unavailable');
    });

    await api.perpsInit();

    expect(controllerApi.perpsInit).toHaveBeenCalledTimes(1);
    bridge.destroy();
  });

  it('does not resurrect preload after release during initialization', async () => {
    let resolveInit!: () => void;
    const { api, controllerApi, ping, controller } = setup();
    controllerApi.perpsInit.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveInit = resolve;
      }),
    );
    const preload = api.perpsStartPreload('home');

    api.perpsStopPreload('home');
    resolveInit();

    await expect(preload).rejects.toThrow('released');
    expect(ping).not.toHaveBeenCalled();
    expect(controller.subscribeToPrices).not.toHaveBeenCalled();
  });

  it.each(['provider', 'network', 'terminal'] as const)(
    'rejects stale markets after a %s change',
    async (change) => {
      let terminal = false;
      let resolveMarkets!: (markets: never) => void;
      let startMarkets!: () => void;
      const marketsStarted = new Promise<void>((resolve) => {
        startMarkets = resolve;
      });
      const { api, controller, emit } = setup({
        isTerminalBackendEnabled: () => terminal,
      });
      controller.getMarketDataWithPrices.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveMarkets = resolve;
            startMarkets();
          }),
      );
      const preload = api.perpsStartPreload('home');
      await marketsStarted;
      if (change === 'provider') {
        controller.state.activeProvider = 'aggregated';
      }
      if (change === 'network') {
        controller.state.isTestnet = true;
      }
      if (change === 'terminal') {
        terminal = true;
      }
      resolveMarkets([{ symbol: 'BTC' }] as never);

      await expect(preload).rejects.toThrow();

      expect(emit).not.toHaveBeenCalledWith('markets', expect.anything(), {
        live: true,
      });
      expect(controller.subscribeToPrices).not.toHaveBeenCalled();
    },
  );

  it('rejects an empty market response without reporting a ready preload', async () => {
    const { api, controller, bridge } = setup();
    controller.getMarketDataWithPrices.mockResolvedValue([]);

    await expect(api.perpsStartPreload('home')).rejects.toThrow('no markets');

    expect(bridge.canEmit('markets')).toBe(false);
    expect(controller.subscribeToPrices).not.toHaveBeenCalled();
  });
});
