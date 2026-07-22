// eslint-disable-next-line import-x/first
import * as hl from '@nktkas/hyperliquid';
import {
  AggregatedOrderBookConnection,
  processAggregatedOrderBook,
} from './aggregated-order-book-connection';

type MockTransport = {
  options: { isTestnet: boolean };
  close: jest.Mock;
  socket: EventTarget;
  subscribe: jest.Mock;
};
/** Invokes the connection's listener with the raw snapshot (wrapped as `detail`). */
type L2Emit = (data: unknown) => void;

type MockState = {
  transports: MockTransport[];
  listeners: { channel: string; params: unknown; listener: L2Emit }[];
  unsubscribe: jest.Mock;
  resolveSubscribe: boolean;
  rejectSubscribe: boolean;
};

jest.mock('@nktkas/hyperliquid', () => {
  const state: MockState = {
    transports: [],
    listeners: [],
    unsubscribe: jest.fn().mockResolvedValue(undefined),
    resolveSubscribe: true,
    rejectSubscribe: false,
  };

  class WebSocketTransport {
    options: { isTestnet: boolean };

    close = jest.fn().mockResolvedValue(undefined);

    socket = new EventTarget();

    subscribe = jest.fn(
      (
        channel: string,
        params: unknown,
        listener: (event: { detail: unknown }) => void,
      ) => {
        // Store an emitter that mirrors the SDK's CustomEvent delivery so tests
        // can push a raw snapshot via `listeners[i].listener(rawData)`.
        state.listeners.push({
          channel,
          params,
          listener: (detail: unknown) => listener({ detail }),
        });
        if (state.rejectSubscribe) {
          return Promise.reject(new Error('subscribe failed'));
        }
        return state.resolveSubscribe
          ? Promise.resolve({ unsubscribe: state.unsubscribe })
          : new Promise(() => undefined);
      },
    );

    constructor(options: { isTestnet: boolean }) {
      this.options = options;
      state.transports.push(this as unknown as MockTransport);
    }
  }

  return { WebSocketTransport, mockState: state };
});

// eslint-disable-next-line import-x/first, import-x/no-namespace

const { mockState } = hl as unknown as { mockState: MockState };

const flush = async () => {
  // Drain a few microtasks so both the resolve (.then) and reject (.then skip
  // → .catch) branches of the subscribe promise chain settle.
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

const l2Level = (px: string, sz: string, n = 1) => ({ px, sz, n });

beforeEach(() => {
  mockState.transports.length = 0;
  mockState.listeners.length = 0;
  mockState.unsubscribe.mockClear();
  mockState.resolveSubscribe = true;
  mockState.rejectSubscribe = false;
});

describe('processAggregatedOrderBook', () => {
  it('builds cumulative totals, spread, and mid price from an l2Book snapshot', () => {
    const result = processAggregatedOrderBook(
      {
        coin: 'BTC',
        time: 1,
        levels: [
          [l2Level('64000', '2'), l2Level('63000', '1')],
          [l2Level('65000', '1'), l2Level('66000', '3')],
        ],
      },
      10,
    );

    expect(result.bids).toStrictEqual([
      {
        price: '64000',
        size: '2',
        total: '2',
        notional: '128000.00',
        totalNotional: '128000.00',
      },
      {
        price: '63000',
        size: '1',
        total: '3',
        notional: '63000.00',
        totalNotional: '191000.00',
      },
    ]);
    expect(result.asks[0]).toStrictEqual({
      price: '65000',
      size: '1',
      total: '1',
      notional: '65000.00',
      totalNotional: '65000.00',
    });
    // spread = 65000 - 64000, mid = (65000 + 64000) / 2
    expect(result.spread).toBe('1000.00000');
    expect(result.midPrice).toBe('64500.00000');
    expect(result.maxTotal).toBe('4');
  });

  it('trims each side to the requested level count', () => {
    const result = processAggregatedOrderBook(
      {
        coin: 'BTC',
        time: 1,
        levels: [
          [l2Level('3', '1'), l2Level('2', '1'), l2Level('1', '1')],
          [l2Level('4', '1'), l2Level('5', '1'), l2Level('6', '1')],
        ],
      },
      2,
    );

    expect(result.bids).toHaveLength(2);
    expect(result.asks).toHaveLength(2);
  });

  it('reports a zero spread when a side is empty', () => {
    const result = processAggregatedOrderBook(
      { coin: 'BTC', time: 1, levels: [[], []] },
      10,
    );
    expect(result.spread).toBe('0.00000');
    expect(result.spreadPercentage).toBe('0');
    expect(result.midPrice).toBe('0.00000');
  });
});

describe('AggregatedOrderBookConnection', () => {
  it('creates a mainnet transport and subscribes with the requested params', async () => {
    const connection = new AggregatedOrderBookConnection({
      isTestnet: () => false,
    });
    const callback = jest.fn();

    connection.subscribe({
      symbol: 'BTC',
      levels: 20,
      nSigFigs: 2,
      callback,
    });

    expect(mockState.transports).toHaveLength(1);
    expect(mockState.transports[0].options).toStrictEqual({ isTestnet: false });
    expect(mockState.listeners[0].channel).toBe('l2Book');
    // Runs in fast mode (5 levels) via the raw subscription payload.
    expect(mockState.listeners[0].params).toStrictEqual({
      type: 'l2Book',
      coin: 'BTC',
      nSigFigs: 2,
      mantissa: null,
      fast: true,
    });
  });

  it('creates a testnet transport when isTestnet resolves true', () => {
    const connection = new AggregatedOrderBookConnection({
      isTestnet: () => true,
    });
    connection.subscribe({ symbol: 'ETH', callback: jest.fn() });
    expect(mockState.transports[0].options).toStrictEqual({ isTestnet: true });
  });

  it('transforms snapshots and forwards them to the callback', () => {
    const connection = new AggregatedOrderBookConnection({
      isTestnet: () => false,
    });
    const callback = jest.fn();
    connection.subscribe({ symbol: 'BTC', nSigFigs: 2, callback });

    mockState.listeners[0].listener({
      coin: 'BTC',
      time: 1,
      levels: [[l2Level('64000', '1')], [l2Level('65000', '1')]],
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].midPrice).toBe('64500.00000');
  });

  it('ignores snapshots for a different coin', () => {
    const connection = new AggregatedOrderBookConnection({
      isTestnet: () => false,
    });
    const callback = jest.fn();
    connection.subscribe({ symbol: 'BTC', callback });

    mockState.listeners[0].listener({
      coin: 'ETH',
      time: 1,
      levels: [[l2Level('1', '1')], [l2Level('2', '1')]],
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('reuses the same transport for a second subscription on the same network', () => {
    const connection = new AggregatedOrderBookConnection({
      isTestnet: () => false,
    });
    connection.subscribe({ symbol: 'BTC', callback: jest.fn() });
    connection.subscribe({ symbol: 'ETH', callback: jest.fn() });

    expect(mockState.transports).toHaveLength(1);
    expect(mockState.transports[0].subscribe).toHaveBeenCalledTimes(2);
  });

  it('closes the transport once the last subscription is removed', async () => {
    const connection = new AggregatedOrderBookConnection({
      isTestnet: () => false,
    });
    const unsubA = connection.subscribe({ symbol: 'BTC', callback: jest.fn() });
    const unsubB = connection.subscribe({ symbol: 'ETH', callback: jest.fn() });
    await flush();

    const [transport] = mockState.transports;

    unsubA();
    expect(transport.close).not.toHaveBeenCalled();

    unsubB();
    expect(transport.close).toHaveBeenCalledTimes(1);
    // The pending SDK subscriptions are also cancelled.
    expect(mockState.unsubscribe).toHaveBeenCalledTimes(2);
  });

  it('recreates the transport when the network changes between subscriptions', () => {
    let testnet = false;
    const connection = new AggregatedOrderBookConnection({
      isTestnet: () => testnet,
    });
    connection.subscribe({ symbol: 'BTC', callback: jest.fn() });
    expect(mockState.transports).toHaveLength(1);

    testnet = true;
    connection.subscribe({ symbol: 'BTC', callback: jest.fn() });
    expect(mockState.transports).toHaveLength(2);
    expect(mockState.transports[0].close).toHaveBeenCalledTimes(1);
    expect(mockState.transports[1].options).toStrictEqual({ isTestnet: true });
  });

  it('cancels a subscription that resolves after unsubscribe', async () => {
    const connection = new AggregatedOrderBookConnection({
      isTestnet: () => false,
    });
    const callback = jest.fn();
    const unsub = connection.subscribe({ symbol: 'BTC', callback });

    // Unsubscribe before the snapshot listener is invoked.
    unsub();

    mockState.listeners[0].listener({
      coin: 'BTC',
      time: 1,
      levels: [[l2Level('1', '1')], [l2Level('2', '1')]],
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('closes the active transport on close()', () => {
    const connection = new AggregatedOrderBookConnection({
      isTestnet: () => false,
    });
    connection.subscribe({ symbol: 'BTC', callback: jest.fn() });
    connection.close();
    expect(mockState.transports[0].close).toHaveBeenCalledTimes(1);
  });

  describe('connection status', () => {
    it('reports connecting immediately then connected once the subscription resolves', async () => {
      const connection = new AggregatedOrderBookConnection({
        isTestnet: () => false,
      });
      const onStatusChange = jest.fn();
      connection.subscribe({
        symbol: 'BTC',
        callback: jest.fn(),
        onStatusChange,
      });

      expect(onStatusChange).toHaveBeenNthCalledWith(1, 'connecting');
      await flush();
      expect(onStatusChange).toHaveBeenCalledWith('connected');
    });

    it('reports connected on socket open and connecting on socket close', () => {
      const connection = new AggregatedOrderBookConnection({
        isTestnet: () => false,
      });
      const onStatusChange = jest.fn();
      connection.subscribe({
        symbol: 'BTC',
        callback: jest.fn(),
        onStatusChange,
      });
      const { socket } = mockState.transports[0];

      socket.dispatchEvent(new Event('open'));
      expect(onStatusChange).toHaveBeenCalledWith('connected');

      socket.dispatchEvent(new Event('close'));
      expect(onStatusChange).toHaveBeenLastCalledWith('connecting');
    });

    it('reports error when the socket terminates (reconnection exhausted)', () => {
      const connection = new AggregatedOrderBookConnection({
        isTestnet: () => false,
      });
      const onStatusChange = jest.fn();
      connection.subscribe({
        symbol: 'BTC',
        callback: jest.fn(),
        onStatusChange,
      });

      mockState.transports[0].socket.dispatchEvent(new Event('terminate'));
      expect(onStatusChange).toHaveBeenLastCalledWith('error');
    });

    it('reports error when the subscription request rejects', async () => {
      mockState.rejectSubscribe = true;
      const connection = new AggregatedOrderBookConnection({
        isTestnet: () => false,
      });
      const onStatusChange = jest.fn();
      connection.subscribe({
        symbol: 'BTC',
        callback: jest.fn(),
        onStatusChange,
      });

      await flush();
      expect(onStatusChange).toHaveBeenLastCalledWith('error');
    });

    it('stops reporting status after unsubscribe', () => {
      const connection = new AggregatedOrderBookConnection({
        isTestnet: () => false,
      });
      const onStatusChange = jest.fn();
      const unsub = connection.subscribe({
        symbol: 'BTC',
        callback: jest.fn(),
        onStatusChange,
      });
      const { socket } = mockState.transports[0];
      unsub();
      onStatusChange.mockClear();

      socket.dispatchEvent(new Event('terminate'));
      expect(onStatusChange).not.toHaveBeenCalled();
    });

    it('builds a fresh transport when resubscribing after a terminated socket', () => {
      const connection = new AggregatedOrderBookConnection({
        isTestnet: () => false,
      });
      const unsub = connection.subscribe({
        symbol: 'BTC',
        callback: jest.fn(),
      });
      mockState.transports[0].socket.dispatchEvent(new Event('terminate'));

      // Reconnect flow: tear the dead subscription down, then resubscribe.
      unsub();
      connection.subscribe({ symbol: 'BTC', callback: jest.fn() });

      expect(mockState.transports).toHaveLength(2);
      expect(mockState.transports[0].close).toHaveBeenCalledTimes(1);
    });
  });
});
