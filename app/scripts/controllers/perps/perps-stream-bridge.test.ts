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

describe('PerpsStreamBridge', () => {
  let emit: jest.Mock;
  let bridge: PerpsStreamBridge;

  beforeEach(() => {
    emit = jest.fn();
    bridge = new PerpsStreamBridge(emit);
  });

  describe('isActive', () => {
    it('returns false initially', () => {
      expect(bridge.isActive).toBe(false);
    });

    it('returns false when only activate() has been called', () => {
      const controller = createMockController();
      bridge.activate(controller as unknown as PerpsController);

      expect(bridge.isActive).toBe(false);
    });

    it('returns false when only setViewActive(true) has been called', () => {
      bridge.setViewActive(true);

      expect(bridge.isActive).toBe(false);
    });

    it('returns true when both activate() and setViewActive(true) have been called', () => {
      const controller = createMockController();
      bridge.activate(controller as unknown as PerpsController);
      bridge.setViewActive(true);

      expect(bridge.isActive).toBe(true);
    });

    it('returns false after setViewActive(false)', () => {
      const controller = createMockController();
      bridge.activate(controller as unknown as PerpsController);
      bridge.setViewActive(true);
      bridge.setViewActive(false);

      expect(bridge.isActive).toBe(false);
    });
  });

  describe('activate', () => {
    it('subscribes to positions, orders, account, and fills', () => {
      const controller = createMockController();

      bridge.activate(controller as unknown as PerpsController);

      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToOrders).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToAccount).toHaveBeenCalledTimes(1);
      expect(controller.subscribeToOrderFills).toHaveBeenCalledTimes(1);
    });

    it('passes callbacks that emit on the correct channels', () => {
      const controller = createMockController();
      bridge.activate(controller as unknown as PerpsController);

      const positionsCallback = controller.subscribeToPositions.mock.calls[0][0]
        .callback as (data: unknown) => void;
      const ordersCallback = controller.subscribeToOrders.mock.calls[0][0]
        .callback as (data: unknown) => void;
      const accountCallback = controller.subscribeToAccount.mock.calls[0][0]
        .callback as (data: unknown) => void;
      const fillsCallback = controller.subscribeToOrderFills.mock.calls[0][0]
        .callback as (data: unknown) => void;

      const positionsData = { stub: 'positions' };
      const ordersData = { stub: 'orders' };
      const accountData = { stub: 'account' };
      const fillsData = { stub: 'fills' };

      positionsCallback(positionsData);
      ordersCallback(ordersData);
      accountCallback(accountData);
      fillsCallback(fillsData);

      expect(emit).toHaveBeenCalledWith('positions', positionsData);
      expect(emit).toHaveBeenCalledWith('orders', ordersData);
      expect(emit).toHaveBeenCalledWith('account', accountData);
      expect(emit).toHaveBeenCalledWith('fills', fillsData);
    });

    it('tears down previous static subscriptions on re-activation', () => {
      const controller1 = createMockController();
      const unsub1 = jest.fn();
      const unsub2 = jest.fn();
      const unsub3 = jest.fn();
      const unsub4 = jest.fn();
      controller1.subscribeToPositions.mockReturnValue(unsub1);
      controller1.subscribeToOrders.mockReturnValue(unsub2);
      controller1.subscribeToAccount.mockReturnValue(unsub3);
      controller1.subscribeToOrderFills.mockReturnValue(unsub4);

      bridge.activate(controller1 as unknown as PerpsController);

      expect(unsub1).not.toHaveBeenCalled();
      expect(unsub2).not.toHaveBeenCalled();
      expect(unsub3).not.toHaveBeenCalled();
      expect(unsub4).not.toHaveBeenCalled();

      const controller2 = createMockController();
      bridge.activate(controller2 as unknown as PerpsController);

      expect(unsub1).toHaveBeenCalledTimes(1);
      expect(unsub2).toHaveBeenCalledTimes(1);
      expect(unsub3).toHaveBeenCalledTimes(1);
      expect(unsub4).toHaveBeenCalledTimes(1);
    });

    it('re-subscribes with the new controller on re-activation', () => {
      const controller1 = createMockController();
      bridge.activate(controller1 as unknown as PerpsController);

      const controller2 = createMockController();
      bridge.activate(controller2 as unknown as PerpsController);

      expect(controller2.subscribeToPositions).toHaveBeenCalledTimes(1);
      expect(controller2.subscribeToOrders).toHaveBeenCalledTimes(1);
      expect(controller2.subscribeToAccount).toHaveBeenCalledTimes(1);
      expect(controller2.subscribeToOrderFills).toHaveBeenCalledTimes(1);
    });

    it('swallows errors thrown by static unsub functions during teardown', () => {
      const controller1 = createMockController();
      controller1.subscribeToPositions.mockReturnValue(() => {
        throw new Error('teardown failure');
      });
      bridge.activate(controller1 as unknown as PerpsController);

      const controller2 = createMockController();
      expect(() =>
        bridge.activate(controller2 as unknown as PerpsController),
      ).not.toThrow();
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

      expect(() =>
        bridge.activate(controller as unknown as PerpsController),
      ).toThrow('subscribeToAccount failed');

      expect(bridge.isActivated).toBe(false);
      expect(unsubPositions).toHaveBeenCalledTimes(1);
      expect(unsubOrders).toHaveBeenCalledTimes(1);

      controller.subscribeToAccount.mockReturnValue(jest.fn());
      bridge.activate(controller as unknown as PerpsController);

      expect(bridge.isActivated).toBe(true);
      expect(controller.subscribeToPositions).toHaveBeenCalledTimes(2);
      expect(controller.subscribeToAccount).toHaveBeenCalledTimes(2);
    });
  });

  describe('isActivated', () => {
    it('returns false initially', () => {
      expect(bridge.isActivated).toBe(false);
    });

    it('returns true after activate()', () => {
      const controller = createMockController();
      bridge.activate(controller as unknown as PerpsController);
      expect(bridge.isActivated).toBe(true);
    });

    it('returns false after destroy()', () => {
      const controller = createMockController();
      bridge.activate(controller as unknown as PerpsController);
      bridge.destroy();
      expect(bridge.isActivated).toBe(false);
    });
  });

  describe('setViewActive', () => {
    it('enables isActive when combined with activate()', () => {
      const controller = createMockController();
      bridge.activate(controller as unknown as PerpsController);

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

        bridge.activateStreaming(controller as unknown as PerpsController, {
          priceSymbols: ['ETH', 'BTC'],
        });

        expect(controller.subscribeToPrices).toHaveBeenCalledWith({
          symbols: ['ETH', 'BTC'],
          callback: expect.any(Function),
        });
      });

      it('does not subscribe to prices when priceSymbols is empty', () => {
        const controller = createMockController();

        bridge.activateStreaming(controller as unknown as PerpsController, {
          priceSymbols: [],
        });

        expect(controller.subscribeToPrices).not.toHaveBeenCalled();
      });

      it('does not subscribe to prices when priceSymbols is undefined', () => {
        const controller = createMockController();

        bridge.activateStreaming(controller as unknown as PerpsController, {});

        expect(controller.subscribeToPrices).not.toHaveBeenCalled();
      });

      it('emits price updates on the prices channel', () => {
        const controller = createMockController();

        bridge.activateStreaming(controller as unknown as PerpsController, {
          priceSymbols: ['ETH'],
        });

        const callback = controller.subscribeToPrices.mock.calls[0][0]
          .callback as (data: unknown) => void;
        const priceData = { stub: 'price-update' };
        callback(priceData);

        expect(emit).toHaveBeenCalledWith('prices', priceData);
      });

      it('tears down previous prices subscription when called again', () => {
        const controller = createMockController();
        const unsub = jest.fn();
        controller.subscribeToPrices.mockReturnValue(unsub);

        bridge.activateStreaming(controller as unknown as PerpsController, {
          priceSymbols: ['ETH'],
        });
        expect(unsub).not.toHaveBeenCalled();

        bridge.activateStreaming(controller as unknown as PerpsController, {
          priceSymbols: ['BTC'],
        });
        expect(unsub).toHaveBeenCalledTimes(1);
      });
    });

    describe('orderBook', () => {
      it('subscribes to order book when orderBookSymbol is provided', () => {
        const controller = createMockController();

        bridge.activateStreaming(controller as unknown as PerpsController, {
          orderBookSymbol: 'ETH',
        });

        expect(controller.subscribeToOrderBook).toHaveBeenCalledWith({
          symbol: 'ETH',
          callback: expect.any(Function),
        });
      });

      it('does not subscribe to order book when orderBookSymbol is undefined', () => {
        const controller = createMockController();

        bridge.activateStreaming(controller as unknown as PerpsController, {});

        expect(controller.subscribeToOrderBook).not.toHaveBeenCalled();
      });

      it('emits order book updates on the orderBook channel', () => {
        const controller = createMockController();

        bridge.activateStreaming(controller as unknown as PerpsController, {
          orderBookSymbol: 'BTC',
        });

        const callback = controller.subscribeToOrderBook.mock.calls[0][0]
          .callback as (data: unknown) => void;
        const bookData = { stub: 'order-book' };
        callback(bookData);

        expect(emit).toHaveBeenCalledWith('orderBook', bookData);
      });

      it('tears down previous order book subscription when called again', () => {
        const controller = createMockController();
        const unsub = jest.fn();
        controller.subscribeToOrderBook.mockReturnValue(unsub);

        bridge.activateStreaming(controller as unknown as PerpsController, {
          orderBookSymbol: 'ETH',
        });
        bridge.activateStreaming(controller as unknown as PerpsController, {
          orderBookSymbol: 'BTC',
        });

        expect(unsub).toHaveBeenCalledTimes(1);
      });
    });

    describe('candles', () => {
      it('subscribes to candles when symbol and interval are provided', () => {
        const controller = createMockController();

        bridge.activateStreaming(controller as unknown as PerpsController, {
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

        bridge.activateStreaming(controller as unknown as PerpsController, {
          candle: { symbol: '', interval: '1h' as never },
        });

        expect(controller.subscribeToCandles).not.toHaveBeenCalled();
      });

      it('does not subscribe when candle interval is missing', () => {
        const controller = createMockController();

        bridge.activateStreaming(controller as unknown as PerpsController, {
          candle: { symbol: 'ETH', interval: '' as never },
        });

        expect(controller.subscribeToCandles).not.toHaveBeenCalled();
      });

      it('emits candle updates with symbol and interval metadata', () => {
        const controller = createMockController();

        bridge.activateStreaming(controller as unknown as PerpsController, {
          candle: { symbol: 'ETH', interval: '15m' as never },
        });

        const callback = controller.subscribeToCandles.mock.calls[0][0]
          .callback as (data: unknown) => void;
        const candleData = { stub: 'candle-update' };
        callback(candleData);

        expect(emit).toHaveBeenCalledWith('candles', candleData, {
          symbol: 'ETH',
          interval: '15m',
        });
      });

      it('replaces the previous candle subscription when navigating to a different market', () => {
        const controller = createMockController();
        const unsubETH1h = jest.fn();
        const unsubBTC1h = jest.fn();
        controller.subscribeToCandles
          .mockReturnValueOnce(unsubETH1h)
          .mockReturnValueOnce(unsubBTC1h);

        bridge.activateStreaming(controller as unknown as PerpsController, {
          candle: { symbol: 'ETH', interval: '1h' as never },
        });
        bridge.activateStreaming(controller as unknown as PerpsController, {
          candle: { symbol: 'BTC', interval: '1h' as never },
        });

        expect(unsubETH1h).toHaveBeenCalledTimes(1);
        expect(unsubBTC1h).not.toHaveBeenCalled();
      });

      it('replaces the previous candle subscription when switching to a different interval', () => {
        const controller = createMockController();
        const unsub1h = jest.fn();
        controller.subscribeToCandles.mockReturnValueOnce(unsub1h);

        bridge.activateStreaming(controller as unknown as PerpsController, {
          candle: { symbol: 'ETH', interval: '1h' as never },
        });
        bridge.activateStreaming(controller as unknown as PerpsController, {
          candle: { symbol: 'ETH', interval: '4h' as never },
        });

        expect(unsub1h).toHaveBeenCalledTimes(1);
      });

      it('replaces subscription for the same symbol+interval pair', () => {
        const controller = createMockController();
        const firstUnsub = jest.fn();
        controller.subscribeToCandles.mockReturnValueOnce(firstUnsub);

        bridge.activateStreaming(controller as unknown as PerpsController, {
          candle: { symbol: 'ETH', interval: '1h' as never },
        });
        bridge.activateStreaming(controller as unknown as PerpsController, {
          candle: { symbol: 'ETH', interval: '1h' as never },
        });

        expect(firstUnsub).toHaveBeenCalledTimes(1);
      });
    });

    describe('combined params', () => {
      it('subscribes to all channels when all params are provided', () => {
        const controller = createMockController();

        bridge.activateStreaming(controller as unknown as PerpsController, {
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

        bridge.activateStreaming(controller as unknown as PerpsController, {});

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

        bridge.activateStreaming(controller as unknown as PerpsController, {
          priceSymbols: ['ETH'],
          orderBookSymbol: 'ETH',
          candle: { symbol: 'ETH', interval: '1h' as never },
        });

        expect(orderBookUnsub).not.toHaveBeenCalled();
        expect(candleUnsub).not.toHaveBeenCalled();

        bridge.activateStreaming(controller as unknown as PerpsController, {
          priceSymbols: ['BTC'],
        });

        expect(orderBookUnsub).toHaveBeenCalledTimes(1);
        expect(candleUnsub).toHaveBeenCalledTimes(1);
      });

      it('tears down all dynamic subs when called with empty params', () => {
        const controller = createMockController();
        const priceUnsub = jest.fn();
        const orderBookUnsub = jest.fn();
        controller.subscribeToPrices.mockReturnValue(priceUnsub);
        controller.subscribeToOrderBook.mockReturnValue(orderBookUnsub);

        bridge.activateStreaming(controller as unknown as PerpsController, {
          priceSymbols: ['ETH'],
          orderBookSymbol: 'ETH',
        });

        bridge.activateStreaming(controller as unknown as PerpsController, {});

        expect(priceUnsub).toHaveBeenCalledTimes(1);
        expect(orderBookUnsub).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('activatePriceStream / deactivatePriceStream', () => {
    it('subscribes to prices and emits on prices channel', () => {
      const controller = createMockController();

      bridge.activatePriceStream(controller as unknown as PerpsController, [
        'ETH',
        'BTC',
      ]);

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

      bridge.activatePriceStream(controller as unknown as PerpsController, [
        'ETH',
      ]);
      bridge.activatePriceStream(controller as unknown as PerpsController, [
        'BTC',
      ]);

      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('does not subscribe when symbols is empty', () => {
      const controller = createMockController();

      bridge.activatePriceStream(controller as unknown as PerpsController, []);

      expect(controller.subscribeToPrices).not.toHaveBeenCalled();
    });

    it('deactivatePriceStream tears down price subscription', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToPrices.mockReturnValue(unsub);

      bridge.activatePriceStream(controller as unknown as PerpsController, [
        'ETH',
      ]);
      bridge.deactivatePriceStream();

      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('deactivatePriceStream is no-op when no price stream active', () => {
      expect(() => bridge.deactivatePriceStream()).not.toThrow();
    });
  });

  describe('activateOrderBookStream / deactivateOrderBookStream', () => {
    it('subscribes to order book and emits on orderBook channel', () => {
      const controller = createMockController();

      bridge.activateOrderBookStream(
        controller as unknown as PerpsController,
        'ETH',
      );

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

      bridge.activateOrderBookStream(
        controller as unknown as PerpsController,
        'ETH',
      );
      bridge.activateOrderBookStream(
        controller as unknown as PerpsController,
        'BTC',
      );

      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('does not subscribe when symbol is empty', () => {
      const controller = createMockController();

      bridge.activateOrderBookStream(
        controller as unknown as PerpsController,
        '',
      );

      expect(controller.subscribeToOrderBook).not.toHaveBeenCalled();
    });

    it('deactivateOrderBookStream tears down order book subscription', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToOrderBook.mockReturnValue(unsub);

      bridge.activateOrderBookStream(
        controller as unknown as PerpsController,
        'ETH',
      );
      bridge.deactivateOrderBookStream();

      expect(unsub).toHaveBeenCalledTimes(1);
    });
  });

  describe('activateCandleStream / deactivateCandleStream', () => {
    it('subscribes to candles with symbol, interval, and optional duration', () => {
      const controller = createMockController();

      bridge.activateCandleStream(controller as unknown as PerpsController, {
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
        {
          symbol: 'ETH',
          interval: '1h',
        },
      );
    });

    it('tears down previous candle stream before registering new one', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);

      bridge.activateCandleStream(controller as unknown as PerpsController, {
        symbol: 'ETH',
        interval: '1h' as never,
      });
      bridge.activateCandleStream(controller as unknown as PerpsController, {
        symbol: 'BTC',
        interval: '1h' as never,
      });

      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('does not subscribe when symbol or interval is missing', () => {
      const controller = createMockController();

      bridge.activateCandleStream(controller as unknown as PerpsController, {
        symbol: '',
        interval: '1h' as never,
      });
      expect(controller.subscribeToCandles).not.toHaveBeenCalled();

      bridge.activateCandleStream(controller as unknown as PerpsController, {
        symbol: 'ETH',
        interval: '' as never,
      });
      expect(controller.subscribeToCandles).not.toHaveBeenCalled();
    });

    it('deactivateCandleStream tears down candle subscription', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToCandles.mockReturnValue(unsub);

      bridge.activateCandleStream(controller as unknown as PerpsController, {
        symbol: 'ETH',
        interval: '1h' as never,
      });
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

      bridge.activate(controller as unknown as PerpsController);
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

      bridge.activateStreaming(controller as unknown as PerpsController, {
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

      bridge.activate(controller as unknown as PerpsController);
      bridge.activateStreaming(controller as unknown as PerpsController, {
        priceSymbols: ['ETH'],
      });
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

      bridge.activate(controller as unknown as PerpsController);
      bridge.activateStreaming(controller as unknown as PerpsController, {
        priceSymbols: ['ETH'],
      });

      expect(() => bridge.destroy()).not.toThrow();
    });

    it('does not throw when called with no active subscriptions', () => {
      expect(() => bridge.destroy()).not.toThrow();
    });

    it('resets isActive to false after destruction', () => {
      const controller = createMockController();
      bridge.activate(controller as unknown as PerpsController);
      bridge.setViewActive(true);
      expect(bridge.isActive).toBe(true);

      bridge.destroy();
      expect(bridge.isActive).toBe(false);
    });

    it('resets viewActive so re-activation requires explicit setViewActive(true)', () => {
      const controller = createMockController();
      bridge.activate(controller as unknown as PerpsController);
      bridge.setViewActive(true);
      expect(bridge.isActive).toBe(true);

      bridge.destroy();

      bridge.activate(controller as unknown as PerpsController);
      expect(bridge.isActive).toBe(false);

      bridge.setViewActive(true);
      expect(bridge.isActive).toBe(true);
    });

    it('does not double-call static unsubs when activate() is called after destroy()', () => {
      const controller = createMockController();
      const unsub = jest.fn();
      controller.subscribeToPositions.mockReturnValue(unsub);

      bridge.activate(controller as unknown as PerpsController);
      bridge.destroy();
      expect(unsub).toHaveBeenCalledTimes(1);

      const controller2 = createMockController();
      bridge.activate(controller2 as unknown as PerpsController);
      expect(unsub).toHaveBeenCalledTimes(1);
    });

    it('does not double-call dynamic unsubs when activateStreaming() is called after destroy()', () => {
      const controller = createMockController();
      const priceUnsub = jest.fn();
      controller.subscribeToPrices.mockReturnValue(priceUnsub);

      bridge.activateStreaming(controller as unknown as PerpsController, {
        priceSymbols: ['ETH'],
      });
      bridge.destroy();
      expect(priceUnsub).toHaveBeenCalledTimes(1);

      const controller2 = createMockController();
      bridge.activateStreaming(controller2 as unknown as PerpsController, {
        priceSymbols: ['BTC'],
      });
      expect(priceUnsub).toHaveBeenCalledTimes(1);
    });

    it('does not throw when called twice (idempotent)', () => {
      const controller = createMockController();
      bridge.activate(controller as unknown as PerpsController);
      bridge.activateStreaming(controller as unknown as PerpsController, {
        priceSymbols: ['ETH'],
      });

      expect(() => {
        bridge.destroy();
        bridge.destroy();
      }).not.toThrow();
    });
  });
});
