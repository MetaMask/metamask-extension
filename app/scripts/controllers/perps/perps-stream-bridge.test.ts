import type { PerpsController } from '@metamask/perps-controller';

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
  controller?: PerpsController;
  controllerApi?: ReturnType<typeof createMockControllerApi>;
  onControllerStateChange?: jest.Mock;
  onConnectivityChange?: jest.Mock;
  isConnectionAlive?: () => boolean;
  isTerminalBackendEnabled?: () => boolean;
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
    onControllerStateChange,
    onConnectivityChange,
    perpsInit: controllerApi.perpsInit,
    perpsDisconnect: controllerApi.perpsDisconnect,
    perpsToggleTestnet: controllerApi.perpsToggleTestnet,
    isConnectionAlive,
    isTerminalBackendEnabled,
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
      fillsCallback({ stub: 'fills' });

      expect(emit).toHaveBeenCalledWith('positions', { stub: 'positions' });
      expect(emit).toHaveBeenCalledWith('orders', { stub: 'orders' });
      expect(emit).toHaveBeenCalledWith('account', { stub: 'account' });
      expect(emit).toHaveBeenCalledWith('fills', { stub: 'fills' });
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

      await api.perpsInit();

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
      const unsubs = [jest.fn(), jest.fn(), jest.fn(), jest.fn(), jest.fn()];
      controller.subscribeToPositions.mockReturnValue(unsubs[0]);
      controller.subscribeToOrders.mockReturnValue(unsubs[1]);
      controller.subscribeToAccount.mockReturnValue(unsubs[2]);
      controller.subscribeToOrderFills.mockReturnValue(unsubs[3]);
      controller.subscribeToConnectionState.mockReturnValue(unsubs[4]);

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        onConnectivityChange,
      });
      const api = bridge.bridgeApi();

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
      expect(stateChangeUnsub).toHaveBeenCalledTimes(1);
      expect(connectivityUnsub).toHaveBeenCalledTimes(1);
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
      const controllerApi = createMockControllerApi();
      controllerApi.perpsInit.mockImplementation(
        () =>
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

      const pending = activate({ symbol: 'BTC', interval: '5m' });
      // Let the activation queue behind init, then tear the bridge down.
      await Promise.resolve();
      bridge.destroy();

      resolveInit?.();
      await pending;

      expect(controller.subscribeToCandles).not.toHaveBeenCalled();
    });

    it('coalesces concurrent activate calls for the same key across pending init', async () => {
      const controller = createMockController();
      let resolveInit: (() => void) | undefined;
      const controllerApi = createMockControllerApi();
      controllerApi.perpsInit.mockImplementation(
        () =>
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
    it('tears down all static subscriptions', async () => {
      const controller = createMockController();
      const stateChangeUnsub = jest.fn();
      const onControllerStateChange = jest
        .fn()
        .mockReturnValue(stateChangeUnsub);
      const connectivityUnsub = jest.fn();
      const onConnectivityChange = jest.fn().mockReturnValue(connectivityUnsub);
      const unsubs = [jest.fn(), jest.fn(), jest.fn(), jest.fn(), jest.fn()];
      controller.subscribeToPositions.mockReturnValue(unsubs[0]);
      controller.subscribeToOrders.mockReturnValue(unsubs[1]);
      controller.subscribeToAccount.mockReturnValue(unsubs[2]);
      controller.subscribeToOrderFills.mockReturnValue(unsubs[3]);
      controller.subscribeToConnectionState.mockReturnValue(unsubs[4]);

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        onControllerStateChange,
        onConnectivityChange,
      });
      await bridge.bridgeApi().perpsInit();
      bridge.destroy();

      for (const unsub of unsubs) {
        expect(unsub).toHaveBeenCalledTimes(1);
      }
      expect(stateChangeUnsub).toHaveBeenCalledTimes(1);
      expect(connectivityUnsub).toHaveBeenCalledTimes(1);
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

      expect(emit).toHaveBeenCalledWith('markets', mockMarkets);
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

      expect(emit).not.toHaveBeenCalledWith('markets', rawSnapshot);
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
      expect(emit).toHaveBeenCalledWith('markets', enrichedMarkets);
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
      expect(emit).toHaveBeenCalledWith('markets', [{ symbol: 'FINAL' }]);
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

      expect(emit).toHaveBeenCalledWith('markets', [{ symbol: 'ETH' }]);
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
      expect(emit).toHaveBeenNthCalledWith(1, 'markets', [{ symbol: 'ETH' }]);
      expect(emit).toHaveBeenNthCalledWith(2, 'markets', [
        { symbol: 'ETH' },
        { symbol: 'BTC' },
      ]);
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

      expect(emit).toHaveBeenCalledWith('markets', mockMarkets);
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

      expect(emit).toHaveBeenCalledWith('markets', mockMarkets);
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
