import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { getPerpsStreamManager } from '../../../providers/perps/PerpsStreamManager';
import { usePerpsMarketDataSync } from './usePerpsMarketDataSync';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../providers/perps/CandleStreamChannel', () => ({
  CandleStreamChannel: jest.fn().mockImplementation(() => ({
    clearAll: jest.fn(),
  })),
}));

let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
  value: {
    ...globalThis.crypto,
    randomUUID: () => `test-uuid-${(uuidCounter += 1)}`,
  },
});

const useSelectorMock = useSelector as jest.MockedFunction<typeof useSelector>;

const makeMockMarket = (symbol: string): PerpsMarketData =>
  ({
    symbol,
    name: symbol,
    price: `$100`,
    volume: '$1B',
  }) as unknown as PerpsMarketData;

/**
 * Build a Redux state shape that the inline selector can read.
 * The controller stores under `${provider}:${testnet ? 'testnet' : 'mainnet'}`.
 *
 * @param markets - Market data to embed in the state, or null for an empty cache
 * @returns A minimal Redux state object
 */
function buildReduxState(markets: PerpsMarketData[] | null) {
  return {
    metamask: {
      activeProvider: 'hyperliquid',
      isTestnet: false,
      cachedMarketDataByProvider: markets
        ? { 'hyperliquid:mainnet': { data: markets, timestamp: Date.now() } }
        : {},
    },
  };
}

function setupSelectorWithMarkets(markets: PerpsMarketData[] | null) {
  const state = buildReduxState(markets);
  useSelectorMock.mockImplementation((selector) =>
    (selector as (s: typeof state) => unknown)(state),
  );
  return state;
}

describe('usePerpsMarketDataSync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uuidCounter = 0;
    getPerpsStreamManager().reset();
  });

  afterEach(() => {
    getPerpsStreamManager().reset();
  });

  it('pushes preloaded market data on first render when stream manager is initialized', () => {
    const sm = getPerpsStreamManager();
    sm.init('0xtest');
    const pushSpy = jest.spyOn(sm.markets, 'pushData');

    const markets = [makeMockMarket('BTC'), makeMockMarket('xyz:TSLA')];
    setupSelectorWithMarkets(markets);

    renderHook(() => usePerpsMarketDataSync());

    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy).toHaveBeenCalledWith(markets);
    pushSpy.mockRestore();
  });

  it('pushes when Redux market data changes', () => {
    const sm = getPerpsStreamManager();
    sm.init('0xtest');
    const pushSpy = jest.spyOn(sm.markets, 'pushData');

    const initialMarkets = [makeMockMarket('BTC')];
    setupSelectorWithMarkets(initialMarkets);

    const { rerender } = renderHook(() => usePerpsMarketDataSync());
    pushSpy.mockClear();

    const updatedMarkets = [makeMockMarket('BTC'), makeMockMarket('xyz:TSLA')];
    setupSelectorWithMarkets(updatedMarkets);
    rerender();

    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy).toHaveBeenCalledWith(updatedMarkets);
    pushSpy.mockRestore();
  });

  it('does not push when same reference is returned', () => {
    const sm = getPerpsStreamManager();
    sm.init('0xtest');

    const markets = [makeMockMarket('BTC')];
    setupSelectorWithMarkets(markets);

    const pushSpy = jest.spyOn(sm.markets, 'pushData');

    const { rerender } = renderHook(() => usePerpsMarketDataSync());

    // First render pushes
    expect(pushSpy).toHaveBeenCalledTimes(1);
    pushSpy.mockClear();

    // Rerender with same state (same reference from selector)
    rerender();

    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });

  it('does not push when cached data is null', () => {
    const sm = getPerpsStreamManager();
    sm.init('0xtest');
    const pushSpy = jest.spyOn(sm.markets, 'pushData');

    setupSelectorWithMarkets(null);

    renderHook(() => usePerpsMarketDataSync());

    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });

  it('does not push when cached data is empty', () => {
    const sm = getPerpsStreamManager();
    sm.init('0xtest');
    const pushSpy = jest.spyOn(sm.markets, 'pushData');

    setupSelectorWithMarkets([]);

    renderHook(() => usePerpsMarketDataSync());

    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });

  it('does not push when stream manager is not initialized', () => {
    const sm = getPerpsStreamManager();
    // Deliberately NOT calling sm.init()
    const pushSpy = jest.spyOn(sm.markets, 'pushData');

    const markets = [makeMockMarket('BTC'), makeMockMarket('xyz:TSLA')];
    setupSelectorWithMarkets(markets);

    renderHook(() => usePerpsMarketDataSync());

    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });

  it('does not overwrite stream cache when it has more markets than Redux', () => {
    const sm = getPerpsStreamManager();
    sm.init('0xtest');

    // Stream manager already has 3 markets (from a fresh REST call)
    sm.markets.pushData([
      makeMockMarket('BTC'),
      makeMockMarket('ETH'),
      makeMockMarket('xyz:TSLA'),
    ]);

    const pushSpy = jest.spyOn(sm.markets, 'pushData');

    // Redux only has 2 (stale preload before HIP-3 config)
    setupSelectorWithMarkets([makeMockMarket('BTC'), makeMockMarket('ETH')]);

    renderHook(() => usePerpsMarketDataSync());

    expect(pushSpy).not.toHaveBeenCalled();
    pushSpy.mockRestore();
  });

  it('uses correct composite key for testnet', () => {
    const sm = getPerpsStreamManager();
    sm.init('0xtest');
    const pushSpy = jest.spyOn(sm.markets, 'pushData');

    const markets = [makeMockMarket('BTC')];
    const state = {
      metamask: {
        activeProvider: 'hyperliquid',
        isTestnet: true,
        cachedMarketDataByProvider: {
          'hyperliquid:testnet': { data: markets, timestamp: Date.now() },
        },
      },
    };
    useSelectorMock.mockImplementation((selector) =>
      (selector as (s: typeof state) => unknown)(state),
    );

    renderHook(() => usePerpsMarketDataSync());

    expect(pushSpy).toHaveBeenCalledWith(markets);
    pushSpy.mockRestore();
  });
});
