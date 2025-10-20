/*
 * Tests for ExtensionLazyListener
 */
import { Events } from 'webextension-polyfill';
import { ExtensionLazyListener } from './extension-lazy-listener';
import {
  BrowserInterface,
  BrowserNamespace,
  Entries,
} from './extension-lazy-listener.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockListener = (...args: any[]) => void;

class MockEvent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  implements Partial<import('webextension-polyfill').Events.Event<any>>
{
  private listeners: MockListener[] = [];

  public addListener = (listener: MockListener) => {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  };

  public removeListener = (listener: MockListener) => {
    this.listeners = this.listeners.filter((l) => l !== listener);
  };

  public hasListener = (listener: MockListener) =>
    this.listeners.includes(listener);

  // Non-standard helper used only by tests to fire the event.
  public trigger = (...args: unknown[]) => {
    // copy to tolerate mutation (e.g., removing listener mid-iteration)
    const current = [...this.listeners];
    for (const l of current) {
      l(...args);
    }
  };
}

// Helper to build a mock browser namespace with arbitrary events
function buildMockBrowser<T extends Record<string, readonly string[]>>(
  namespaces: T,
) {
  const browser: BrowserInterface & {
    [K in keyof T]: {
      [E in T[K][number]]: MockEvent & Events.Event<(...args: any[]) => void>;
    };
  } = {} as any;
  for (const [ns, events] of Object.entries(namespaces) as Entries) {
    // @ts-expect-error
    browser[ns] = {};
    for (const ev of events) {
      // @ts-expect-error
      browser[ns][ev] = new MockEvent();
    }
  }
  return browser;
}

describe('ExtensionLazyListener', () => {
  beforeEach(() => {
    jest.useRealTimers();
    process.env.IN_TEST = 'true'; // ensure error logging path
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('buffers calls before a real listener is added and flushes them in order', () => {
    const browser = buildMockBrowser({ runtime: ['onMessage' as const] });
    type t = BrowserNamespace<typeof browser>;
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onMessage'] });
    browser.runtime.onMessage.trigger('a', 1);
    browser.runtime.onMessage.trigger('b', 2);
    const received: unknown[] = [];
    lazy.addListener('runtime', 'onMessage', (...args: unknown[]) =>
      received.push(args),
    );
    expect(received).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  test('constructor without options parameter behaves like empty options', async () => {
    jest.useFakeTimers();
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    // Emit before constructing (should not matter) then after constructing
    browser.runtime.onMessage.trigger('pre');
    const lazy = new ExtensionLazyListener(browser, undefined, 150); // omit options
    browser.runtime.onMessage.trigger('pre2');
    // Add listener; neither pre nor pre2 should have been buffered
    const received: any[] = [];
    lazy.addListener('runtime', 'onMessage', ((...a: any[]) =>
      received.push(a)) as any);
    expect(received).toEqual([]);
    browser.runtime.onMessage.trigger('live');
    expect(received).toEqual([['live']]);
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    jest.advanceTimersByTime(151);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('once on namespace with listeners but untracked event waits (listeners truthy, tracker undefined)', async () => {
    // Track only runtime.onFoo lazily, call once on runtime.onBar
    const browser = buildMockBrowser({ runtime: ['onFoo', 'onBar'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onFoo'] });
    // Fire onBar before calling once; should NOT resolve (not buffered)
    browser.runtime.onBar.trigger('early');
    const promise = lazy.once('runtime', 'onBar' as any); // cast to satisfy type (untracked event)
    let resolved: any[] | undefined;
    promise.then((r) => (resolved = r));
    expect(resolved).toBeUndefined();
    // Trigger after registering temp listener
    browser.runtime.onBar.trigger('later', 123);
    await expect(promise).resolves.toEqual(['later', 123]);
  });

  test('once on completely untracked namespace waits (listeners falsy)', async () => {
    // Browser has a tabs namespace, but we track nothing in options
    const browser = buildMockBrowser({ tabs: ['onActivated'] });
    const lazy = new ExtensionLazyListener(browser, {}); // no namespaces tracked
    // Fire before once; should not resolve
    browser.tabs.onActivated.trigger('early');
    const promise = lazy.once('tabs' as any, 'onActivated' as any);
    let resolved: any[] | undefined;
    promise.then((r) => (resolved = r));
    expect(resolved).toBeUndefined();
    browser.tabs.onActivated.trigger('later');
    await expect(promise).resolves.toEqual(['later']);
  });

  test('does not buffer further events after flushing (lazy listener removed)', () => {
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onMessage'] });
    browser.runtime.onMessage.trigger('first');
    const firstCb = jest.fn();
    lazy.addListener('runtime', 'onMessage', firstCb);
    expect(firstCb).toHaveBeenCalledWith('first');
    // Remove application listener
    browser.runtime.onMessage.removeListener(firstCb);
    // Fire event while NO listener is attached; if lazy listener was still
    // active, this would become buffered.
    browser.runtime.onMessage.trigger('second');
    // Add new listener; it should NOT get 'second'.
    const secondCb = jest.fn();
    lazy.addListener('runtime', 'onMessage', secondCb);
    // Fire a new one which should be delivered.
    browser.runtime.onMessage.trigger('third');
    expect(secondCb).toHaveBeenCalledTimes(1);
    expect(secondCb).toHaveBeenCalledWith('third');
  });

  test('stops flushing buffered calls if listener removes itself mid-flush and leaves remaining buffered', () => {
    const browser = buildMockBrowser({ tabs: ['onUpdated'] });
    const lazy = new ExtensionLazyListener(browser, { tabs: ['onUpdated'] });
    browser.tabs.onUpdated.trigger(1);
    browser.tabs.onUpdated.trigger(2);
    browser.tabs.onUpdated.trigger(3);
    const received: number[] = [];
    const callback = jest.fn((n: number) => {
      received.push(n);
      if (n === 2) {
        // Remove itself before remaining buffered call(s)
        browser.tabs.onUpdated.removeListener(callback as any);
      }
    });
    lazy.addListener('tabs', 'onUpdated', callback as any);
    // We expect calls 1 and 2 to have been delivered, but 3 left buffered.
    expect(received).toEqual([1, 2]);
    // Now add a NEW listener to consume remaining buffered call(s)
    const later: number[] = [];
    lazy.addListener('tabs', 'onUpdated', ((n: number) =>
      later.push(n)) as any);
    expect(later).toEqual([3]);
  });

  test('if callback throws during flush, remaining buffered calls are preserved', () => {
    const browser = buildMockBrowser({ runtime: ['onSuspend'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onSuspend'] });
    browser.runtime.onSuspend.trigger('x');
    browser.runtime.onSuspend.trigger('y');
    const error = new Error('boom');
    const throwing = jest.fn((val: string) => {
      if (val === 'x') {
        throw error;
      }
    });
    expect(() => {
      lazy.addListener('runtime', 'onSuspend', throwing as any);
    }).toThrow(error);
    // Remaining call should still be buffered.
    const after: string[] = [];
    lazy.addListener('runtime', 'onSuspend', ((v: string) =>
      after.push(v)) as any);
    expect(after).toEqual(['y']);
  });

  test('once resolves synchronously from buffered call and leaves remaining buffered', async () => {
    const browser = buildMockBrowser({ runtime: ['onConnect'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onConnect'] });
    browser.runtime.onConnect.trigger('alpha');
    browser.runtime.onConnect.trigger('beta');
    const first = await lazy.once('runtime', 'onConnect');
    expect(first).toEqual(['alpha']);
    // Second buffered call should remain and be consumed by subsequent once.
    const second = await lazy.once('runtime', 'onConnect');
    expect(second).toEqual(['beta']);
  });

  test('once resolves from buffered calls sequentially', async () => {
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onMessage'] });
    browser.runtime.onMessage.trigger('first');
    browser.runtime.onMessage.trigger('second');
    const p1 = lazy.once('runtime', 'onMessage');
    await expect(p1).resolves.toEqual(['first']);
    const p2 = lazy.once('runtime', 'onMessage');
    await expect(p2).resolves.toEqual(['second']);
  });

  test('once waits for next emission if nothing buffered', async () => {
    const browser = buildMockBrowser({ runtime: ['onInstalled'] });
    const lazy = new ExtensionLazyListener(browser, {
      runtime: ['onInstalled'],
    });
    const promise = lazy.once('runtime', 'onInstalled');
    // Nothing buffered yet.
    let resolved: any[] | undefined;
    promise.then((r) => (resolved = r));
    expect(resolved).toBeUndefined();
    browser.runtime.onInstalled.trigger('payload', 42);
    await expect(promise).resolves.toEqual(['payload', 42]);
  });

  test('memory leak warning timer logs error in test env', () => {
    jest.useFakeTimers();
    const browser = buildMockBrowser({ runtime: ['onMessage', 'onConnect'] });
    const timeout = 500;
    // spy
    const spy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    // Create instance (starts timer)
    new ExtensionLazyListener(
      browser,
      { runtime: ['onMessage', 'onConnect'] },
      timeout,
    );
    // Advance but not enough
    jest.advanceTimersByTime(timeout - 1);
    expect(spy).not.toHaveBeenCalled();
    // Now advance to fire
    jest.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(2); // one per event
    const messages = spy.mock.calls.map((c) => c[0]);
    expect(messages[0]).toMatch(/Possible memory leak/);
    expect(messages[0]).toMatch(/runtime.onMessage/);
  });

  test('memory leak warning logs warn in non-test env', () => {
    jest.useFakeTimers();
    process.env.IN_TEST = '';
    const browser = buildMockBrowser({ tabs: ['onActivated'] });
    const timeout = 300;
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    new ExtensionLazyListener(browser, { tabs: ['onActivated'] }, timeout);
    jest.advanceTimersByTime(timeout);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatch(/tabs.onActivated/);
  });

  // --- Additional branch coverage tests ---

  test('addListener for event that was not part of Options does not flush prior triggers', () => {
    const browser = buildMockBrowser({ runtime: ['onFoo', 'onBar'] });
    // Only track onFoo lazily
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onFoo'] });
    // Trigger onBar before adding a listener; should NOT be buffered
    browser.runtime.onBar.trigger('pre');
    const received: any[] = [];
    lazy.addListener('runtime', 'onBar', ((...a: any[]) =>
      received.push(a)) as any);
    expect(received).toEqual([]);
    browser.runtime.onBar.trigger('post');
    expect(received).toEqual([['post']]);
  });

  test('addListener for namespace never included in Options does not flush prior triggers', () => {
    const browser = buildMockBrowser({
      runtime: ['onFoo'],
      tabs: ['onUpdated'],
    });
    // Only runtime.onFoo tracked
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onFoo'] });
    browser.tabs.onUpdated.trigger('pre');
    const received: any[] = [];
    lazy.addListener('tabs', 'onUpdated', ((...a: any[]) =>
      received.push(a)) as any);
    expect(received).toEqual([]);
    browser.tabs.onUpdated.trigger('post');
    expect(received).toEqual([['post']]);
  });

  test('mid-flush removal on last buffered call does not re-add lazy listener', () => {
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onMessage'] });
    browser.runtime.onMessage.trigger('one');
    browser.runtime.onMessage.trigger('two'); // last buffered call
    const received: any[] = [];
    const cb = jest.fn((v: string) => {
      received.push(v);
      if (v === 'two') {
        browser.runtime.onMessage.removeListener(cb as any); // remove on last call
      }
    });
    lazy.addListener('runtime', 'onMessage', cb as any);
    expect(received).toEqual(['one', 'two']);
    // Fire another event while no listener is attached and ensure it is NOT buffered
    browser.runtime.onMessage.trigger('gap');
    const later: any[] = [];
    lazy.addListener('runtime', 'onMessage', ((v: string) =>
      later.push(v)) as any);
    // 'gap' should not appear because lazy listener was not re-added.
    expect(later).toEqual([]);
    browser.runtime.onMessage.trigger('after');
    expect(later).toEqual(['after']);
  });

  test('error thrown on last buffered call does not re-add lazy listener', () => {
    const browser = buildMockBrowser({ runtime: ['onSuspend'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onSuspend'] });
    browser.runtime.onSuspend.trigger('x');
    browser.runtime.onSuspend.trigger('y'); // last buffered
    const err = new Error('final');
    const throwing = jest.fn((v: string) => {
      if (v === 'y') {
        throw err;
      }
    });
    expect(() => {
      lazy.addListener('runtime', 'onSuspend', throwing as any);
    }).toThrow(err);
    // Fire another event while no listener attached: should not be buffered
    browser.runtime.onSuspend.trigger('gap');
    const later: string[] = [];
    lazy.addListener('runtime', 'onSuspend', ((v: string) =>
      later.push(v)) as any);
    expect(later).toEqual([]);
    browser.runtime.onSuspend.trigger('after');
    expect(later).toEqual(['after']);
  });

  test('once with single buffered call removes tracker completely (length===1 branch)', async () => {
    const browser = buildMockBrowser({ runtime: ['onInstalled'] });
    const lazy = new ExtensionLazyListener(browser, {
      runtime: ['onInstalled'],
    });
    browser.runtime.onInstalled.trigger('only');
    const first = await lazy.once('runtime', 'onInstalled');
    expect(first).toEqual(['only']);
    // Second once should wait for a new emission (since tracker removed)
    const secondPromise = lazy.once('runtime', 'onInstalled');
    let resolved: any[] | undefined;
    secondPromise.then((r) => (resolved = r));
    expect(resolved).toBeUndefined();
    browser.runtime.onInstalled.trigger('new');
    await expect(secondPromise).resolves.toEqual(['new']);
  });

  test('memory leak warning includes buffered count', () => {
    jest.useFakeTimers();
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    const timeout = 250;
    // Create with lazy listener
    const lazy = new ExtensionLazyListener(
      browser,
      { runtime: ['onMessage'] },
      timeout,
    );
    // Buffer some calls
    browser.runtime.onMessage.trigger('a');
    browser.runtime.onMessage.trigger('b');
    const spy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    jest.advanceTimersByTime(timeout);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatch(/2 buffered calls/);
  });

  test('constructor with empty options does not schedule any leak warnings', () => {
    jest.useFakeTimers();
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    new ExtensionLazyListener(browser, {}, 200);
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    jest.advanceTimersByTime(200);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('addListener with zero buffered calls (tracker exists, empty args) does not flush and delivers subsequent emissions', () => {
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onMessage'] });
    const cb = jest.fn();
    // No pre-triggering; tracker args length = 0
    lazy.addListener('runtime', 'onMessage', cb as any);
    expect(cb).not.toHaveBeenCalled(); // no flush
    // Now emit; should deliver directly
    browser.runtime.onMessage.trigger('later');
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('later');
  });
});
