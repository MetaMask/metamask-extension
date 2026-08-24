import {
  buildRouteStack,
  getRouterHistoryIndex,
  hasInAppHistoryEntry,
  readResumedStack,
  resolveStackBase,
} from './route-history';

describe('getRouterHistoryIndex', () => {
  const originalState = window.history.state;

  afterEach(() => {
    window.history.replaceState(originalState, '');
  });

  it('reads the router index', () => {
    window.history.replaceState({ idx: 4 }, '');

    expect(getRouterHistoryIndex()).toBe(4);
  });

  it('is undefined when history state carries no index', () => {
    window.history.replaceState({ some: 'value' }, '');

    expect(getRouterHistoryIndex()).toBeUndefined();
  });
});

describe('hasInAppHistoryEntry', () => {
  const originalState = window.history.state;

  afterEach(() => {
    window.history.replaceState(originalState, '');
  });

  it('is false on the first router entry even though the popup init redirect left one behind', () => {
    window.history.replaceState({ idx: 0 }, '');
    Object.defineProperty(window.history, 'length', {
      value: 2,
      configurable: true,
    });

    expect(hasInAppHistoryEntry()).toBe(false);
  });

  it('is true once the app has pushed an entry', () => {
    window.history.replaceState({ idx: 1 }, '');

    expect(hasInAppHistoryEntry()).toBe(true);
  });

  it('falls back to history length when the router index is absent', () => {
    window.history.replaceState(null, '');
    Object.defineProperty(window.history, 'length', {
      value: 1,
      configurable: true,
    });

    expect(hasInAppHistoryEntry()).toBe(false);
  });
});

describe('buildRouteStack', () => {
  const maxDepth = 5;

  it('records the first path at the base', () => {
    expect(
      buildRouteStack({
        previous: [],
        path: '/perps/market-list',
        depth: 0,
        maxDepth,
      }),
    ).toStrictEqual(['/perps/market-list']);
  });

  it('extends the stack on a push', () => {
    expect(
      buildRouteStack({
        previous: ['/perps/market-list'],
        path: '/perps/market/BTC',
        depth: 1,
        maxDepth,
      }),
    ).toStrictEqual(['/perps/market-list', '/perps/market/BTC']);
  });

  it('truncates the entries above a pop', () => {
    expect(
      buildRouteStack({
        previous: [
          '/perps/market-list',
          '/perps/market/BTC',
          '/perps/trade/BTC',
        ],
        path: '/perps/market/BTC',
        depth: 1,
        maxDepth,
      }),
    ).toStrictEqual(['/perps/market-list', '/perps/market/BTC']);
  });

  it('overwrites in place on a replace', () => {
    expect(
      buildRouteStack({
        previous: ['/perps/market-list', '/perps/market/BTC'],
        path: '/perps/market/ETH',
        depth: 1,
        maxDepth,
      }),
    ).toStrictEqual(['/perps/market-list', '/perps/market/ETH']);
  });

  it('keeps the newest entries when the stack exceeds maxDepth', () => {
    expect(
      buildRouteStack({
        previous: ['/perps/a', '/perps/b', '/perps/c'],
        path: '/perps/d',
        depth: 3,
        maxDepth: 2,
      }),
    ).toStrictEqual(['/perps/c', '/perps/d']);
  });

  it('drops holes left by a depth beyond the recorded stack', () => {
    expect(
      buildRouteStack({
        previous: ['/perps/market-list'],
        path: '/perps/trade/BTC',
        depth: 3,
        maxDepth,
      }),
    ).toStrictEqual(['/perps/market-list', '/perps/trade/BTC']);
  });
});

describe('readResumedStack', () => {
  it('reads the replayed stack from route state', () => {
    expect(
      readResumedStack({ perpsResumedStack: ['/perps/market/BTC'] }),
    ).toStrictEqual(['/perps/market/BTC']);
  });

  it('ignores state without a string stack', () => {
    expect(readResumedStack(null)).toBeUndefined();
    expect(readResumedStack({})).toBeUndefined();
    expect(readResumedStack({ perpsResumedStack: [1, 2] })).toBeUndefined();
  });
});

describe('resolveStackBase', () => {
  const resumedStack = [
    '/perps/market-list',
    '/perps/market/BTC',
    '/perps/trade/BTC',
  ];

  it('adopts the replayed stack when mounted on its top entry', () => {
    expect(
      resolveStackBase({
        resumedStack,
        path: '/perps/trade/BTC',
        historyIndex: 3,
      }),
    ).toStrictEqual({ base: 1, stack: resumedStack });
  });

  it('adopts only the entries up to where it mounted', () => {
    expect(
      resolveStackBase({
        resumedStack,
        path: '/perps/market/BTC',
        historyIndex: 2,
      }),
    ).toStrictEqual({
      base: 1,
      stack: ['/perps/market-list', '/perps/market/BTC'],
    });
  });

  it('starts fresh when the entry is not part of a replayed stack', () => {
    expect(
      resolveStackBase({ path: '/perps/market/BTC', historyIndex: 2 }),
    ).toStrictEqual({ base: 2, stack: [] });
  });

  it('starts fresh when the current path is absent from the replayed stack', () => {
    expect(
      resolveStackBase({
        resumedStack,
        path: '/perps/withdraw',
        historyIndex: 4,
      }),
    ).toStrictEqual({ base: 4, stack: [] });
  });
});
