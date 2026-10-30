import * as braze from '@braze/web-sdk';
import type { BrazeSdk } from './braze-sdk';
import { createBrazeHost } from './braze-host';

// Bypass the global SDK stub: these tests exercise the real SDK lifecycle.
jest.mock('@braze/web-sdk', () =>
  jest.requireActual('@braze/web-sdk/src/index.js'),
);

const sdk = braze as unknown as BrazeSdk;
const send = () => jest.mocked(window.XMLHttpRequest.prototype.send);
const queuedEvents = () =>
  send().mock.calls.flatMap(
    ([body]) => JSON.parse(String(body)).events ?? [],
  ) as { name: string }[];

/**
 * Emulate the LavaMoat policy: the SDK is not granted `localStorage`, so the
 * global is undefined and the SDK falls back to its in-memory store.
 */
const denyLocalStorage = () => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: undefined,
  });
};

const restoreLocalStorage = () => {
  delete (window as { localStorage?: Storage }).localStorage;
};

describe('Braze SDK lifecycle in the host', () => {
  const originalEnv = process.env;
  const { indexedDB } = window;
  let documentHidden = false;
  let syncBrazeUser: ReturnType<typeof createBrazeHost>;

  beforeEach(() => {
    jest.useFakeTimers();
    process.env = {
      ...originalEnv,
      BRAZE_WEB_API_KEY: 'test-key',
      BRAZE_SDK_ENDPOINT: 'sdk.example.com',
    };
    delete process.env.IN_TEST;
    delete process.env.METAMASK_DEBUG;
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Chrome reports offscreen documents as visible. MV2 background pages can
    // be hidden; individual tests override this.
    documentHidden = false;
    jest
      .spyOn(document, 'hidden', 'get')
      .mockImplementation(() => documentHidden);
    // LavaMoat does not grant the SDK `indexedDB` or `localStorage`; remove
    // Jest's fakes so these tests run under the same conditions.
    delete (window as { indexedDB?: IDBFactory }).indexedDB;
    denyLocalStorage();
    // Network I/O is blocked at the browser boundary.
    jest
      .spyOn(window.XMLHttpRequest.prototype, 'send')
      .mockImplementation(function (this: XMLHttpRequest) {
        Object.defineProperties(this, {
          readyState: { configurable: true, value: 4 },
          status: { configurable: true, value: 200 },
          responseText: { configurable: true, value: '{}' },
        });
        this.onload?.(new window.ProgressEvent('load'));
      });
    syncBrazeUser = createBrazeHost({ loadSdk: async () => sdk });
  });

  afterEach(() => {
    braze.wipeData();
    braze.destroy();
    restoreLocalStorage();
    jest.useRealTimers();
    process.env = originalEnv;
    window.indexedDB = indexedDB;
  });

  it('identifies the canonical profile ID and starts a session', async () => {
    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
    expect(queuedEvents().map(({ name }) => name)).toContain('ss');
  });

  it('does not report the screen resolution', async () => {
    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);

    const device = send()
      .mock.calls.map(([body]) => JSON.parse(String(body)).device)
      .find(Boolean);

    expect(device).toBeDefined();
    expect(device).not.toHaveProperty('resolution');
    expect(device).toHaveProperty('user_agent');
  });

  it('flushes identity from a hidden document', async () => {
    documentHidden = true;

    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
    expect(queuedEvents().map(({ name }) => name)).toContain('ss');
  });

  it('does not send anything when the same user is synced again', async () => {
    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    send().mockClear();

    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(60_000);

    expect(send()).not.toHaveBeenCalled();
  });

  it('stops all SDK traffic after clearing', async () => {
    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    expect(braze.logCustomEvent('queued-before-opt-out')).toBe(true);
    send().mockClear();

    await syncBrazeUser(null);
    await jest.advanceTimersByTimeAsync(60_000);

    expect(braze.isInitialized()).toBe(false);
    expect(send()).not.toHaveBeenCalled();
  });

  it('identifies the same user again after clearing', async () => {
    await syncBrazeUser('canonical-123');
    await syncBrazeUser(null);

    await syncBrazeUser('canonical-123');

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
  });

  it('does not load the SDK to clear after a restart', async () => {
    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    // Background restart (MV3 service worker / MV2 page reload): the in-memory
    // store goes away with the host, so there is nothing left to wipe.
    braze.destroy();
    send().mockClear();

    await createBrazeHost({ loadSdk: async () => sdk })(null);
    await jest.advanceTimersByTimeAsync(60_000);

    expect(braze.isInitialized()).toBe(false);
    expect(send()).not.toHaveBeenCalled();
  });

  it('starts a new session when a new host identifies the same user', async () => {
    await syncBrazeUser('canonical-123');
    await jest.advanceTimersByTimeAsync(0);
    braze.destroy();
    send().mockClear();

    await createBrazeHost({ loadSdk: async () => sdk })('canonical-123');
    await jest.advanceTimersByTimeAsync(0);

    expect(braze.getUser()?.getUserId()).toBe('canonical-123');
    // Nothing survives a restart without a storage grant, so the new host
    // opens a new Braze session. The background re-identifies the user.
    expect(queuedEvents().map(({ name }) => name)).toContain('ss');
  });
});
