import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../../store/background-connection';
import {
  applyLiveTokenFiat,
  liveFiatDelta,
  liveGroupFiatAdjustments,
  readLiveQuotes,
  useMarketStats,
  useMarketStatsListener,
  useMarketStatsSubscription,
} from './market-stats';

jest.mock('react-redux', () => ({
  useSelector: (
    selector: (state: { metamask: { currentCurrency: string } }) => unknown,
  ) => selector({ metamask: { currentCurrency: 'usd' } }),
}));

jest.mock('../../store/background-connection', () => ({
  subscribeToMessengerEvent: jest.fn(),
  submitRequestToBackground: jest.fn(),
}));

const subscribeToMessengerEventMock = jest.mocked(subscribeToMessengerEvent);
const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);

const ASSET_ID = 'eip155:42161/slip44:60';

describe('useMarketStats', () => {
  /** The bridge writes ticks, and a reader selects from them. */
  function useBridgedMarketStats<Selected>(
    select: (quotes: Parameters<typeof readLiveQuotes>[0]) => Selected,
  ) {
    useMarketStatsListener();
    return useMarketStats(select);
  }

  function queryWrapper(queryClient: QueryClient) {
    return function wrapper({ children }: { children: ReactNode }) {
      return createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
    };
  }

  it('keeps delivering ticks after a subscribe, release, and subscribe', async () => {
    const callbacks: ((payload: unknown) => void)[] = [];
    const offs: jest.Mock[] = [];
    const resolvers: ((off: () => Promise<void>) => void)[] = [];

    subscribeToMessengerEventMock.mockImplementation((_event, callback) => {
      callbacks.push(callback as (payload: unknown) => void);
      return new Promise((resolve) => {
        const off = jest.fn().mockResolvedValue(undefined);
        offs.push(off);
        resolvers.push(resolve);
      });
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = queryWrapper(queryClient);
    const selectEth = (quotes: Parameters<typeof readLiveQuotes>[0]) =>
      readLiveQuotes(quotes, ['eip155:1/slip44:60']);
    const first = renderHook(() => useBridgedMarketStats(selectEth), {
      wrapper,
    });
    first.unmount();
    const second = renderHook(() => useBridgedMarketStats(selectEth), {
      wrapper,
    });

    resolvers[0]?.(offs[0]);
    resolvers[1]?.(offs[1]);
    await Promise.resolve();
    await Promise.resolve();

    await act(async () => {
      callbacks[1]?.([
        {
          updates: [
            {
              assetId: 'eip155:1/slip44:60',
              currency: 'usd',
              price: 10,
            },
          ],
        },
      ]);
    });

    await waitFor(() => {
      expect(second.result.current[0]?.price).toBe(10);
    });
    expect(offs[0]).toHaveBeenCalled();
    expect(offs[1]).not.toHaveBeenCalled();

    second.unmount();
  });

  it('reads a streamed price from the query cache', async () => {
    const callbacks: ((payload: unknown) => void)[] = [];
    subscribeToMessengerEventMock.mockImplementation((_event, callback) => {
      callbacks.push(callback as (payload: unknown) => void);
      return Promise.resolve(jest.fn().mockResolvedValue(undefined));
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(
      () =>
        useBridgedMarketStats((quotes) => readLiveQuotes(quotes, [ASSET_ID])),
      {
        wrapper: ({ children }) =>
          createElement(QueryClientProvider, { client: queryClient }, children),
      },
    );

    expect(result.current).toStrictEqual([undefined]);

    await act(async () => {
      callbacks[0]?.([
        {
          updates: [{ assetId: ASSET_ID, currency: 'usd', price: 42 }],
        },
      ]);
    });

    await waitFor(() => {
      expect(result.current[0]?.price).toBe(42);
    });
  });

  it('adds no listener of its own for each reader', async () => {
    subscribeToMessengerEventMock.mockReset();
    subscribeToMessengerEventMock.mockResolvedValue(
      jest.fn().mockResolvedValue(undefined),
    );
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = queryWrapper(queryClient);

    renderHook(() => useMarketStats(), { wrapper });
    renderHook(() => useMarketStats(), { wrapper });

    expect(subscribeToMessengerEventMock).not.toHaveBeenCalled();
  });

  it('shares one listener between the bridge and every reader', async () => {
    const callbacks: ((payload: unknown) => void)[] = [];
    subscribeToMessengerEventMock.mockReset();
    subscribeToMessengerEventMock.mockImplementation((_event, callback) => {
      callbacks.push(callback as (payload: unknown) => void);
      return Promise.resolve(jest.fn().mockResolvedValue(undefined));
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = queryWrapper(queryClient);

    renderHook(() => useMarketStatsListener(), { wrapper });
    const first = renderHook(
      () => useMarketStats((quotes) => readLiveQuotes(quotes, [ASSET_ID])),
      { wrapper },
    );
    const second = renderHook(() => useMarketStats(), { wrapper });

    expect(callbacks).toHaveLength(1);

    await act(async () => {
      callbacks[0]?.([
        { updates: [{ assetId: ASSET_ID, currency: 'usd', price: 7 }] },
      ]);
    });

    await waitFor(() => {
      expect(first.result.current[0]?.price).toBe(7);
    });
    expect(second.result.current.get(ASSET_ID)?.price).toBe(7);
  });

  it('keeps the list when a tick is for another asset', async () => {
    const callbacks: ((payload: unknown) => void)[] = [];
    subscribeToMessengerEventMock.mockImplementation((_event, callback) => {
      callbacks.push(callback as (payload: unknown) => void);
      return Promise.resolve(jest.fn().mockResolvedValue(undefined));
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const watched = 'eip155:1/slip44:60';
    const other = 'eip155:137/slip44:60';
    const { result } = renderHook(
      () =>
        useBridgedMarketStats((quotes) => readLiveQuotes(quotes, [watched])),
      { wrapper: queryWrapper(queryClient) },
    );

    await act(async () => {
      callbacks[0]?.([
        { updates: [{ assetId: watched, currency: 'usd', price: 10 }] },
      ]);
    });
    await waitFor(() => {
      expect(result.current[0]?.price).toBe(10);
    });
    const quotes = result.current;

    await act(async () => {
      callbacks[0]?.([
        { updates: [{ assetId: other, currency: 'usd', price: 99 }] },
      ]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current).toBe(quotes);
    expect(result.current[0]?.price).toBe(10);

    await act(async () => {
      callbacks[0]?.([
        { updates: [{ assetId: watched, currency: 'usd', price: 11 }] },
      ]);
    });
    await waitFor(() => {
      expect(result.current[0]?.price).toBe(11);
    });
    expect(result.current).not.toBe(quotes);
  });
});

describe('applyLiveTokenFiat', () => {
  it('replaces the fiat balance with balance times the streamed price', () => {
    const token = applyLiveTokenFiat(
      {
        balance: '2',
        tokenFiatAmount: 200,
        fiat: { balance: 200, conversionRate: 2400, currency: 'usd' },
      },
      150,
    );

    expect(token.tokenFiatAmount).toBe(300);
    expect(token.fiat?.balance).toBe(300);
    expect(token.fiat?.conversionRate).toBe(2400);
  });

  it('leaves the row unchanged when there is no streamed price', () => {
    const token = {
      balance: '2',
      tokenFiatAmount: 200,
    };

    expect(applyLiveTokenFiat(token, undefined)).toBe(token);
  });
});

describe('liveFiatDelta', () => {
  it('sums the difference between streamed and polled fiat balances', () => {
    const delta = liveFiatDelta(
      [
        {
          balance: '2',
          fiat: { balance: 200 },
        },
      ],
      new Map([['eip155:1/slip44:60', { price: 150 }]]),
      () => 'eip155:1/slip44:60',
    );

    expect(delta).toBe(100);
  });
});

describe('liveGroupFiatAdjustments', () => {
  const toAssetId = () => 'eip155:1/slip44:60';

  it('moves each account total by the streamed price difference', () => {
    const adjustments = liveGroupFiatAdjustments(
      {
        'wallet/0': {
          'eip155:1': [{ balance: '1', fiat: { balance: 38.02 } }],
        },
        'wallet/1': {
          'eip155:1': [{ balance: '2', fiat: { balance: 10 } }],
        },
      },
      new Map([['eip155:1/slip44:60', { price: 38 }]]),
      toAssetId,
    );

    expect(adjustments.get('wallet/0')).toBeCloseTo(-0.02);
    expect(adjustments.get('wallet/1')).toBe(66);
  });

  it('returns an empty map when nothing is streaming', () => {
    const adjustments = liveGroupFiatAdjustments(
      {
        'wallet/0': {
          'eip155:1': [{ balance: '1', fiat: { balance: 1 } }],
        },
      },
      new Map(),
      toAssetId,
    );

    expect(adjustments.size).toBe(0);
  });
});

async function advanceTimers(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('useMarketStatsSubscription', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    submitRequestToBackgroundMock.mockReset();
    submitRequestToBackgroundMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('subscribes after the debounce', async () => {
    renderHook(() => useMarketStatsSubscription([ASSET_ID]));

    expect(submitRequestToBackgroundMock).not.toHaveBeenCalled();

    await advanceTimers(500);
    await act(async () => {
      await Promise.resolve();
    });

    expect(submitRequestToBackgroundMock).toHaveBeenCalledTimes(1);
    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'messengerCall',
      [
        'MarketStatsService:subscribe',
        [[{ assetId: ASSET_ID, currency: 'usd' }], 'ui'],
      ],
    );
  });

  it('does not subscribe when the page closes before the debounce', async () => {
    const { unmount } = renderHook(() =>
      useMarketStatsSubscription([ASSET_ID]),
    );

    unmount();
    await advanceTimers(500);

    expect(submitRequestToBackgroundMock).not.toHaveBeenCalled();
  });

  it('unsubscribes when the page closes after the subscribe completes', async () => {
    const { unmount } = renderHook(() =>
      useMarketStatsSubscription([ASSET_ID]),
    );

    await advanceTimers(500);
    await act(async () => {
      await Promise.resolve();
    });

    unmount();

    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'messengerCall',
      ['MarketStatsService:subscribe', [[], 'ui']],
    );
  });

  it('unsubscribes when the subscribe resolves after the page has closed', async () => {
    let resolveSubscribe: (() => void) | undefined;
    submitRequestToBackgroundMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubscribe = () => resolve(undefined);
        }),
    );

    const { unmount } = renderHook(() =>
      useMarketStatsSubscription([ASSET_ID]),
    );

    await advanceTimers(500);
    unmount();

    await act(async () => {
      resolveSubscribe?.();
      await Promise.resolve();
    });

    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'messengerCall',
      ['MarketStatsService:subscribe', [[], 'ui']],
    );
  });
});
