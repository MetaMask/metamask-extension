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

function createBridge(
  overrides: {
    controller?: PerpsController;
    controllerApi?: ReturnType<typeof createMockControllerApi>;
    isConnectionAlive?: () => boolean;
    emit?: jest.Mock;
  } = {},
) {
  const emit = overrides.emit ?? jest.fn();
  const controller =
    overrides.controller ??
    (createMockController() as unknown as PerpsController);
  const controllerApi = overrides.controllerApi ?? createMockControllerApi();
  const isConnectionAlive = overrides.isConnectionAlive ?? (() => true);

  const bridge = new PerpsStreamBridge({
    controller,
    controllerApi,
    isConnectionAlive,
    emit,
  });

  return { bridge, emit, controller, controllerApi, isConnectionAlive };
}

describe('PerpsStreamBridge', () => {
  describe('isActive', () => {
    it('returns false initially', () => {
      const { bridge } = createBridge();
      expect(bridge.isActive).toBe(false);
    });

    it('returns false when only activate() has been called', () => {
      const { bridge } = createBridge();
      bridge.activate();
      expect(bridge.isActive).toBe(false);
    });

    it('returns false when only setViewActive(true) has been called', () => {
      const { bridge } = createBridge();
      bridge.setViewActive(true);
      expect(bridge.isActive).toBe(false);
    });

    it('returns true when both activate() and setViewActive(true) have been called', () => {
      const { bridge } = createBridge();
      bridge.activate();
      bridge.setViewActive(true);
      expect(bridge.isActive).toBe(true);
    });

    it('returns false after setViewActive(false)', () => {
      const { bridge } = createBridge();
      bridge.activate();
      bridge.setViewActive(true);
      bridge.setViewActive(false);
      expect(bridge.isActive).toBe(false);
    });
  });

  describe('activate', () => {
    it('subscribes to positions, orders, account, and fills', () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activate();

      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToOrders).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToAccount).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToOrderFills).toHaveBeenCalledTimes(1);
    });

    it('passes callbacks that emit on the correct channels', () => {
      const controller = createMockController();
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      bridge.activate();

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

    it('tears down previous static subscriptions on re-activation', () => {
      const controller = createMockController();
      const unsubs = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
      controller.subscribeToPositions.mockReturnValue(unsubs[0]);
      controller.subscribeToOrders.mockReturnValue(unsubs[1]);
      controller.subscribeToAccount.mockReturnValue(unsubs[2]);
      controller.subscribeToOrderFills.mockReturnValue(unsubs[3]);

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activate();
      for (const unsub of unsubs) {
        expect(unsub).not.toHaveBeenCalled();
      }

      bridge.activate();
      for (const unsub of unsubs) {
        expect(unsub).toHaveBeenCalledTimes(1);
      }
    });

    it('swallows errors thrown by static unsub functions during teardown', () => {
      const controller = createMockController();
      controller.subscribeToPositions.mockReturnValue(() => {
        throw new Error('teardown failure');
      });
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activate();
      expect(() => bridge.activate()).not.toThrow();
    });

    it('resets #activated and tears down partial subs on subscribe throw so next activate() can retry', () => {
      const controller = createMockController();
      const unsubPositions = jest.fn();
      const unsubOrders = jest.fn();
      controller.subscribeToPositions.mockReturnValue(unsubPositions);
      controller.subscribeToOrders.mockReturnValue(unsubOrders);
      controller.subscribeToAccount.mockImplementation(() => {
        throw new Error('subscribeToAccount failed');
      });

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      expect(() => bridge.activate()).toThrow('subscribeToAccount failed');
      expect(bridge.isActivated).toBe(false);
      expect(unsubPositions).toHaveBeenCalledTimes(1);
      expect(unsubOrders).toHaveBeenCalledTimes(1);

      controller.subscribeToAccount.mockReturnValue(jest.fn());
      bridge.activate();
      expect(bridge.isActivated).toBe(true);
    });

    it('is a no-op when controller is undefined', () => {
      const bridge = new PerpsStreamBridge({
        controller: undefined as unknown as PerpsController,
        controllerApi: createMockControllerApi(),
        isConnectionAlive: () => true,
        emit: jest.fn(),
      });
      bridge.activate();
      expect(bridge.isActivated).toBe(false);
    });
  });

  describe('isActivated', () => {
    it('returns false initially', () => {
      const { bridge } = createBridge();
      expect(bridge.isActivated).toBe(false);
    });

    it('returns true after activate()', () => {
      const { bridge } = createBridge();
      bridge.activate();
      expect(bridge.isActivated).toBe(true);
    });

    it('returns false after destroy()', () => {
      const { bridge } = createBridge();
      bridge.activate();
      bridge.destroy();
      expect(bridge.isActivated).toBe(false);
    });
  });

  describe('setViewActive', () => {
    it('enables isActive when combined with activate()', () => {
      const { bridge } = createBridge();
      bridge.activate();

      bridge.setViewActive(true);
      expect(bridge.isActive).toBe(true);

      bridge.setViewActive(false);
      expect(bridge.isActive).toBe(false);
    });
  });

  describe('activateStreaming', () => {
    describe('prices', () => {
      it('subscribes to prices when priceSymbols are provided', () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({ priceSymbols: ['ETH', 'BTC'] });

        expect(controller.subscribeToPrices).toHaveBeenCalledWith({
          symbols: ['ETH', 'BTC'],
          callback: expect.any(Function),
        });
      });

      it('does not subscribe to prices when priceSymbols is empty', () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({ priceSymbols: [] });

        expect(controller.subscribeToPrices).not.toHaveBeenCalled();
      });

      it('does not subscribe to prices when priceSymbols is undefined', () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({});

        expect(controller.subscribeToPrices).not.toHaveBeenCalled();
      });

      it('emits price updates on the prices channel', () => {
        const controller = createMockController();
        const { bridge, emit } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({ priceSymbols: ['ETH'] });

        const callback = controller.subscribeToPrices.mock.calls[0][0]
          .callback as (data: unknown) => void;
        callback({ stub: 'price-update' });

        expect(emit).toHaveBeenCalledWith('prices', { stub: 'price-update' });
      });

      it('tears down previous prices subscription when called again', () => {
        const controller = createMockController();
        const unsub = jest.fn();
        controller.subscribeToPrices.mockReturnValue(unsub);
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({ priceSymbols: ['ETH'] });
        expect(unsub).not.toHaveBeenCalled();

        bridge.activateStreaming({ priceSymbols: ['BTC'] });
        expect(unsub).toHaveBeenCalledTimes(1);
      });
    });

    describe('orderBook', () => {
      it('subscribes to order book when orderBookSymbol is provided', () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({ orderBookSymbol: 'ETH' });

        expect(controller.subscribeToOrderBook).toHaveBeenCalledWith({
          symbol: 'ETH',
          callback: expect.any(Function),
        });
      });

      it('does not subscribe to order book when orderBookSymbol is undefined', () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({});

        expect(controller.subscribeToOrderBook).not.toHaveBeenCalled();
      });

      it('emits order book updates on the orderBook channel', () => {
        const controller = createMockController();
        const { bridge, emit } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({ orderBookSymbol: 'BTC' });

        const callback = controller.subscribeToOrderBook.mock.calls[0][0]
          .callback as (data: unknown) => void;
        callback({ stub: 'order-book' });

        expect(emit).toHaveBeenCalledWith('orderBook', { stub: 'order-book' });
      });

      it('tears down previous order book subscription when called again', () => {
        const controller = createMockController();
        const unsub = jest.fn();
        controller.subscribeToOrderBook.mockReturnValue(unsub);
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({ orderBookSymbol: 'ETH' });
        bridge.activateStreaming({ orderBookSymbol: 'BTC' });

        expect(unsub).toHaveBeenCalledTimes(1);
      });
    });

    describe('candles', () => {
      it('subscribes to candles when symbol and interval are provided', () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({
          candle: {
            symbol: 'ETH',
            interval: '1h' as never,
            duration: '1d' as never,
          },
        });

        expect(controller.subscribeToCandles).toHaveBeenCalledWith({
          symbol: 'ETH',
          interval: '1h',
          duration: '1d',
          callback: expect.any(Function),
        });
      });

      it('does not subscribe when candle symbol is missing', () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({
          candle: { symbol: '', interval: '1h' as never },
        });

        expect(controller.subscribeToCandles).not.toHaveBeenCalled();
      });

      it('does not subscribe when candle interval is missing', () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({
          candle: { symbol: 'ETH', interval: '' as never },
        });

        expect(controller.subscribeToCandles).not.toHaveBeenCalled();
      });

      it('emits candle updates with symbol and interval metadata', () => {
        const controller = createMockController();
        const { bridge, emit } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({
          candle: { symbol: 'ETH', interval: '15m' as never },
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

      it('replaces the previous candle subscription when navigating to a different market', () => {
        const controller = createMockController();
        const unsubETH1h = jest.fn();
        const unsubBTC1h = jest.fn();
        controller.subscribeToCandles
          .mockReturnValueOnce(unsubETH1h)
          .mockReturnValueOnce(unsubBTC1h);
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({
          candle: { symbol: 'ETH', interval: '1h' as never },
        });
        bridge.activateStreaming({
          candle: { symbol: 'BTC', interval: '1h' as never },
        });

        expect(unsubETH1h).toHaveBeenCalledTimes(1);
        expect(unsubBTC1h).not.toHaveBeenCalled();
      });
    });

    describe('combined params', () => {
      it('subscribes to all channels when all params are provided', () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({
          priceSymbols: ['ETH'],
          orderBookSymbol: 'ETH',
          candle: { symbol: 'ETH', interval: '5m' as never },
        });

        expect(controller.subscribeToPrices).toHaveBeenCalledTimes(1);
        expect(controller.subscribeToOrderBook).toHaveBeenCalledTimes(1);
        expect(controller.subscribeToCandles).toHaveBeenCalledTimes(1);
      });

      it('subscribes to none when params is empty', () => {
        const controller = createMockController();
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({});

        expect(controller.subscribeToPrices).not.toHaveBeenCalled();
        expect(controller.subscribeToOrderBook).not.toHaveBeenCalled();
        expect(controller.subscribeToCandles).not.toHaveBeenCalled();
      });

      it('tears down omitted channels when navigating to a simpler view', () => {
        const controller = createMockController();
        const orderBookUnsub = jest.fn();
        const candleUnsub = jest.fn();
        controller.subscribeToOrderBook.mockReturnValue(orderBookUnsub);
        controller.subscribeToCandles.mockReturnValue(candleUnsub);
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({
          priceSymbols: ['ETH'],
          orderBookSymbol: 'ETH',
          candle: { symbol: 'ETH', interval: '1h' as never },
        });

        expect(orderBookUnsub).not.toHaveBeenCalled();
        expect(candleUnsub).not.toHaveBeenCalled();

        bridge.activateStreaming({ priceSymbols: ['BTC'] });

        expect(orderBookUnsub).toHaveBeenCalledTimes(1);
        expect(candleUnsub).toHaveBeenCalledTimes(1);
      });

      it('tears down all dynamic subs when called with empty params', () => {
        const controller = createMockController();
        const priceUnsub = jest.fn();
        const orderBookUnsub = jest.fn();
        controller.subscribeToPrices.mockReturnValue(priceUnsub);
        controller.subscribeToOrderBook.mockReturnValue(orderBookUnsub);
        const { bridge } = createBridge({
          controller: controller as unknown as PerpsController,
        });

        bridge.activateStreaming({
          priceSymbols: ['ETH'],
          orderBookSymbol: 'ETH',
        });
        bridge.activateStreaming({});

        expect(priceUnsub).toHaveBeenCalledTimes(1);
        expect(orderBookUnsub).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('activatePriceStream / deactivatePriceStream', () => {
    it('subscribes to prices and emits on prices channel', () => {
      const controller = createMockController();
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activatePriceStream(['ETH', 'BTC']);

      expect(controller.subscribeToPrices).toHaveBeenCalledWith({
        symbols: ['ETH', 'BTC'],
        callback: expect.any(Function),
      });
      const callback = controller.subscribeToPrices.mock.calls[0][0]
        .callback as (data: unknown) => void;
      callback({ price: '100' });
      expect(emit).toHaveBeenCalledWith('prices', { price: '100' });
    });

    it('tears down previous price stream before registering new one', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToPrices.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activatePriceStream(['ETH']);
      bridge.activatePriceStream(['BTC']);

      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('does not subscribe when symbols is empty', () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activatePriceStream([]);

      expect(controller.subscribeToPrices).not.toHaveBeenCalled();
    });

    it('deactivatePriceStream tears down price subscription', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToPrices.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activatePriceStream(['ETH']);
      bridge.deactivatePriceStream();

      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('deactivatePriceStream is no-op when no price stream active', () => {
      const { bridge } = createBridge();
      expect(() => bridge.deactivatePriceStream()).not.toThrow();
    });
  });

  describe('activateOrderBookStream / deactivateOrderBookStream', () => {
    it('subscribes to order book and emits on orderBook channel', () => {
      const controller = createMockController();
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activateOrderBookStream('ETH');

      expect(controller.subscribeToOrderBook).toHaveBeenCalledWith({
        symbol: 'ETH',
        callback: expect.any(Function),
      });
      const callback = controller.subscribeToOrderBook.mock.calls[0][0]
        .callback as (data: unknown) => void;
      callback({ bids: [], asks: [] });
      expect(emit).toHaveBeenCalledWith('orderBook', { bids: [], asks: [] });
    });

    it('tears down previous order book stream before registering new one', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToOrderBook.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activateOrderBookStream('ETH');
      bridge.activateOrderBookStream('BTC');

      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('does not subscribe when symbol is empty', () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activateOrderBookStream('');

      expect(controller.subscribeToOrderBook).not.toHaveBeenCalled();
    });

    it('deactivateOrderBookStream tears down order book subscription', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToOrderBook.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activateOrderBookStream('ETH');
      bridge.deactivateOrderBookStream();

      expect(unsub).toHaveBeenCalledTimes(1);
    });
  });

  describe('activateCandleStream / deactivateCandleStream', () => {
    it('subscribes to candles with symbol, interval, and optional duration', () => {
      const controller = createMockController();
      const { bridge, emit } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activateCandleStream({
        symbol: 'ETH',
        interval: '1h' as never,
        duration: '1d' as never,
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

    it('tears down previous candle stream before registering new one', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activateCandleStream({ symbol: 'ETH', interval: '1h' as never });
      bridge.activateCandleStream({ symbol: 'BTC', interval: '1h' as never });

      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('does not subscribe when symbol or interval is missing', () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activateCandleStream({ symbol: '', interval: '1h' as never });
      expect(controller.subscribeToCandles).not.toHaveBeenCalled();

      bridge.activateCandleStream({ symbol: 'ETH', interval: '' as never });
      expect(controller.subscribeToCandles).not.toHaveBeenCalled();
    });

    it('deactivateCandleStream tears down candle subscription', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activateCandleStream({ symbol: 'ETH', interval: '1h' as never });
      bridge.deactivateCandleStream();

      expect(unsub).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('tears down all static subscriptions', () => {
      const controller = createMockController();
      const unsubs = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
      controller.subscribeToPositions.mockReturnValue(unsubs[0]);
      controller.subscribeToOrders.mockReturnValue(unsubs[1]);
      controller.subscribeToAccount.mockReturnValue(unsubs[2]);
      controller.subscribeToOrderFills.mockReturnValue(unsubs[3]);

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      bridge.activate();
      bridge.destroy();

      for (const unsub of unsubs) {
        expect(unsub).toHaveBeenCalledTimes(1);
      }
    });

    it('tears down all dynamic subscriptions', () => {
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
      bridge.activateStreaming({
        priceSymbols: ['ETH'],
        orderBookSymbol: 'BTC',
        candle: { symbol: 'ETH', interval: '1h' as never },
      });
      bridge.destroy();

      expect(priceUnsub).toHaveBeenCalledTimes(1);
      expect(orderBookUnsub).toHaveBeenCalledTimes(1);
      expect(candleUnsub).toHaveBeenCalledTimes(1);
    });

    it('tears down both static and dynamic subscriptions', () => {
      const controller = createMockController();
      const staticUnsub = jest.fn();
      const dynamicUnsub = jest.fn();
      controller.subscribeToPositions.mockReturnValue(staticUnsub);
      controller.subscribeToPrices.mockReturnValue(dynamicUnsub);

      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      bridge.activate();
      bridge.activateStreaming({ priceSymbols: ['ETH'] });
      bridge.destroy();

      expect(staticUnsub).toHaveBeenCalledTimes(1);
      expect(dynamicUnsub).toHaveBeenCalledTimes(1);
    });

    it('swallows errors thrown by unsub functions', () => {
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
      bridge.activate();
      bridge.activateStreaming({ priceSymbols: ['ETH'] });

      expect(() => bridge.destroy()).not.toThrow();
    });

    it('does not throw when called with no active subscriptions', () => {
      const { bridge } = createBridge();
      expect(() => bridge.destroy()).not.toThrow();
    });

    it('resets isActive to false after destruction', () => {
      const { bridge } = createBridge();
      bridge.activate();
      bridge.setViewActive(true);
      expect(bridge.isActive).toBe(true);

      bridge.destroy();
      expect(bridge.isActive).toBe(false);
    });

    it('resets viewActive so re-activation requires explicit setViewActive(true)', () => {
      const { bridge } = createBridge();
      bridge.activate();
      bridge.setViewActive(true);
      expect(bridge.isActive).toBe(true);

      bridge.destroy();
      bridge.activate();
      expect(bridge.isActive).toBe(false);

      bridge.setViewActive(true);
      expect(bridge.isActive).toBe(true);
    });

    it('does not double-call static unsubs when activate() is called after destroy()', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToPositions.mockReturnValue(unsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activate();
      bridge.destroy();
      expect(unsub).toHaveBeenCalledTimes(1);

      bridge.activate();
      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('does not double-call dynamic unsubs when activateStreaming() is called after destroy()', () => {
      const controller = createMockController();
      const priceUnsub = jest.fn();
      controller.subscribeToPrices.mockReturnValue(priceUnsub);
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });

      bridge.activateStreaming({ priceSymbols: ['ETH'] });
      bridge.destroy();
      expect(priceUnsub).toHaveBeenCalledTimes(1);

      bridge.activateStreaming({ priceSymbols: ['BTC'] });
      expect(priceUnsub).toHaveBeenCalledTimes(1);
    });

    it('does not throw when called twice (idempotent)', () => {
      const controller = createMockController();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
      });
      bridge.activate();
      bridge.activateStreaming({ priceSymbols: ['ETH'] });

      expect(() => {
        bridge.destroy();
        bridge.destroy();
      }).not.toThrow();
    });
  });

  describe('bridgeApi', () => {
    it('perpsInit delegates to controllerApi and activates on first call', async () => {
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
      expect(bridge.isActivated).toBe(true);
    });

    it('perpsInit skips activation when already activated', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      await api.perpsInit();
      await api.perpsInit();

      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
    });

    it('perpsInit skips activation when connection is dead', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
        isConnectionAlive: () => false,
      });
      const api = bridge.bridgeApi();

      await api.perpsInit();

      expect(bridge.isActivated).toBe(false);
    });

    it('perpsDisconnect destroys and delegates', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      controllerApi.perpsDisconnect.mockResolvedValue('disconnect-result');
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      bridge.activate();
      bridge.setViewActive(true);
      expect(bridge.isActive).toBe(true);

      const result = await api.perpsDisconnect();

      expect(result).toBe('disconnect-result');
      expect(bridge.isActive).toBe(false);
    });

    it('perpsToggleTestnet destroys and delegates', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      controllerApi.perpsToggleTestnet.mockResolvedValue('toggle-result');
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      bridge.activate();
      const result = await api.perpsToggleTestnet();

      expect(result).toBe('toggle-result');
      expect(bridge.isActivated).toBe(false);
    });

    it('perpsViewActive delegates to setViewActive', () => {
      const { bridge } = createBridge();
      bridge.activate();
      const api = bridge.bridgeApi();

      (api.perpsViewActive as (active: boolean) => void)(true);
      expect(bridge.isActive).toBe(true);

      (api.perpsViewActive as (active: boolean) => void)(false);
      expect(bridge.isActive).toBe(false);
    });

    it('perpsActivateStreaming calls perpsInit then activates streaming', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      const result = await (
        api.perpsActivateStreaming as (
          params: Record<string, unknown>,
        ) => Promise<string>
      )({ priceSymbols: ['ETH'] });

      expect(controllerApi.perpsInit).toHaveBeenCalled();
      expect(controller.subscribeToPrices).toHaveBeenCalled();
      expect(result).toBe('ok');
    });

    it('perpsActivatePriceStream calls perpsInit then activates prices', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivatePriceStream as (
          params: Record<string, unknown>,
        ) => Promise<string>
      )({ symbols: ['ETH'] });

      expect(controllerApi.perpsInit).toHaveBeenCalled();
      expect(controller.subscribeToPrices).toHaveBeenCalled();
    });

    it('perpsActivateOrderBookStream calls perpsInit then activates order book', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateOrderBookStream as (
          params: Record<string, unknown>,
        ) => Promise<string>
      )({ symbol: 'ETH' });

      expect(controllerApi.perpsInit).toHaveBeenCalled();
      expect(controller.subscribeToOrderBook).toHaveBeenCalled();
    });

    it('perpsActivateCandleStream calls perpsInit then activates candles', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateCandleStream as (
          params: Record<string, unknown>,
        ) => Promise<string>
      )({ symbol: 'ETH', interval: '1h' });

      expect(controllerApi.perpsInit).toHaveBeenCalled();
      expect(controller.subscribeToCandles).toHaveBeenCalled();
    });

    it('streaming methods activate static subscriptions when called first', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      expect(bridge.isActivated).toBe(false);

      await (
        api.perpsActivateStreaming as (
          params: Record<string, unknown>,
        ) => Promise<string>
      )({ priceSymbols: ['ETH'] });

      expect(bridge.isActivated).toBe(true);
      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToOrders).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToAccount).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToOrderFills).toHaveBeenCalledTimes(1);
    });

    it('streaming methods do not re-activate if already activated', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
      });
      const api = bridge.bridgeApi();

      await api.perpsInit();
      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);

      await (
        api.perpsActivatePriceStream as (
          params: Record<string, unknown>,
        ) => Promise<string>
      )({ symbols: ['ETH'] });

      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
    });

    it('streaming api overrides skip activation when connection is dead', async () => {
      const controller = createMockController();
      const controllerApi = createMockControllerApi();
      const { bridge } = createBridge({
        controller: controller as unknown as PerpsController,
        controllerApi,
        isConnectionAlive: () => false,
      });
      const api = bridge.bridgeApi();

      await (
        api.perpsActivateStreaming as (
          params: Record<string, unknown>,
        ) => Promise<string>
      )({ priceSymbols: ['ETH'] });

      expect(controller.subscribeToPrices).not.toHaveBeenCalled();
    });
  });
});
