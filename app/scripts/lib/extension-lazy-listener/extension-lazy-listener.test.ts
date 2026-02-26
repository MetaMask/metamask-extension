/*
 * Tests for ExtensionLazyListener
 */
import { Browser, Events, Runtime } from 'webextension-polyfill';
import { ExtensionLazyListener } from './extension-lazy-listener';
import {
  BrowserInterface,
  CallbackConstraint as MockListener,
  Entries,
} from './extension-lazy-listener.types';

/**
 * A mock Events.Event implementation for testing.
 *
 * e.g., `browser.runtime.onConnect` implements this sort of interface
 */
class MockEvent
  implements Partial<import('webextension-polyfill').Events.Event<MockListener>>
{
  #listeners: MockListener[] = [];

  public addListener = (listener: MockListener) => {
    if (!this.#listeners.includes(listener)) {
      this.#listeners.push(listener);
    }
  };

  public removeListener = (listener: MockListener) => {
    this.#listeners = this.#listeners.filter((l) => l !== listener);
  };

  public hasListener = (listener: MockListener) =>
    this.#listeners.includes(listener);

  /**
   * Non-standard helper used only by tests to fire the event.
   *
   * @param args - The arguments to pass to listeners.
   */
  public trigger = (...args: unknown[]) => {
    // copy to tolerate mutation (e.g., removing listener mid-iteration)
    const current = [...this.#listeners];
    for (const l of current) {
      l(...args);
    }
  };
}

/**
 * Helper to build a mock browser namespace with arbitrary events
 *
 * @param namespaces - The namespaces and their events.
 * @returns The mock browser.
 */
function buildMockBrowser<
  MockBrowser extends Record<string, readonly string[]>,
>(namespaces: MockBrowser) {
  type MockEventsEvent = MockEvent & Events.Event<MockListener>;
  const browser: BrowserInterface & {
    [Key in keyof MockBrowser]: {
      [EventName in MockBrowser[Key][number]]: MockEventsEvent;
    };
  } = {} as never;
  for (const [namespace, events] of Object.entries(namespaces) as Entries) {
    // @ts-expect-error - dynamic assignment
    browser[namespace] = {};
    for (const ev of events) {
      // @ts-expect-error - dynamic assignment
      browser[namespace][ev] = new MockEvent();
    }
  }
  return browser;
}

describe('ExtensionLazyListener', () => {
  beforeEach(() => {
    jest.useRealTimers();
    // ensure `console.error` logging path is taken
    process.env.IN_TEST = 'true';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('buffers calls before a real listener is added and flushes them in order', () => {
    const browser = buildMockBrowser({ runtime: ['onMessage' as const] });
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

  it('constructor without options parameter behaves like empty options', async () => {
    jest.useFakeTimers();
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    // Emit before constructing (should not matter) then after constructing
    browser.runtime.onMessage.trigger('pre');
    const lazy = new ExtensionLazyListener(browser, undefined, 150); // omit options
    browser.runtime.onMessage.trigger('pre2');
    // Add listener; neither pre nor pre2 should have been buffered
    const received: unknown[] = [];
    lazy.addListener('runtime', 'onMessage', (...a) => received.push(a));
    expect(received).toEqual([]);
    browser.runtime.onMessage.trigger('live');
    expect(received).toEqual([['live']]);
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    jest.advanceTimersByTime(151);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('once on namespace with listeners but untracked event waits (listeners truthy, tracker undefined)', async () => {
    // Track only runtime.onFoo lazily, call once on runtime.onBar
    const browser = buildMockBrowser({ runtime: ['onFoo', 'onBar'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onFoo'] });
    // Fire onBar before calling once; should NOT resolve (not buffered)
    browser.runtime.onBar.trigger('early');
    const promise = lazy.once('runtime', 'onBar');
    let resolved;
    promise.then((r) => (resolved = r));
    expect(resolved).toBeUndefined();
    // Trigger after registering temp listener
    browser.runtime.onBar.trigger('later', 123);
    await expect(promise).resolves.toEqual(['later', 123]);
  });

  it('once on completely untracked namespace waits (listeners falsy)', async () => {
    // Browser has a tabs namespace, but we track nothing in options
    const browser = buildMockBrowser({ tabs: ['onActivated'] });
    const lazy = new ExtensionLazyListener(browser, {}); // no namespaces tracked
    // Fire before once; should not resolve
    browser.tabs.onActivated.trigger('early');
    const promise = lazy.once('tabs', 'onActivated');
    let resolved;
    promise.then((r) => (resolved = r));
    expect(resolved).toBeUndefined();
    browser.tabs.onActivated.trigger('later');
    await expect(promise).resolves.toEqual(['later']);
  });

  it('does not buffer further events after flushing (lazy listener removed)', () => {
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

  it('stops flushing buffered calls if listener removes itself mid-flush and leaves remaining buffered', () => {
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
        browser.tabs.onUpdated.removeListener(callback);
      }
    });
    lazy.addListener('tabs', 'onUpdated', callback);
    // We expect calls 1 and 2 to have been delivered, but 3 left buffered.
    expect(received).toEqual([1, 2]);
    // Now add a NEW listener to consume remaining buffered call(s)
    const later: number[] = [];
    lazy.addListener('tabs', 'onUpdated', (n: number) => later.push(n));
    expect(later).toEqual([3]);
  });

  it('if callback throws during flush, remaining buffered calls are preserved', () => {
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
      lazy.addListener('runtime', 'onSuspend', throwing);
    }).toThrow(error);
    // Remaining call should still be buffered.
    const after: string[] = [];
    lazy.addListener('runtime', 'onSuspend', (v: string) => after.push(v));
    expect(after).toEqual(['y']);
  });

  it('once resolves synchronously from buffered call and leaves remaining buffered', async () => {
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

  it('once resolves from buffered calls sequentially', async () => {
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onMessage'] });
    browser.runtime.onMessage.trigger('first');
    browser.runtime.onMessage.trigger('second');
    const p1 = lazy.once('runtime', 'onMessage');
    await expect(p1).resolves.toEqual(['first']);
    const p2 = lazy.once('runtime', 'onMessage');
    await expect(p2).resolves.toEqual(['second']);
  });

  it('once waits for next emission if nothing buffered', async () => {
    const browser = buildMockBrowser({ runtime: ['onInstalled'] });
    const lazy = new ExtensionLazyListener(browser, {
      runtime: ['onInstalled'],
    });
    const promise = lazy.once('runtime', 'onInstalled');
    // Nothing buffered yet.
    let resolved;
    promise.then((r) => (resolved = r));
    expect(resolved).toBeUndefined();
    browser.runtime.onInstalled.trigger('payload', 42);
    await expect(promise).resolves.toEqual(['payload', 42]);
  });

  it('memory leak warning timer logs error in test env', () => {
    jest.useFakeTimers();
    const browser = buildMockBrowser({ runtime: ['onMessage', 'onConnect'] });
    const timeout = 500;
    // spy
    const spy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    // Create instance (starts timer)
    const instance = new ExtensionLazyListener(
      browser,
      { runtime: ['onMessage', 'onConnect'] },
      timeout,
    );
    expect(instance).toBeDefined();
    // Advance but not enough
    jest.advanceTimersByTime(timeout - 1);
    expect(spy).not.toHaveBeenCalled();
    // Now advance to fire
    jest.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(2); // one per event
    const messages = spy.mock.calls.map((c) => c[0]);
    expect(messages[0]).toMatch(/Possible memory leak/u);
    expect(messages[0]).toMatch(/runtime.onMessage/u);
  });

  it('memory leak warning logs warn in non-test env', () => {
    jest.useFakeTimers();
    process.env.IN_TEST = '';
    const browser = buildMockBrowser({ tabs: ['onActivated'] });
    const timeout = 300;
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const lazy = new ExtensionLazyListener(
      browser,
      { tabs: ['onActivated'] },
      timeout,
    );
    expect(lazy).toBeDefined();
    jest.advanceTimersByTime(timeout);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatch(/tabs.onActivated/u);
  });

  it('addListener for event that was not part of Options does not flush prior triggers', () => {
    const browser = buildMockBrowser({ runtime: ['onFoo', 'onBar'] });
    // Only track onFoo lazily
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onFoo'] });
    // Trigger onBar before adding a listener; should NOT be buffered
    browser.runtime.onBar.trigger('pre');
    const received: unknown[] = [];
    lazy.addListener('runtime', 'onBar', (...a) => received.push(a));
    expect(received).toEqual([]);
    browser.runtime.onBar.trigger('post');
    expect(received).toEqual([['post']]);
  });

  it('addListener for namespace never included in Options does not flush prior triggers', () => {
    const browser = buildMockBrowser({
      runtime: ['onFoo'],
      tabs: ['onUpdated'],
    });
    // Only runtime.onFoo tracked
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onFoo'] });
    browser.tabs.onUpdated.trigger('pre');
    const received: unknown[] = [];
    lazy.addListener('tabs', 'onUpdated', (...a) => received.push(a));
    expect(received).toEqual([]);
    browser.tabs.onUpdated.trigger('post');
    expect(received).toEqual([['post']]);
  });

  it('mid-flush removal on last buffered call does not re-add lazy listener', () => {
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onMessage'] });
    browser.runtime.onMessage.trigger('one');
    browser.runtime.onMessage.trigger('two'); // last buffered call
    const received: unknown[] = [];
    const cb = jest.fn((v: string) => {
      received.push(v);
      if (v === 'two') {
        browser.runtime.onMessage.removeListener(cb); // remove on last call
      }
    });
    lazy.addListener('runtime', 'onMessage', cb);
    expect(received).toEqual(['one', 'two']);
    // Fire another event while no listener is attached and ensure it is NOT buffered
    browser.runtime.onMessage.trigger('gap');
    const later: unknown[] = [];
    lazy.addListener('runtime', 'onMessage', (v: string) => later.push(v));
    // 'gap' should not appear because lazy listener was not re-added.
    expect(later).toEqual([]);
    browser.runtime.onMessage.trigger('after');
    expect(later).toEqual(['after']);
  });

  it('error thrown on last buffered call does not re-add lazy listener', () => {
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
      lazy.addListener('runtime', 'onSuspend', throwing);
    }).toThrow(err);
    // Fire another event while no listener attached: should not be buffered
    browser.runtime.onSuspend.trigger('gap');
    const later: string[] = [];
    lazy.addListener('runtime', 'onSuspend', (v: string) => later.push(v));
    expect(later).toEqual([]);
    browser.runtime.onSuspend.trigger('after');
    expect(later).toEqual(['after']);
  });

  it('once with single buffered call removes tracker completely (length===1 branch)', async () => {
    const browser = buildMockBrowser({ runtime: ['onInstalled'] });
    const lazy = new ExtensionLazyListener(browser, {
      runtime: ['onInstalled'],
    });
    browser.runtime.onInstalled.trigger('only');
    const first = await lazy.once('runtime', 'onInstalled');
    expect(first).toEqual(['only']);
    // Second once should wait for a new emission (since tracker removed)
    const secondPromise = lazy.once('runtime', 'onInstalled');
    let resolved: unknown[] | undefined;
    secondPromise.then((r) => (resolved = r));
    expect(resolved).toBeUndefined();
    browser.runtime.onInstalled.trigger('new');
    await expect(secondPromise).resolves.toEqual(['new']);
  });

  it('memory leak warning includes buffered count', () => {
    jest.useFakeTimers();
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    const timeout = 250;
    // Create with lazy listener
    const lazy = new ExtensionLazyListener(
      browser,
      { runtime: ['onMessage'] },
      timeout,
    );
    expect(lazy).toBeDefined();
    // Buffer some calls
    browser.runtime.onMessage.trigger('a');
    browser.runtime.onMessage.trigger('b');
    const spy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    jest.advanceTimersByTime(timeout);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatch(/2 buffered calls/u);
  });

  it('constructor with empty options does not schedule  leak warnings', () => {
    jest.useFakeTimers();
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    const instance = new ExtensionLazyListener(browser, {}, 200);
    expect(instance).toBeDefined();
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    jest.advanceTimersByTime(200);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('addListener with zero buffered calls (tracker exists, empty args) does not flush and delivers subsequent emissions', () => {
    const browser = buildMockBrowser({ runtime: ['onMessage'] });
    const lazy = new ExtensionLazyListener(browser, { runtime: ['onMessage'] });
    const cb = jest.fn();
    // No pre-triggering; tracker args length = 0
    lazy.addListener('runtime', 'onMessage', cb);
    expect(cb).not.toHaveBeenCalled(); // no flush
    // Now emit; should deliver directly
    browser.runtime.onMessage.trigger('later');
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('later');
  });

  describe('TypeScript Types', () => {
    // this browser proxy pretends to have a namespace and event for every
    // possible PropertyKey. It's used for testing types only.
    const everyThingBrowser = new Proxy(
      {},
      {
        // we pretend every namespace has every event, just for type testing
        get: (_target, _prop) =>
          new Proxy({}, { get: (_target2, _prop2) => new MockEvent() }),
      },
    ) as unknown as Browser;

    it('constructor enforces types for tracked namespaces and events', () => {
      let instance = new ExtensionLazyListener(everyThingBrowser, {
        // valid namespace and event
        runtime: ['onInstalled', 'onMessage'],
        tabs: ['onUpdated'],
        // @ts-expect-error - invalid namespace
        invalidNamespace: ['onFoo'],
      });
      instance = new ExtensionLazyListener(everyThingBrowser, {
        alarms: [
          'onAlarm',
          // @ts-expect-error - invalid param
          'onMessage',
        ],
      });

      instance = new ExtensionLazyListener(everyThingBrowser, {
        urlbar: [
          'onResultPicked',
          // @ts-expect-error - `onResultsRequested` doesn't have a listener
          // with a return type of `void`, and so it is not permitted by the
          // type system.
          'onResultsRequested',
        ],
      });
      expect(instance).toBeDefined();
    });

    it('`once` enforces types for tracked namespaces and events', () => {
      const instance = new ExtensionLazyListener(everyThingBrowser);

      function onMessageGood(
        _args: [unknown, Runtime.MessageSender, () => void],
      ) {
        // intentionally empty
      }
      // this is valid
      instance.once('runtime', 'onMessage').then(onMessageGood);

      function onMessageBad(
        _args: [unknown, 'not the right type', () => void],
      ) {
        // intentionally empty
      }
      // @ts-expect-error - onMessageBad is the wrong type
      instance.once('runtime', 'onMessage').then(onMessageBad);
      expect(instance).toBeDefined();
    });

    it('`addListener` enforces types for tracked namespaces and events', () => {
      const instance = new ExtensionLazyListener(everyThingBrowser);

      function onMessageGood(
        _msg: unknown,
        _sender: Runtime.MessageSender,
        _sendResponse: () => void,
      ) {
        // intentionally empty
      }
      // this is valid
      instance.addListener('runtime', 'onMessage', onMessageGood);
      function onMessageBad(
        _msg: unknown,
        _sender: 'not the right type',
        _sendResponse: () => void,
      ) {
        // intentionally empty
      }

      // @ts-expect-error - onMessageBad is the wrong type
      instance.addListener('runtime', 'onMessage', onMessageBad);
      expect(instance).toBeDefined();
    });
  });
});
