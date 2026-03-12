import type { PerpsController } from '@metamask/perps-controller';
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
  isConnectionAlive?: () => boolean;
  emit?: jest.Mock;
};

function createBridge(overrides: BridgeOverrides = {}) {
  const emit = overrides.emit ?? jest.fn();
  const controller =
    overrides.controller ??
    (createMockController() as unknown as PerpsController);
  const controllerApi = overrides.controllerApi ?? createMockControllerApi();
  const isConnectionAlive = overrides.isConnectionAlive ?? (() => true);

  const bridge = new PerpsStreamBridge({
    controller,
    perpsInit: controllerApi.perpsInit,
    perpsDisconnect: controllerApi.perpsDisconnect,
    perpsToggleTestnet: controllerApi.perpsToggleTestnet,
    isConnectionAlive,
    emit,
  });

  return { bridge, emit, controller, controllerApi };
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

    it('tears down previous static subscriptions on re-activation after destroy', async () => {
      const controller = createMockController();
      const unsubs = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
      controller.subscribeToPositions.mockReturnValue(unsubs[0]);
      controller.subscribeToOrders.mockReturnValue(unsubs[1]);
      controller.subscribeToAccount.mockReturnValue(unsubs[2]);
      controller.subscribeToOrderFills.mockReturnValue(unsubs[3]);

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      const api = bridge.bridgeApi();

      await api.perpsInit();
      for (const unsub of unsubs) {
        expect(unsub).not.toHaveBeenCalled();
      }

      bridge.destroy();
      await api.perpsInit();

      for (const unsub of unsubs) {
        expect(unsub).toHaveBeenCalledTimes(1);
      }
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
        ) => Promise<string>
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
        }) => Promise<string>
      )({
        symbols: ['ETH', 'BTC'],
      });

      expect(controller.subscribeToPrices).toHaveBeenCalledWith({
        symbols: ['ETH', 'BTC'],
        callback: expect.any(Function),
      });
      const callback = controller.subscribeToPrices.mock.calls[0][0]
        .callback as (data: unknown) => void;
      callback({ price: '100' });
      expect(emit).toHaveBeenCalledWith('prices', { price: '100' });
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
        }) => Promise<string>
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
        }) => Promise<string>
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
        }) => Promise<string>
      )({
        symbol: 'ETH',
      });
      (api.perpsDeactivateOrderBookStream as () => void)();

      expect(unsub).toHaveBeenCalledTimes(1);
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
        ) => Promise<string>
      )({ symbol: 'ETH', interval: '1h', duration: '1d' });

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
        ) => Promise<string>
      )({ symbol: 'ETH', interval: '1h' });
      (api.perpsDeactivateCandleStream as () => void)();

      expect(unsub).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('tears down all static subscriptions', async () => {
      const controller = createMockController();
      const unsubs = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
      controller.subscribeToPositions.mockReturnValue(unsubs[0]);
      controller.subscribeToOrders.mockReturnValue(unsubs[1]);
      controller.subscribeToAccount.mockReturnValue(unsubs[2]);
      controller.subscribeToOrderFills.mockReturnValue(unsubs[3]);

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      await bridge.bridgeApi().perpsInit();
      bridge.destroy();

      for (const unsub of unsubs) {
        expect(unsub).toHaveBeenCalledTimes(1);
      }
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
        ) => Promise<string>
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
        ) => Promise<string>
      )({ priceSymbols: ['ETH'] });

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
        ) => Promise<string>
      )({ priceSymbols: ['ETH'] });

      expect(() => {
        bridge.destroy();
        bridge.destroy();
      }).not.toThrow();
    });
  });
});
